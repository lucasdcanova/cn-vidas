import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth";
import { db } from "../db";
import { 
  partners, 
  users,
  partnerCollaborators,
  partnerSubscriptions,
  partnerSubscriptionPlans
} from "../../shared/schema";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from "../utils/email";

const router = Router();

// Estender tipo Request para incluir partner
declare module 'express-serve-static-core' {
  interface Request {
    partner?: any;
  }
}

// Middleware para verificar se o usuário é o dono do parceiro
const isPartnerOwner = async (req: any, res: any, next: any) => {
  console.log("🔐 [isPartnerOwner] Verificando parceiro para rota:", req.path);
  const userId = req.user?.id;
  console.log("🔐 [isPartnerOwner] User ID:", userId);
  
  if (!userId) {
    console.log("❌ [isPartnerOwner] Usuário não autenticado");
    return res.status(401).json({ error: "Não autorizado" });
  }
  
  try {
    const partner = await db.select()
      .from(partners)
      .where(eq(partners.userId, userId))
      .limit(1);
    
    console.log("🔍 [isPartnerOwner] Parceiro encontrado:", partner.length);
    
    if (!partner.length) {
      console.log("❌ [isPartnerOwner] Parceiro não encontrado para userId:", userId);
      return res.status(403).json({ error: "Acesso negado. Parceiro não encontrado." });
    }
    
    console.log("✅ [isPartnerOwner] Parceiro:", partner[0].businessName, "Status:", partner[0].status);
    
    // Temporariamente permitindo parceiros pendentes acessarem colaboradores
    // TODO: Revisar esta política de acesso após definição de regras de negócio
    /*
    if (partner[0].status !== 'approved') {
      return res.status(403).json({ error: "Acesso negado. Parceiro não aprovado." });
    }
    */
    
    req.partner = partner[0];
    next();
  } catch (error) {
    console.error("Erro ao verificar parceiro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Listar colaboradores
router.get("/", authenticateToken, isPartnerOwner, async (req, res) => {
  console.log("🔍 [Collaborators] GET / - Listando colaboradores");
  try {
    const partnerId = req.partner.id;
    console.log("🔍 [Collaborators] Partner ID:", partnerId);
    
    const collaborators = await db.select({
      id: partnerCollaborators.id,
      userId: partnerCollaborators.userId,
      role: partnerCollaborators.role,
      department: partnerCollaborators.department,
      status: partnerCollaborators.status,
      invitationSentAt: partnerCollaborators.invitationSentAt,
      invitationAcceptedAt: partnerCollaborators.invitationAcceptedAt,
      canManageServices: partnerCollaborators.canManageServices,
      canViewAnalytics: partnerCollaborators.canViewAnalytics,
      canManageCollaborators: partnerCollaborators.canManageCollaborators,
      canAccessBilling: partnerCollaborators.canAccessBilling,
      createdAt: partnerCollaborators.createdAt,
      user: {
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        profileImage: users.profileImage
      }
    })
    .from(partnerCollaborators)
    .leftJoin(users, eq(partnerCollaborators.userId, users.id))
    .where(eq(partnerCollaborators.partnerId, partnerId))
    .orderBy(desc(partnerCollaborators.createdAt));
    
    console.log("✅ [Collaborators] Encontrados", collaborators.length, "colaboradores");
    res.json(collaborators);
  } catch (error) {
    console.error("❌ [Collaborators] Erro ao listar colaboradores:", error);
    res.status(500).json({ error: "Erro ao listar colaboradores" });
  }
});

// Convidar colaborador
router.post("/invite", authenticateToken, isPartnerOwner, async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const { email, fullName, department, role = 'collaborator', permissions } = req.body;
    
    if (!email || !fullName) {
      return res.status(400).json({ error: "Email e nome completo são obrigatórios" });
    }
    
    // Verificar limite de colaboradores do plano
    const subscription = await db.select({
      maxCollaborators: partnerSubscriptionPlans.maxCollaborators
    })
    .from(partnerSubscriptions)
    .innerJoin(partnerSubscriptionPlans, eq(partnerSubscriptions.planId, partnerSubscriptionPlans.id))
    .where(and(
      eq(partnerSubscriptions.partnerId, partnerId),
      eq(partnerSubscriptions.status, 'active')
    ))
    .limit(1);
    
    if (subscription.length > 0 && subscription[0].maxCollaborators) {
      const currentCollaborators = await db.select()
        .from(partnerCollaborators)
        .where(and(
          eq(partnerCollaborators.partnerId, partnerId),
          eq(partnerCollaborators.status, 'active')
        ));
      
      if (currentCollaborators.length >= subscription[0].maxCollaborators) {
        return res.status(400).json({ 
          error: `Limite de colaboradores atingido. Seu plano permite até ${subscription[0].maxCollaborators} colaboradores.` 
        });
      }
    }
    
    // Verificar se o email já está em uso
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    let userId: number;
    
    if (existingUser.length > 0) {
      // Verificar se já é colaborador
      const existingCollaborator = await db.select()
        .from(partnerCollaborators)
        .where(and(
          eq(partnerCollaborators.partnerId, partnerId),
          eq(partnerCollaborators.userId, existingUser[0].id)
        ))
        .limit(1);
      
      if (existingCollaborator.length > 0) {
        return res.status(400).json({ error: "Este usuário já é um colaborador" });
      }
      
      userId = existingUser[0].id;
    } else {
      // Criar novo usuário
      const tempPassword = uuidv4().slice(0, 8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const username = email.split('@')[0] + '_' + Date.now();
      
      const newUser = await db.insert(users).values({
        email,
        username,
        password: hashedPassword,
        fullName,
        role: 'patient', // Colaboradores são criados como pacientes
        isActive: true,
        emailVerified: false
      }).returning();
      
      userId = newUser[0].id;
    }
    
    // Criar token de convite
    const invitationToken = uuidv4();
    
    // Criar colaborador
    const collaborator = await db.insert(partnerCollaborators).values({
      partnerId,
      userId,
      role,
      department,
      invitationToken,
      invitationSentAt: new Date(),
      status: 'pending',
      canManageServices: permissions?.canManageServices || false,
      canViewAnalytics: permissions?.canViewAnalytics || false,
      canManageCollaborators: permissions?.canManageCollaborators || false,
      canAccessBilling: permissions?.canAccessBilling || false
    }).returning();
    
    // Enviar email de convite
    const inviteLink = `${process.env.FRONTEND_URL}/partner/accept-invite?token=${invitationToken}`;
    
    await sendEmail({
      to: email,
      subject: `Convite para colaborar com ${req.partner.businessName}`,
      html: `
        <h2>Você foi convidado para colaborar!</h2>
        <p>Olá ${fullName},</p>
        <p>${req.partner.businessName} convidou você para ser um colaborador na plataforma CNVidas.</p>
        <p>Como colaborador, você terá acesso aos serviços oferecidos pela empresa.</p>
        <p>Para aceitar o convite, clique no link abaixo:</p>
        <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Aceitar Convite</a>
        <p>Se você não esperava este convite, pode ignorar este email.</p>
        <br>
        <p>Atenciosamente,<br>Equipe CNVidas</p>
      `
    });
    
    res.json({ 
      success: true, 
      collaborator: collaborator[0],
      message: "Convite enviado com sucesso" 
    });
  } catch (error) {
    console.error("Erro ao convidar colaborador:", error);
    res.status(500).json({ error: "Erro ao convidar colaborador" });
  }
});

// Aceitar convite
router.post("/accept-invite", async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: "Token de convite é obrigatório" });
    }
    
    const collaborator = await db.select()
      .from(partnerCollaborators)
      .where(eq(partnerCollaborators.invitationToken, token))
      .limit(1);
    
    if (!collaborator.length) {
      return res.status(404).json({ error: "Convite inválido ou expirado" });
    }
    
    if (collaborator[0].status !== 'pending') {
      return res.status(400).json({ error: "Este convite já foi utilizado" });
    }
    
    // Atualizar status do colaborador
    await db.update(partnerCollaborators)
      .set({
        status: 'active',
        invitationAcceptedAt: new Date(),
        invitationToken: null
      })
      .where(eq(partnerCollaborators.id, collaborator[0].id));
    
    // Buscar informações do parceiro
    const partner = await db.select()
      .from(partners)
      .where(eq(partners.id, collaborator[0].partnerId))
      .limit(1);
    
    res.json({ 
      success: true,
      message: "Convite aceito com sucesso",
      partner: partner[0]
    });
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);
    res.status(500).json({ error: "Erro ao aceitar convite" });
  }
});

