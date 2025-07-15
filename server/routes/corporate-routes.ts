import { Router } from "express";
import { eq, and, gte, lte, or, sql, desc } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth";
import { db } from "../db";
import { 
  partners,
  users,
  corporateSubscriptionPlans,
  corporateSubscriptions,
  corporateInvitations,
  corporateEmployees,
  corporateUsageReports,
  medicalCertificates,
  appointments,
  claims,
  notifications
} from "../../shared/schema";
import Stripe from "stripe";
import { sendEmail } from "../services/email";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Middleware para verificar se é parceiro
const isPartner = async (req: any, res: any, next: any) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  
  try {
    const partner = await db.select()
      .from(partners)
      .where(eq(partners.userId, userId))
      .limit(1);
    
    if (!partner.length) {
      return res.status(403).json({ error: "Acesso negado. Apenas parceiros." });
    }
    
    req.partner = partner[0];
    
    // Buscar assinatura ativa se o parceiro for corporativo
    if (partner[0].isCorporate) {
      const subscription = await db.select()
        .from(corporateSubscriptions)
        .where(and(
          eq(corporateSubscriptions.partnerId, partner[0].id),
          eq(corporateSubscriptions.status, 'active')
        ))
        .limit(1);
      
      req.corporateSubscription = subscription[0] || null;
    }
    
    next();
  } catch (error) {
    console.error("Erro ao verificar parceiro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Obter assinatura corporativa atual
router.get("/subscription/current", authenticateToken, isPartner, async (req, res) => {
  try {
    if (!req.corporateSubscription) {
      return res.status(404).json({ error: "Nenhuma assinatura corporativa ativa" });
    }
    
    res.json(req.corporateSubscription);
  } catch (error) {
    console.error("Erro ao buscar assinatura atual:", error);
    res.status(500).json({ error: "Erro ao buscar assinatura" });
  }
});

// Listar planos corporativos disponíveis
router.get("/plans", async (req, res) => {
  try {
    const plans = await db.select()
      .from(corporateSubscriptionPlans)
      .where(eq(corporateSubscriptionPlans.isActive, true))
      .orderBy(corporateSubscriptionPlans.planType, corporateSubscriptionPlans.minEmployees);
    
    // Agrupar por tipo de plano
    const groupedPlans = plans.reduce((acc, plan) => {
      if (!acc[plan.planType]) {
        acc[plan.planType] = {
          planType: plan.planType,
          displayName: plan.planType.replace('_corp', '').charAt(0).toUpperCase() + 
                       plan.planType.replace('_corp', '').slice(1) + ' Corporativo',
          tiers: []
        };
      }
      
      acc[plan.planType].tiers.push({
        id: plan.id,
        minEmployees: plan.minEmployees,
        maxEmployees: plan.maxEmployees,
        pricePerEmployee: plan.monthlyPricePerEmployee,
        tierLabel: plan.maxEmployees ? 
          `${plan.minEmployees}-${plan.maxEmployees} vidas` : 
          `${plan.minEmployees}+ vidas`
      });
      
      return acc;
    }, {} as any);
    
    res.json(Object.values(groupedPlans));
  } catch (error) {
    console.error("Erro ao listar planos corporativos:", error);
    res.status(500).json({ error: "Erro ao listar planos" });
  }
});

// Criar/Atualizar assinatura corporativa
router.post("/subscribe", authenticateToken, isPartner, async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const { planType, employeeCount, billingPeriod = 'monthly', paymentMethodId } = req.body;
    
    if (!planType || !employeeCount || employeeCount < 5) {
      return res.status(400).json({ error: "Dados inválidos. Mínimo de 5 colaboradores." });
    }
    
    // Encontrar o plano correto baseado no número de funcionários
    const plan = await db.select()
      .from(corporateSubscriptionPlans)
      .where(and(
        eq(corporateSubscriptionPlans.planType, planType),
        eq(corporateSubscriptionPlans.isActive, true),
        lte(corporateSubscriptionPlans.minEmployees, employeeCount),
        or(
          gte(corporateSubscriptionPlans.maxEmployees, employeeCount),
          sql`${corporateSubscriptionPlans.maxEmployees} IS NULL`
        )
      ))
      .limit(1);
    
    if (!plan.length) {
      return res.status(404).json({ error: "Plano não encontrado para essa quantidade de colaboradores" });
    }
    
    const selectedPlan = plan[0];
    
    // Calcular preço com desconto
    let discountPercentage = 0;
    if (billingPeriod === 'semiannual') discountPercentage = 5;
    if (billingPeriod === 'annual') discountPercentage = 8;
    
    const basePrice = parseFloat(selectedPlan.monthlyPricePerEmployee) * employeeCount;
    const discountAmount = basePrice * (discountPercentage / 100);
    const finalMonthlyPrice = basePrice - discountAmount;
    
    // Determinar tier
    let employeeTier = '5-50';
    if (employeeCount > 50 && employeeCount <= 200) employeeTier = '51-200';
    if (employeeCount > 200) employeeTier = '201+';
    
    // Cancelar assinatura anterior se existir
    if (req.corporateSubscription) {
      await db.update(corporateSubscriptions)
        .set({ 
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(corporateSubscriptions.id, req.corporateSubscription.id));
      
      // Cancelar no Stripe também
      if (req.corporateSubscription.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(req.corporateSubscription.stripeSubscriptionId);
      }
    }
    
    // Criar assinatura no Stripe
    let stripeCustomerId = req.partner.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.partner.businessName,
        metadata: {
          partnerId: partnerId.toString(),
          type: 'corporate'
        }
      });
      
      stripeCustomerId = customer.id;
      
      await db.update(partners)
        .set({ stripeCustomerId })
        .where(eq(partners.id, partnerId));
    }
    
    // Criar produto e preço no Stripe
    const product = await stripe.products.create({
      name: `${selectedPlan.planType} - ${employeeTier}`,
      metadata: {
        planType: selectedPlan.planType,
        employeeTier,
        employeeCount: employeeCount.toString()
      }
    });
    
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(finalMonthlyPrice * 100), // Em centavos
      currency: 'brl',
      recurring: {
        interval: billingPeriod === 'annual' ? 'year' : 
                  billingPeriod === 'semiannual' ? 'month' : 'month',
        interval_count: billingPeriod === 'semiannual' ? 6 : 1
      }
    });
    
    // Anexar método de pagamento se fornecido
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });
      
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }
    
    // Criar assinatura no Stripe
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card', 'boleto']
      },
      expand: ['latest_invoice.payment_intent']
    });
    
    // Criar assinatura no banco
    const newSubscription = await db.insert(corporateSubscriptions).values({
      partnerId,
      planType: selectedPlan.planType,
      employeeTier,
      monthlyPricePerEmployee: selectedPlan.monthlyPricePerEmployee,
      billingPeriod,
      discountPercentage: discountPercentage.toString(),
      status: 'active',
      currentBillingDate: new Date().toISOString().split('T')[0],
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      stripeSubscriptionId: stripeSubscription.id
    }).returning();
    
    // Marcar parceiro como corporativo
    await db.update(partners)
      .set({ 
        isCorporate: true,
        updatedAt: new Date()
      })
      .where(eq(partners.id, partnerId));
    
    res.json({
      success: true,
      subscription: newSubscription[0],
      clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret,
      message: "Assinatura corporativa criada com sucesso"
    });
  } catch (error: any) {
    console.error("Erro ao criar assinatura corporativa:", error);
    res.status(500).json({ error: error.message || "Erro ao processar assinatura" });
  }
});

