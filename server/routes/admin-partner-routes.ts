import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { db } from "../db";
import { partners, users, corporateSubscriptions, corporateEmployees, corporateInvites, appointments } from "../../shared/schema";
import { eq, and, sql, or, ilike, desc, asc, gte, lte } from "drizzle-orm";
import { sendEmail } from "../services/email";
import { adminOnly } from "../middleware/admin";

const router = Router();

// Middleware para garantir que apenas admins acessem essas rotas
router.use(authenticateToken, adminOnly);

// Listar todos os parceiros com filtros
router.get("/partners", async (req, res) => {
  try {
    const { search, status, hasSubscription, page = "1", limit = "10" } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = db.select({
      partner: partners,
      user: users,
      subscription: corporateSubscriptions
    })
    .from(partners)
    .innerJoin(users, eq(partners.userId, users.id))
    .leftJoin(corporateSubscriptions, eq(partners.id, corporateSubscriptions.partnerId))
    .limit(parseInt(limit as string))
    .offset(offset)
    .orderBy(desc(partners.createdAt));

    // Aplicar filtros
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(partners.businessName, `%${search}%`),
          ilike(partners.contactEmail, `%${search}%`),
          ilike(users.fullName, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(partners.status, status as string));
    }

    // Contar total para paginação
    const totalQuery = await db.select({ count: sql<number>`count(*)` })
      .from(partners)
      .innerJoin(users, eq(partners.userId, users.id))
      .leftJoin(corporateSubscriptions, eq(partners.id, corporateSubscriptions.partnerId));

    const [{ count }] = totalQuery;

    const partnersData = await query;

    // Buscar estatísticas de cada parceiro
    const partnersWithStats = await Promise.all(
      partnersData.map(async ({ partner, user, subscription }) => {
        // Contar colaboradores
        const [{ employeeCount }] = await db.select({ 
          employeeCount: sql<number>`count(*)` 
        })
        .from(corporateEmployees)
        .where(eq(corporateEmployees.partnerId, partner.id));

        // Contar convites pendentes
        const [{ pendingInvites }] = await db.select({ 
          pendingInvites: sql<number>`count(*)` 
        })
        .from(corporateInvites)
        .where(
          and(
            eq(corporateInvites.partnerId, partner.id),
            eq(corporateInvites.status, 'pending')
          )
        );

        // Contar consultas do mês
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [{ monthlyAppointments }] = await db.select({ 
          monthlyAppointments: sql<number>`count(*)` 
        })
        .from(appointments)
        .innerJoin(corporateEmployees, eq(appointments.userId, corporateEmployees.userId))
        .where(
          and(
            eq(corporateEmployees.partnerId, partner.id),
            gte(appointments.date, startOfMonth)
          )
        );

        return {
          ...partner,
          user,
          subscription,
          stats: {
            employeeCount,
            pendingInvites,
            monthlyAppointments
          }
        };
      })
    );

    res.json({
      partners: partnersWithStats,
      pagination: {
        total: count,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(count / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error("Erro ao listar parceiros:", error);
    res.status(500).json({ error: "Erro ao buscar parceiros" });
  }
});

// Obter detalhes de um parceiro específico
router.get("/partners/:partnerId", async (req, res) => {
  try {
    const { partnerId } = req.params;

    const partnerData = await db.select({
      partner: partners,
      user: users,
      subscription: corporateSubscriptions
    })
    .from(partners)
    .innerJoin(users, eq(partners.userId, users.id))
    .leftJoin(corporateSubscriptions, eq(partners.id, corporateSubscriptions.partnerId))
    .where(eq(partners.id, parseInt(partnerId)));

    if (!partnerData.length) {
      return res.status(404).json({ error: "Parceiro não encontrado" });
    }

    const { partner, user, subscription } = partnerData[0];

    // Buscar colaboradores
    const employees = await db.select({
      employee: corporateEmployees,
      user: users
    })
    .from(corporateEmployees)
    .innerJoin(users, eq(corporateEmployees.userId, users.id))
    .where(eq(corporateEmployees.partnerId, partner.id))
    .orderBy(desc(corporateEmployees.createdAt));

    // Buscar convites
    const invites = await db.select()
      .from(corporateInvites)
      .where(eq(corporateInvites.partnerId, partner.id))
      .orderBy(desc(corporateInvites.createdAt));

    // Estatísticas de consultas
    const appointmentStats = await db.select({
      month: sql<string>`DATE_TRUNC('month', date)`,
      count: sql<number>`count(*)`,
      specialization: appointments.specialization
    })
    .from(appointments)
    .innerJoin(corporateEmployees, eq(appointments.userId, corporateEmployees.userId))
    .where(eq(corporateEmployees.partnerId, partner.id))
    .groupBy(sql`DATE_TRUNC('month', date)`, appointments.specialization)
    .orderBy(sql`DATE_TRUNC('month', date)`);

    res.json({
      partner,
      user,
      subscription,
      employees,
      invites,
      appointmentStats
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes do parceiro:", error);
    res.status(500).json({ error: "Erro ao buscar detalhes do parceiro" });
  }
});

// Atualizar informações do parceiro
router.put("/partners/:partnerId", async (req, res) => {
  try {
    const partnerId = parseInt(req.params.partnerId);
    const { businessName, cnpj, contactEmail, contactPhone, street, number, complement, 
            neighborhood, city, state, zipcode, status, user } = req.body;

    await db.transaction(async (tx) => {
      // Atualizar dados do parceiro
      await tx.update(partners).set({
        businessName,
        cnpj,
        contactEmail,
        contactPhone,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipcode,
        status,
        updatedAt: new Date()
      }).where(eq(partners.id, partnerId));

      // Atualizar dados do usuário responsável se fornecidos
      if (user) {
        const partnerData = await tx.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
        if (partnerData[0]) {
          await tx.update(users).set({
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            updatedAt: new Date()
          }).where(eq(users.id, partnerData[0].userId));
        }
      }
    });

    console.log(`✅ [Admin] Parceiro ${partnerId} atualizado com sucesso`);
    res.json({ success: true, message: "Parceiro atualizado com sucesso" });
  } catch (error) {
    console.error('❌ [Admin] Erro ao atualizar parceiro:', error);
    res.status(500).json({ error: 'Erro ao atualizar parceiro' });
  }
});

// Gerenciar assinatura corporativa
router.put("/partners/:partnerId/subscription", async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { planType, employeeTier, billingPeriod, discountPercentage, status } = req.body;

    // Verificar se já existe assinatura
    const existingSubscription = await db.select()
      .from(corporateSubscriptions)
      .where(eq(corporateSubscriptions.partnerId, parseInt(partnerId)))
      .limit(1);

    if (existingSubscription.length > 0) {
      // Atualizar assinatura existente
      await db.update(corporateSubscriptions)
        .set({
          planType,
          employeeTier,
          billingPeriod,
          discountPercentage,
          status,
          updatedAt: new Date()
        })
        .where(eq(corporateSubscriptions.partnerId, parseInt(partnerId)));
    } else {
      // Criar nova assinatura
      await db.insert(corporateSubscriptions)
        .values({
          partnerId: parseInt(partnerId),
          planType,
          employeeTier,
          monthlyPricePerEmployee: "0", // Será calculado baseado no plano
          billingPeriod,
          discountPercentage: discountPercentage || "0",
          status: status || "active",
          currentBillingDate: new Date(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
        });
    }

    res.json({ message: "Assinatura atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error);
    res.status(500).json({ error: "Erro ao atualizar assinatura" });
  }
});

// Listar colaboradores de um parceiro
router.get("/partners/:partnerId/employees", async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { search, status, page = "1", limit = "10" } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = db.select({
      employee: corporateEmployees,
      user: users
    })
    .from(corporateEmployees)
    .innerJoin(users, eq(corporateEmployees.userId, users.id))
    .where(eq(corporateEmployees.partnerId, parseInt(partnerId)))
    .limit(parseInt(limit as string))
    .offset(offset)
    .orderBy(desc(corporateEmployees.createdAt));

    const employees = await query;

    // Buscar estatísticas de cada colaborador
    const employeesWithStats = await Promise.all(
      employees.map(async ({ employee, user }) => {
        const [{ appointmentCount }] = await db.select({ 
          appointmentCount: sql<number>`count(*)` 
        })
        .from(appointments)
        .where(eq(appointments.userId, user.id));

        return {
          ...employee,
          user,
          stats: {
            appointmentCount
          }
        };
      })
    );

    res.json(employeesWithStats);
  } catch (error) {
    console.error("Erro ao listar colaboradores:", error);
    res.status(500).json({ error: "Erro ao buscar colaboradores" });
  }
});

// Remover colaborador
router.delete("/partners/:partnerId/employees/:employeeId", async (req, res) => {
  try {
    const { partnerId, employeeId } = req.params;

    await db.delete(corporateEmployees)
      .where(
        and(
          eq(corporateEmployees.id, parseInt(employeeId)),
          eq(corporateEmployees.partnerId, parseInt(partnerId))
        )
      );

    res.json({ message: "Colaborador removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover colaborador:", error);
    res.status(500).json({ error: "Erro ao remover colaborador" });
  }
});

// Gerenciar convites
router.get("/partners/:partnerId/invites", async (req, res) => {
  try {
    const { partnerId } = req.params;

    const invites = await db.select()
      .from(corporateInvites)
      .where(eq(corporateInvites.partnerId, parseInt(partnerId)))
      .orderBy(desc(corporateInvites.createdAt));

    res.json(invites);
  } catch (error) {
    console.error("Erro ao listar convites:", error);
    res.status(500).json({ error: "Erro ao buscar convites" });
  }
});

// Reenviar convite
router.post("/partners/:partnerId/invites/:inviteId/resend", async (req, res) => {
  try {
    const { partnerId, inviteId } = req.params;

    const [invite] = await db.select()
      .from(corporateInvites)
      .where(
        and(
          eq(corporateInvites.id, parseInt(inviteId)),
          eq(corporateInvites.partnerId, parseInt(partnerId))
        )
      );

    if (!invite) {
      return res.status(404).json({ error: "Convite não encontrado" });
    }

    // Buscar informações do parceiro
    const [partner] = await db.select()
      .from(partners)
      .where(eq(partners.id, parseInt(partnerId)));

    // Reenviar email
    await sendEmail({
      to: invite.email,
      subject: `Convite para ${partner.businessName} - CNVidas`,
      html: `
        <h2>Você foi convidado!</h2>
        <p>${partner.businessName} está oferecendo benefícios de saúde através do CNVidas.</p>
        <p>Use o código abaixo para ativar seu benefício:</p>
        <h3 style="background: #f0f0f0; padding: 10px; text-align: center;">${invite.inviteCode}</h3>
        <p>Acesse https://cnvidas.com.br e faça seu cadastro.</p>
      `
    });

    // Atualizar data de envio
    await db.update(corporateInvites)
      .set({ sentAt: new Date() })
      .where(eq(corporateInvites.id, parseInt(inviteId)));

    res.json({ message: "Convite reenviado com sucesso" });
  } catch (error) {
    console.error("Erro ao reenviar convite:", error);
    res.status(500).json({ error: "Erro ao reenviar convite" });
  }
});

// Cancelar convite
router.delete("/partners/:partnerId/invites/:inviteId", async (req, res) => {
  try {
    const { partnerId, inviteId } = req.params;

    await db.update(corporateInvites)
      .set({ 
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(corporateInvites.id, parseInt(inviteId)),
          eq(corporateInvites.partnerId, parseInt(partnerId))
        )
      );

    res.json({ message: "Convite cancelado com sucesso" });
  } catch (error) {
    console.error("Erro ao cancelar convite:", error);
    res.status(500).json({ error: "Erro ao cancelar convite" });
  }
});

// Relatórios gerenciais completos
router.get("/partners/reports", async (req, res) => {
  try {
    const { period = '6months', type = 'overview' } = req.query;
    
    // Calcular período
    let startDate = new Date();
    switch(period) {
      case '1month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '12months':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
    }

    // Estatísticas resumidas
    const [{ totalPartners }] = await db.select({ 
      totalPartners: sql<number>`count(*)` 
    }).from(partners);

    const [{ activePartners }] = await db.select({ 
      activePartners: sql<number>`count(distinct ${partners.id})` 
    })
    .from(partners)
    .innerJoin(corporateSubscriptions, eq(partners.id, corporateSubscriptions.partnerId))
    .where(eq(corporateSubscriptions.status, 'active'));

    const [{ totalEmployees }] = await db.select({ 
      totalEmployees: sql<number>`count(*)` 
    }).from(corporateEmployees);

    const [{ totalAppointments }] = await db.select({ 
      totalAppointments: sql<number>`count(*)` 
    })
    .from(appointments)
    .innerJoin(corporateEmployees, eq(appointments.userId, corporateEmployees.userId))
    .where(gte(appointments.date, startDate));

    // Receita mensal média
    const revenueData = await db.select({
      monthlyRevenue: sql<number>`
        sum(
          case ${corporateSubscriptions.planType}
            when 'basic_corp' then 65
            when 'premium_corp' then 127
            when 'ultra_corp' then 197
            else 0
          end * count(distinct ${corporateEmployees.id})
        )
      `
    })
    .from(corporateSubscriptions)
    .innerJoin(partners, eq(corporateSubscriptions.partnerId, partners.id))
    .leftJoin(corporateEmployees, eq(partners.id, corporateEmployees.partnerId))
    .where(eq(corporateSubscriptions.status, 'active'));

    const monthlyRevenue = revenueData[0]?.monthlyRevenue || 0;

    // Taxa de crescimento
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 6);
    
    const [{ previousPartners }] = await db.select({ 
      previousPartners: sql<number>`count(*)` 
    })
    .from(partners)
    .where(
      and(
        gte(partners.createdAt, previousPeriodStart),
        lte(partners.createdAt, startDate)
      )
    );

    const [{ currentPartners }] = await db.select({ 
      currentPartners: sql<number>`count(*)` 
    })
    .from(partners)
    .where(gte(partners.createdAt, startDate));

    const growthRate = previousPartners > 0 
      ? Math.round(((currentPartners - previousPartners) / previousPartners) * 100)
      : 0;

    // Tendências mensais
    const monthlyTrends = await db.select({
      month: sql<string>`DATE_TRUNC('month', ${partners.createdAt})`,
      partners: sql<number>`count(distinct ${partners.id})`,
      employees: sql<number>`count(distinct ${corporateEmployees.id})`,
      appointments: sql<number>`count(distinct ${appointments.id})`,
      revenue: sql<number>`
        sum(
          case ${corporateSubscriptions.planType}
            when 'basic_corp' then 65
            when 'premium_corp' then 127
            when 'ultra_corp' then 197
            else 0
          end
        )
      `
    })
    .from(partners)
    .leftJoin(corporateEmployees, eq(partners.id, corporateEmployees.partnerId))
    .leftJoin(corporateSubscriptions, eq(partners.id, corporateSubscriptions.partnerId))
    .leftJoin(appointments, eq(corporateEmployees.userId, appointments.userId))
    .where(gte(partners.createdAt, startDate))
    .groupBy(sql`DATE_TRUNC('month', ${partners.createdAt})`)
    .orderBy(sql`DATE_TRUNC('month', ${partners.createdAt})`);

    // Distribuição por plano
    const planDistribution = await db.select({
      plan: sql<string>`
        case ${corporateSubscriptions.planType}
          when 'free_corp' then 'Gratuito'
          when 'basic_corp' then 'Básico'
          when 'premium_corp' then 'Premium'
          when 'ultra_corp' then 'Ultra'
          else 'Sem plano'
        end
      `,
      count: sql<number>`count(*)`,
      percentage: sql<number>`round(count(*) * 100.0 / sum(count(*)) over(), 2)`
    })
    .from(partners)
    .leftJoin(corporateSubscriptions, eq(partners.id, corporateSubscriptions.partnerId))
    .groupBy(corporateSubscriptions.planType);

    // Top parceiros
    const topPartners = await db.select({
      id: partners.id,
      businessName: partners.businessName,
      employeeCount: sql<number>`count(distinct ${corporateEmployees.id})`,
      appointmentCount: sql<number>`count(distinct ${appointments.id})`,
      monthlyRevenue: sql<number>`
        case ${corporateSubscriptions.planType}
          when 'basic_corp' then 65
          when 'premium_corp' then 127
          when 'ultra_corp' then 197
          else 0
        end * count(distinct ${corporateEmployees.id})
      `
    })
    .from(partners)
    .leftJoin(corporateEmployees, eq(partners.id, corporateEmployees.partnerId))
    .leftJoin(corporateSubscriptions, eq(partners.id, corporateSubscriptions.partnerId))
    .leftJoin(appointments, eq(corporateEmployees.userId, appointments.userId))
    .where(gte(appointments.date, startDate))
    .groupBy(partners.id, partners.businessName, corporateSubscriptions.planType)
    .orderBy(sql`count(distinct ${corporateEmployees.id}) desc`)
    .limit(10);

    // Distribuição por faixa de colaboradores
    const employeeTierDistribution = await db.select({
      tier: sql<string>`
        case 
          when count(distinct ${corporateEmployees.id}) between 5 and 50 then '5-50'
          when count(distinct ${corporateEmployees.id}) between 51 and 200 then '51-200'
          when count(distinct ${corporateEmployees.id}) > 200 then '201+'
          else '0-4'
        end
      `,
      count: sql<number>`count(distinct ${partners.id})`
    })
    .from(partners)
    .leftJoin(corporateEmployees, eq(partners.id, corporateEmployees.partnerId))
    .groupBy(sql`
      case 
        when count(distinct ${corporateEmployees.id}) between 5 and 50 then '5-50'
        when count(distinct ${corporateEmployees.id}) between 51 and 200 then '51-200'
        when count(distinct ${corporateEmployees.id}) > 200 then '201+'
        else '0-4'
      end
    `);

    res.json({
      summary: {
        totalPartners,
        activePartners,
        totalEmployees,
        totalAppointments,
        monthlyRevenue,
        growthRate
      },
      monthlyTrends,
      planDistribution,
      topPartners,
      employeeTierDistribution
    });
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ error: "Erro ao gerar relatório" });
  }
});

// Exportar relatórios
router.get("/partners/reports/export", async (req, res) => {
  try {
    const { format = 'csv', period = '6months' } = req.query;
    
    // Buscar dados do relatório
    const reportData = await fetch(`${req.protocol}://${req.get('host')}/api/admin/partners/reports?period=${period}`, {
      headers: req.headers as any
    }).then(r => r.json());

    if (format === 'csv') {
      // Gerar CSV
      let csv = 'Relatório de Parceiros Corporativos\n';
      csv += `Período: ${period}\n\n`;
      
      // Resumo
      csv += 'RESUMO\n';
      csv += 'Métrica,Valor\n';
      csv += `Total de Parceiros,${reportData.summary.totalPartners}\n`;
      csv += `Parceiros Ativos,${reportData.summary.activePartners}\n`;
      csv += `Total de Colaboradores,${reportData.summary.totalEmployees}\n`;
      csv += `Total de Consultas,${reportData.summary.totalAppointments}\n`;
      csv += `Receita Mensal,R$ ${reportData.summary.monthlyRevenue}\n`;
      csv += `Taxa de Crescimento,${reportData.summary.growthRate}%\n\n`;
      
      // Top Parceiros
      csv += 'TOP PARCEIROS\n';
      csv += 'Empresa,Colaboradores,Consultas,Receita Mensal\n';
      reportData.topPartners.forEach((p: any) => {
        csv += `"${p.businessName}",${p.employeeCount},${p.appointmentCount},R$ ${p.monthlyRevenue}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio-parceiros-${period}.csv`);
      res.send(csv);
    } else {
      // Para PDF, retornar erro por enquanto
      res.status(501).json({ error: "Exportação em PDF ainda não implementada" });
    }
  } catch (error) {
    console.error("Erro ao exportar relatório:", error);
    res.status(500).json({ error: "Erro ao exportar relatório" });
  }
});

// Ativar/Desativar parceiro
router.patch("/partners/:partnerId/status", async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }

    await db.update(partners)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(partners.id, parseInt(partnerId)));

    // Se suspenso, também suspender a assinatura
    if (status === 'suspended') {
      await db.update(corporateSubscriptions)
        .set({ 
          status: 'suspended',
          updatedAt: new Date()
        })
        .where(eq(corporateSubscriptions.partnerId, parseInt(partnerId)));
    }

    res.json({ message: `Parceiro ${status === 'active' ? 'ativado' : status === 'suspended' ? 'suspenso' : 'desativado'} com sucesso` });
  } catch (error) {
    console.error("Erro ao alterar status do parceiro:", error);
    res.status(500).json({ error: "Erro ao alterar status do parceiro" });
  }
});

export default router;