// Atualizar permissões do colaborador
router.put("/:id", authenticateToken, isPartnerOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    const { role, department, permissions } = req.body;
    
    // Verificar se o colaborador pertence ao parceiro
    const collaborator = await db.select()
      .from(partnerCollaborators)
      .where(and(
        eq(partnerCollaborators.id, parseInt(id)),
        eq(partnerCollaborators.partnerId, partnerId)
      ))
      .limit(1);
    
    if (!collaborator.length) {
      return res.status(404).json({ error: "Colaborador não encontrado" });
    }
    
    // Atualizar colaborador
    const updated = await db.update(partnerCollaborators)
      .set({
        role: role || collaborator[0].role,
        department: department !== undefined ? department : collaborator[0].department,
        canManageServices: permissions?.canManageServices ?? collaborator[0].canManageServices,
        canViewAnalytics: permissions?.canViewAnalytics ?? collaborator[0].canViewAnalytics,
        canManageCollaborators: permissions?.canManageCollaborators ?? collaborator[0].canManageCollaborators,
        canAccessBilling: permissions?.canAccessBilling ?? collaborator[0].canAccessBilling,
        updatedAt: new Date()
      })
      .where(eq(partnerCollaborators.id, parseInt(id)))
      .returning();
    
    res.json(updated[0]);
  } catch (error) {
    console.error("Erro ao atualizar colaborador:", error);
    res.status(500).json({ error: "Erro ao atualizar colaborador" });
  }
});