// Convidar colaborador
router.post("/employees/invite", authenticateToken, isPartner, async (req, res) => {
  try {
    if (!req.corporateSubscription) {
      return res.status(403).json({ error: "Você precisa de uma assinatura ativa para convidar colaboradores" });
    }
    
    const { email, fullName } = req.body;
    const partnerId = req.partner.id;
    
    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório" });
    }
    
    // Verificar se já existe convite pendente
    const existingInvite = await db.select()
      .from(corporateInvitations)
      .where(and(
        eq(corporateInvitations.partnerId, partnerId),
        eq(corporateInvitations.email, email),
        eq(corporateInvitations.status, 'pending')
      ))
      .limit(1);
    
    if (existingInvite.length) {
      return res.status(400).json({ error: "Já existe um convite pendente para este email" });
    }
    
    // Verificar se usuário já é colaborador
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length && existingUser[0].corporatePartnerId === partnerId) {
      return res.status(400).json({ error: "Este usuário já é um colaborador ativo" });
    }
    
    // Criar token de convite
    const invitationToken = uuidv4();
    
    // Salvar convite
    const invitation = await db.insert(corporateInvitations).values({
      partnerId,
      email,
      fullName,
      invitationToken,
      status: 'pending'
    }).returning();
    
    // Enviar email de convite
    const inviteUrl = `${process.env.CLIENT_URL}/corporate-invite/${invitationToken}`;
    
    await sendEmail({
      to: email,
      subject: `Convite para CNVidas - ${req.partner.businessName}`,
      html: `
        <h2>Você foi convidado para CNVidas!</h2>
        <p>${req.partner.businessName} convidou você para acessar os benefícios de saúde CNVidas.</p>
        <p>Com sua conta você terá acesso a:</p>
        <ul>
          <li>Consultas médicas online</li>
          <li>Atendimento de emergência</li>
          <li>Descontos em consultas com especialistas</li>
          <li>Seguro de internação hospitalar</li>
        </ul>
        <p>Clique no link abaixo para aceitar o convite e criar sua conta:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Aceitar Convite
        </a>
        <p>Este convite expira em 7 dias.</p>
      `
    });
    
    res.json({
      success: true,
      invitation: invitation[0],
      message: "Convite enviado com sucesso"
    });
  } catch (error: any) {
    console.error("Erro ao enviar convite:", error);
    res.status(500).json({ error: error.message || "Erro ao enviar convite" });
  }
});

