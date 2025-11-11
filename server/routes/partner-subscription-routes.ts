// @ts-nocheck
import { Router } from "express";
import { eq, and, desc, gte } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth";
import { db } from "../db";
import { 
  partners,
  partnerSubscriptionPlans,
  partnerSubscriptions,
  partnerBillingHistory,
  partnerCollaborators
} from "../../shared/schema";
import Stripe from "stripe";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Middleware para verificar se o usuário é o dono do parceiro
const isPartnerOwner = async (req: any, res: any, next: any) => {
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
      return res.status(403).json({ error: "Parceiro não encontrado" });
    }
    
    req.partner = partner[0];
    next();
  } catch (error) {
    console.error("Erro ao verificar parceiro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Listar planos disponíveis
router.get("/plans", async (req, res) => {
  try {
    const plans = await db.select()
      .from(partnerSubscriptionPlans)
      .where(eq(partnerSubscriptionPlans.isActive, true))
      .orderBy(partnerSubscriptionPlans.monthlyPrice);
    
    res.json(plans);
  } catch (error) {
    console.error("Erro ao listar planos:", error);
    res.status(500).json({ error: "Erro ao listar planos" });
  }
});

// Obter assinatura atual
router.get("/current", authenticateToken, isPartnerOwner, async (req, res) => {
  try {
    const partnerId = req.partner.id;
    
    const subscription = await db.select({
      subscription: partnerSubscriptions,
      plan: partnerSubscriptionPlans
    })
    .from(partnerSubscriptions)
    .innerJoin(partnerSubscriptionPlans, eq(partnerSubscriptions.planId, partnerSubscriptionPlans.id))
    .where(and(
      eq(partnerSubscriptions.partnerId, partnerId),
      eq(partnerSubscriptions.status, 'active')
    ))
    .limit(1);
    
    if (!subscription.length) {
      // Se não tem assinatura ativa, retornar plano gratuito
      const freePlan = await db.select()
        .from(partnerSubscriptionPlans)
        .where(eq(partnerSubscriptionPlans.planType, 'free'))
        .limit(1);
      
      return res.json({
        subscription: null,
        plan: freePlan[0] || null,
        isFreePlan: true
      });
    }
    
    // Contar colaboradores ativos
    const activeCollaborators = await db.select()
      .from(partnerCollaborators)
      .where(and(
        eq(partnerCollaborators.partnerId, partnerId),
        eq(partnerCollaborators.status, 'active')
      ));
    
    res.json({
      ...subscription[0],
      activeCollaborators: activeCollaborators.length,
      isFreePlan: subscription[0].plan.planType === 'free'
    });
  } catch (error) {
    console.error("Erro ao obter assinatura:", error);
    res.status(500).json({ error: "Erro ao obter assinatura" });
  }
});

// Criar ou atualizar assinatura
router.post("/subscribe", authenticateToken, isPartnerOwner, async (req, res) => {
  try {
    const partnerId = req.partner.id;
    const { planId, paymentMethodId } = req.body;
    
    if (!planId) {
      return res.status(400).json({ error: "ID do plano é obrigatório" });
    }
    
    // Obter plano selecionado
    const plan = await db.select()
      .from(partnerSubscriptionPlans)
      .where(eq(partnerSubscriptionPlans.id, planId))
      .limit(1);
    
    if (!plan.length) {
      return res.status(404).json({ error: "Plano não encontrado" });
    }
    
    const selectedPlan = plan[0];
    
    // Se for plano gratuito, criar diretamente
    if (selectedPlan.planType === 'free') {
      // Cancelar assinatura paga existente
      await db.update(partnerSubscriptions)
        .set({ 
          status: 'cancelled',
          endDate: new Date()
        })
        .where(and(
          eq(partnerSubscriptions.partnerId, partnerId),
          eq(partnerSubscriptions.status, 'active')
        ));
      
      // Criar assinatura gratuita
      const subscription = await db.insert(partnerSubscriptions).values({
        partnerId,
        planId: selectedPlan.id,
        status: 'active',
        startDate: new Date()
      }).returning();
      
      return res.json({
        success: true,
        subscription: subscription[0],
        message: "Assinatura gratuita ativada com sucesso"
      });
    }
    
    // Para planos pagos, precisamos do método de pagamento
    if (!paymentMethodId) {
      return res.status(400).json({ error: "Método de pagamento é obrigatório para planos pagos" });
    }
    
    // Criar ou obter customer no Stripe
    let stripeCustomerId = req.partner.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.partner.businessName,
        metadata: {
          partnerId: partnerId.toString()
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Salvar ID do customer
      await db.update(partners)
        .set({ stripeCustomerId })
        .where(eq(partners.id, partnerId));
    }
    
    // Anexar método de pagamento ao customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });
    
    // Definir como método de pagamento padrão
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    
    // Criar assinatura no Stripe
    const stripeSubscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: `Plano ${selectedPlan.planName} - CNVidas Parceiros`,
            description: `Assinatura mensal para parceiros empresariais`,
          },
          unit_amount: Math.round(parseFloat(selectedPlan.monthlyPrice) * 100),
          recurring: {
            interval: 'month',
          },
        },
      }],
      metadata: {
        partnerId: partnerId.toString(),
        planId: planId.toString(),
      },
    });
    
    // Cancelar assinatura anterior
    await db.update(partnerSubscriptions)
      .set({ 
        status: 'cancelled',
        endDate: new Date()
      })
      .where(and(
        eq(partnerSubscriptions.partnerId, partnerId),
        eq(partnerSubscriptions.status, 'active')
      ));
    
    // Criar nova assinatura
    const subscription = await db.insert(partnerSubscriptions).values({
      partnerId,
      planId: selectedPlan.id,
      status: 'active',
      startDate: new Date(),
      nextBillingDate: new Date(stripeSubscription.current_period_end * 1000),
      paymentMethodId,
      stripeSubscriptionId: stripeSubscription.id
    }).returning();
    
    // Criar registro de cobrança
    await db.insert(partnerBillingHistory).values({
      partnerId,
      subscriptionId: subscription[0].id,
      amount: selectedPlan.monthlyPrice,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      stripePaymentIntentId: stripeSubscription.latest_invoice as string,
      paidAt: new Date(),
      periodStart: new Date(stripeSubscription.current_period_start * 1000),
      periodEnd: new Date(stripeSubscription.current_period_end * 1000)
    });
    
    res.json({
      success: true,
      subscription: subscription[0],
      message: "Assinatura criada com sucesso"
    });
  } catch (error) {
    console.error("Erro ao criar assinatura:", error);
    res.status(500).json({ error: "Erro ao criar assinatura" });
  }
});