// Remover colaborador
router.delete("/:id", authenticateToken, isPartnerOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const partnerId = req.partner.id;
    
    // Verificar se o colaborador pertence ao parceiro
    const collaborator = await db.select()
      .from(partnerCollaborators)
      .where(and(
        eq(partnerCollaborators.id, parseInt(id)),
        eq(partnerCollaborators.partnerId, partnerId)
      ))
      .limit(1);
    
    if (!collaborator.length) {
      return res.status(404).json({ error: "Colaborador não encontrado" });
    }
    
    // Remover colaborador
    await db.delete(partnerCollaborators)
      .where(eq(partnerCollaborators.id, parseInt(id)));
    
    res.json({ success: true, message: "Colaborador removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover colaborador:", error);
    res.status(500).json({ error: "Erro ao remover colaborador" });
  }
});

// Verificar se o usuário é colaborador de algum parceiro
router.get("/my-partnerships", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    
    const collaborations = await db.select({
      collaborator: partnerCollaborators,
      partner: partners
    })
    .from(partnerCollaborators)
    .innerJoin(partners, eq(partnerCollaborators.partnerId, partners.id))
    .where(and(
      eq(partnerCollaborators.userId, userId as number),
      eq(partnerCollaborators.status, 'active')
    ));
    
    res.json(collaborations);
  } catch (error) {
    console.error("Erro ao buscar parcerias:", error);
    res.status(500).json({ error: "Erro ao buscar parcerias" });
  }
});

export { router as partnerCollaboratorsRouter };