// Listar colaboradores
router.get("/employees", authenticateToken, isPartner, async (req, res) => {
  try {
    const partnerId = req.partner.id;
    
    // Buscar colaboradores ativos
    const employees = await db.select({
      employee: corporateEmployees,
      user: users
    })
    .from(corporateEmployees)
    .innerJoin(users, eq(corporateEmployees.userId, users.id))
    .where(and(
      eq(corporateEmployees.partnerId, partnerId),
      eq(corporateEmployees.status, 'active')
    ))
    .orderBy(desc(corporateEmployees.addedAt));
    
    // Buscar convites pendentes
    const pendingInvites = await db.select()
      .from(corporateInvitations)
      .where(and(
        eq(corporateInvitations.partnerId, partnerId),
        eq(corporateInvitations.status, 'pending'),
        gte(corporateInvitations.expiresAt, new Date())
      ))
      .orderBy(desc(corporateInvitations.invitedAt));
    
    res.json({
      employees: employees.map(e => ({
        id: e.employee.id,
        userId: e.user.id,
        email: e.user.email,
        fullName: e.user.fullName,
        phone: e.user.phone,
        addedAt: e.employee.addedAt,
        lastActiveAt: e.employee.lastActiveAt,
        status: e.employee.status
      })),
      pendingInvites: pendingInvites.map(i => ({
        id: i.id,
        email: i.email,
        fullName: i.fullName,
        invitedAt: i.invitedAt,
        expiresAt: i.expiresAt
      })),
      activeCount: employees.length,
      totalCount: employees.length + pendingInvites.length
    });
  } catch (error) {
    console.error("Erro ao listar colaboradores:", error);
    res.status(500).json({ error: "Erro ao listar colaboradores" });
  }
});