// Cancelar assinatura
router.post("/cancel", authenticateToken, isPartnerOwner, async (req, res) => {
  try {
    const partnerId = req.partner.id;
    
    const subscription = await db.select()
      .from(partnerSubscriptions)
      .where(and(
        eq(partnerSubscriptions.partnerId, partnerId),
        eq(partnerSubscriptions.status, 'active')
      ))
      .limit(1);
    
    if (!subscription.length) {
      return res.status(404).json({ error: "Nenhuma assinatura ativa encontrada" });
    }
    
    // Cancelar no Stripe se existir
    if (subscription[0].stripeSubscriptionId) {
      await stripe.subscriptions.cancel(subscription[0].stripeSubscriptionId);
    }
    
    // Atualizar status no banco
    await db.update(partnerSubscriptions)
      .set({ 
        status: 'cancelled',
        endDate: new Date()
      })
      .where(eq(partnerSubscriptions.id, subscription[0].id));
    
    // Ativar plano gratuito
    const freePlan = await db.select()
      .from(partnerSubscriptionPlans)
      .where(eq(partnerSubscriptionPlans.planType, 'free'))
      .limit(1);
    
    if (freePlan.length) {
      await db.insert(partnerSubscriptions).values({
        partnerId,
        planId: freePlan[0].id,
        status: 'active',
        startDate: new Date()
      });
    }
    
    res.json({
      success: true,
      message: "Assinatura cancelada com sucesso"
    });
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    res.status(500).json({ error: "Erro ao cancelar assinatura" });
  }
});

// Histórico de cobranças
router.get("/billing-history", authenticateToken, isPartnerOwner, async (req, res) => {
  try {
    const partnerId = req.partner.id;
    
    const history = await db.select()
      .from(partnerBillingHistory)
      .where(eq(partnerBillingHistory.partnerId, partnerId))
      .orderBy(desc(partnerBillingHistory.createdAt))
      .limit(50);
    
    res.json(history);
  } catch (error) {
    console.error("Erro ao obter histórico:", error);
    res.status(500).json({ error: "Erro ao obter histórico de cobranças" });
  }
});

// Dashboard com métricas
router.get("/dashboard", authenticateToken, isPartnerOwner, async (req, res) => {
  try {
    const partnerId = req.partner.id;
    
    // Assinatura atual
    const currentSubscription = await db.select({
      subscription: partnerSubscriptions,
      plan: partnerSubscriptionPlans
    })
    .from(partnerSubscriptions)
    .innerJoin(partnerSubscriptionPlans, eq(partnerSubscriptions.planId, partnerSubscriptionPlans.id))
    .where(and(
      eq(partnerSubscriptions.partnerId, partnerId),
      eq(partnerSubscriptions.status, 'active')
    ))
    .limit(1);
    
    // Colaboradores
    const collaborators = await db.select()
      .from(partnerCollaborators)
      .where(eq(partnerCollaborators.partnerId, partnerId));
    
    const activeCollaborators = collaborators.filter(c => c.status === 'active');
    const pendingInvites = collaborators.filter(c => c.status === 'pending');
    
    // Últimas cobranças
    const recentBilling = await db.select()
      .from(partnerBillingHistory)
      .where(eq(partnerBillingHistory.partnerId, partnerId))
      .orderBy(desc(partnerBillingHistory.createdAt))
      .limit(5);
    
    // Calcular próxima cobrança
    let nextBillingAmount = '0.00';
    let nextBillingDate = null;
    
    if (currentSubscription.length && currentSubscription[0].plan.planType !== 'free') {
      nextBillingAmount = currentSubscription[0].plan.monthlyPrice;
      nextBillingDate = currentSubscription[0].subscription.nextBillingDate;
    }
    
    res.json({
      subscription: currentSubscription[0] || null,
      metrics: {
        activeCollaborators: activeCollaborators.length,
        pendingInvites: pendingInvites.length,
        totalCollaborators: collaborators.length,
        collaboratorLimit: currentSubscription[0]?.plan.maxCollaborators || 1
      },
      billing: {
        nextBillingDate,
        nextBillingAmount,
        recentHistory: recentBilling
      }
    });
  } catch (error) {
    console.error("Erro ao obter dashboard:", error);
    res.status(500).json({ error: "Erro ao obter dados do dashboard" });
  }
});

export { router as partnerSubscriptionRouter };