// Remover colaborador
router.delete("/employees/:employeeId", authenticateToken, isPartner, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const partnerId = req.partner.id;
    
    // Buscar colaborador
    const employee = await db.select()
      .from(corporateEmployees)
      .where(and(
        eq(corporateEmployees.id, parseInt(employeeId)),
        eq(corporateEmployees.partnerId, partnerId)
      ))
      .limit(1);
    
    if (!employee.length) {
      return res.status(404).json({ error: "Colaborador não encontrado" });
    }
    
    // Marcar como removido
    await db.update(corporateEmployees)
      .set({ 
        status: 'removed',
        removedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(corporateEmployees.id, parseInt(employeeId)));
    
    // Remover vínculo do usuário
    await db.update(users)
      .set({ 
        corporatePartnerId: null,
        isCorporateUser: false,
        corporatePlanType: null,
        subscriptionPlan: 'free',
        updatedAt: new Date()
      })
      .where(eq(users.id, employee[0].userId));
    
    // Criar notificação para o usuário
    await db.insert(notifications).values({
      userId: employee[0].userId,
      title: "Plano Corporativo Removido",
      message: "Seu acesso ao plano corporativo foi removido. Você foi migrado para o plano gratuito.",
      type: "subscription_change"
    });
    
    res.json({
      success: true,
      message: "Colaborador removido com sucesso"
    });
  } catch (error) {
    console.error("Erro ao remover colaborador:", error);
    res.status(500).json({ error: "Erro ao remover colaborador" });
  }
});

// Gerar relatório de uso
router.get("/reports/usage/:month", authenticateToken, isPartner, async (req, res) => {
  try {
    const { month } = req.params; // formato: YYYY-MM
    const partnerId = req.partner.id;
    const { format: outputFormat = 'json' } = req.query;
    
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    // Buscar dados do relatório
    const employees = await db.select()
      .from(corporateEmployees)
      .where(and(
        eq(corporateEmployees.partnerId, partnerId),
        lte(corporateEmployees.addedAt, endDate)
      ));
    
    const activeEmployees = employees.filter(e => 
      !e.removedAt || new Date(e.removedAt) > endDate
    );
    
    // Buscar consultas do mês
    const consultations = await db.select()
      .from(appointments)
      .innerJoin(users, eq(appointments.userId, users.id))
      .where(and(
        eq(users.corporatePartnerId, partnerId),
        gte(appointments.date, startDate),
        lte(appointments.date, endDate),
        eq(appointments.status, 'completed')
      ));
    
    // Buscar sinistros
    const userClaims = await db.select()
      .from(claims)
      .innerJoin(users, eq(claims.userId, users.id))
      .where(and(
        eq(users.corporatePartnerId, partnerId),
        gte(claims.createdAt, startDate),
        lte(claims.createdAt, endDate)
      ));
    
    // Buscar atestados médicos
    const certificates = await db.select()
      .from(medicalCertificates)
      .where(and(
        eq(medicalCertificates.corporatePartnerId, partnerId),
        gte(medicalCertificates.issuedAt, startDate),
        lte(medicalCertificates.issuedAt, endDate)
      ));
    
    const reportData = {
      company: req.partner.businessName,
      month: format(startDate, 'MMMM yyyy', { locale: ptBR }),
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      summary: {
        totalEmployees: activeEmployees.length,
        totalConsultations: consultations.length,
        totalEmergencyConsultations: consultations.filter(c => c.appointments.isEmergency).length,
        totalClaims: userClaims.length,
        totalSickDays: certificates.reduce((sum, cert) => sum + cert.sickDays, 0),
        totalMedicalCertificates: certificates.length
      },
      consultations: consultations.map(c => ({
        date: c.appointments.date,
        employeeName: c.users.fullName,
        type: c.appointments.isEmergency ? 'Emergência' : 'Agendada',
        specialty: c.appointments.specialization
      })),
      medicalCertificates: certificates.map(cert => ({
        issueDate: cert.issuedAt,
        sickDays: cert.sickDays,
        period: {
          start: cert.startDate,
          end: cert.endDate
        },
        cidCode: cert.cidCode || 'Não informado',
        diagnosis: cert.diagnosisDescription || 'Não informado'
      })),
      claims: userClaims.map(c => ({
        date: c.claims.createdAt,
        type: c.claims.type,
        status: c.claims.status,
        amount: c.claims.amountRequested
      }))
    };
    
    // Salvar relatório no banco
    await db.insert(corporateUsageReports).values({
      partnerId,
      reportMonth: startDate.toISOString().split('T')[0],
      totalEmployees: reportData.summary.totalEmployees,
      totalConsultations: reportData.summary.totalConsultations,
      totalEmergencyConsultations: reportData.summary.totalEmergencyConsultations,
      totalClaims: reportData.summary.totalClaims,
      totalSickDays: reportData.summary.totalSickDays,
      reportData: reportData as any
    });
    
    // Retornar em JSON ou CSV
    if (outputFormat === 'csv') {
      // Gerar CSV
      const csv = generateCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-${month}.csv`);
      res.send(csv);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ error: "Erro ao gerar relatório" });
  }
});

// Atualizar white-label
router.put("/white-label", authenticateToken, isPartner, async (req, res) => {
  try {
    const { brandColorPrimary, brandColorSecondary } = req.body;
    const partnerId = req.partner.id;
    
    const updateData: any = { updatedAt: new Date() };
    
    if (brandColorPrimary) updateData.brandColorPrimary = brandColorPrimary;
    if (brandColorSecondary) updateData.brandColorSecondary = brandColorSecondary;
    
    await db.update(partners)
      .set(updateData)
      .where(eq(partners.id, partnerId));
    
    res.json({
      success: true,
      message: "Cores atualizadas com sucesso"
    });
  } catch (error) {
    console.error("Erro ao atualizar white-label:", error);
    res.status(500).json({ error: "Erro ao atualizar configurações" });
  }
});

// Upload de logo
router.post("/white-label/logo", authenticateToken, isPartner, async (req, res) => {
  // Implementar upload de logo
  // Por enquanto retornando placeholder
  res.json({
    success: true,
    logoUrl: "https://placeholder.com/logo.png",
    message: "Funcionalidade de upload será implementada"
  });
});

// Validar convite corporativo
router.get("/invitations/validate/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await db.select({
      invitation: corporateInvitations,
      partner: partners
    })
    .from(corporateInvitations)
    .innerJoin(partners, eq(corporateInvitations.partnerId, partners.id))
    .where(eq(corporateInvitations.invitationToken, token))
    .limit(1);
    
    if (!invitation.length) {
      return res.status(404).json({ error: "Convite não encontrado" });
    }
    
    const inv = invitation[0];
    
    // Verificar se expirou
    if (new Date(inv.invitation.expiresAt) < new Date()) {
      return res.status(400).json({ error: "Este convite expirou" });
    }
    
    // Verificar se já foi aceito
    if (inv.invitation.status === 'accepted') {
      return res.status(400).json({ error: "Este convite já foi utilizado" });
    }
    
    // Buscar plano corporativo ativo
    const subscription = await db.select()
      .from(corporateSubscriptions)
      .where(and(
        eq(corporateSubscriptions.partnerId, inv.partner.id),
        eq(corporateSubscriptions.status, 'active')
      ))
      .limit(1);
    
    if (!subscription.length) {
      return res.status(400).json({ error: "A empresa não possui um plano corporativo ativo" });
    }
    
    res.json({
      id: inv.invitation.id,
      partnerName: inv.partner.businessName,
      planType: subscription[0].planType,
      email: inv.invitation.email,
      fullName: inv.invitation.fullName,
      status: inv.invitation.status,
      expiresAt: inv.invitation.expiresAt
    });
  } catch (error) {
    console.error("Erro ao validar convite:", error);
    res.status(500).json({ error: "Erro ao validar convite" });
  }
});

// Aceitar convite corporativo
router.post("/invitations/accept/:token", authenticateToken, async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }
    
    // Buscar convite com informações do parceiro
    const invitation = await db.select({
      invitation: corporateInvitations,
      partner: partners
    })
    .from(corporateInvitations)
    .innerJoin(partners, eq(corporateInvitations.partnerId, partners.id))
    .where(eq(corporateInvitations.invitationToken, token))
    .limit(1);
    
    if (!invitation.length) {
      return res.status(404).json({ error: "Convite não encontrado" });
    }
    
    const inv = invitation[0];
    
    // Verificações
    if (new Date(inv.invitation.expiresAt) < new Date()) {
      return res.status(400).json({ error: "Este convite expirou" });
    }
    
    if (inv.invitation.status === 'accepted') {
      return res.status(400).json({ error: "Este convite já foi utilizado" });
    }
    
    // Verificar se o email do usuário corresponde ao do convite
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user.length || user[0].email !== inv.invitation.email) {
      return res.status(400).json({ error: "Este convite foi enviado para outro email" });
    }
    
    // Buscar plano corporativo ativo
    const subscription = await db.select()
      .from(corporateSubscriptions)
      .where(and(
        eq(corporateSubscriptions.partnerId, inv.partner.id),
        eq(corporateSubscriptions.status, 'active')
      ))
      .limit(1);
    
    if (!subscription.length) {
      return res.status(400).json({ error: "A empresa não possui um plano corporativo ativo" });
    }
    
    // Iniciar transação
    await db.transaction(async (tx) => {
      // Atualizar convite
      await tx.update(corporateInvitations)
        .set({
          status: 'accepted',
          acceptedAt: new Date()
        })
        .where(eq(corporateInvitations.id, inv.invitation.id));
      
      // Atualizar usuário
      await tx.update(users)
        .set({
          corporatePartnerId: inv.partner.id,
          isCorporateUser: true,
          corporatePlanType: subscription[0].planType,
          subscriptionPlan: subscription[0].planType as any,
          subscriptionStatus: 'active',
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      // Adicionar como colaborador corporativo
      await tx.insert(corporateEmployees).values({
        partnerId: inv.partner.id,
        userId: userId,
        employeeEmail: user[0].email,
        status: 'active',
        addedAt: new Date()
      });
      
      // Criar notificação
      await tx.insert(notifications).values({
        userId: userId,
        title: "Plano Corporativo Ativado",
        message: `Bem-vindo ao plano corporativo ${inv.partner.businessName}! Você já pode acessar todos os benefícios.`,
        type: "subscription_activated"
      });
    });
    
    res.json({
      success: true,
      message: "Convite aceito com sucesso",
      planType: subscription[0].planType,
      partnerName: inv.partner.businessName
    });
  } catch (error: any) {
    console.error("Erro ao aceitar convite:", error);
    res.status(500).json({ error: error.message || "Erro ao aceitar convite" });
  }
});

// Função auxiliar para gerar CSV
function generateCSV(data: any): string {
  const lines = [];
  
  // Cabeçalho
  lines.push(`Relatório de Uso - ${data.company}`);
  lines.push(`Período: ${data.period.start} a ${data.period.end}`);
  lines.push('');
  
  // Resumo
  lines.push('RESUMO');
  lines.push(`Total de Colaboradores,${data.summary.totalEmployees}`);
  lines.push(`Total de Consultas,${data.summary.totalConsultations}`);
  lines.push(`Consultas de Emergência,${data.summary.totalEmergencyConsultations}`);
  lines.push(`Total de Sinistros,${data.summary.totalClaims}`);
  lines.push(`Total de Dias de Atestado,${data.summary.totalSickDays}`);
  lines.push('');
  
  // Atestados
  lines.push('ATESTADOS MÉDICOS');
  lines.push('Data,Dias,Início,Fim,CID,Diagnóstico');
  data.medicalCertificates.forEach((cert: any) => {
    lines.push(`${cert.issueDate},${cert.sickDays},${cert.period.start},${cert.period.end},"${cert.cidCode}","${cert.diagnosis}"`);
  });
  
  return lines.join('\n');
}

export { router as corporateRouter };