import { Router, Request, Response, NextFunction } from 'express';
import { eq, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { subscriptionPlans, userSubscriptions, users } from '../../shared/schema';
import { AuthenticatedRequest } from '../types/authenticated-request';
import { applyScheduledDowngradeIfEligible, getLatestSubscription } from '../utils/subscription-helpers';

const router = Router();

const addOneMonth = (date: Date) => {
  const result = new Date(date.getTime());
  result.setMonth(result.getMonth() + 1);
  return result;
};

const parseEmergencyConsultations = (value?: string | null) => {
  if (!value || value === "unlimited") {
    return null;
  }
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// Middleware simples para verificar autenticação (já processada globalmente)
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  console.log("Verificando autenticação na rota de assinatura...");
  
  if (authReq.user) {
    console.log("✅ Usuário autenticado:", authReq.user.email);
    return next();
  }
  
  console.log("❌ Usuário não autenticado - retornando 401");
  res.status(401).json({ message: "Não autorizado" });
};

// Rota pública para buscar planos de assinatura disponíveis
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plansData = await db.select().from(subscriptionPlans);
    console.log('Retornando planos de assinatura para usuário (rota pública):', plansData);
    res.json(plansData);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ error: 'Erro ao buscar planos de assinatura' });
  }
});

// Rota simplificada para ativar plano gratuito
router.post('/activate-free', async (req: Request, res: Response) => {
  try {
    console.log('=== ATIVANDO PLANO GRATUITO ===');
    console.log('Headers recebidos:', req.headers);
    const authReq = req as AuthenticatedRequest;
    
    let userRecord = authReq.user || null;
    let userId = authReq.user?.id || null;
    let userEmail = authReq.user?.email || null;
    
    // Fallback para identificar o usuário caso o middleware global não tenha preenchido req.user
    if (!userId) {
      console.log('ℹ️ req.user não disponível - tentando identificar usuário manualmente');
      
      // Método 1: Sessão
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        userId = req.user.id;
        userEmail = req.user.email;
        console.log('Usuário autenticado via sessão:', userId, userEmail);
      }
    }
    
    // Método 2: Token nos headers
    if (!userId) {
      const authToken = req.headers['x-auth-token'] as string ||
        (req.headers.authorization?.startsWith('Bearer ')
          ? req.headers.authorization.substring(7)
          : null);

      if (authToken) {
        try {
          const jwtSecret = process.env.JWT_SECRET || 'REDACTED_JWT_FALLBACK_PLACEHOLDER';
          const decoded: any = jwt.verify(authToken, jwtSecret);
          if (decoded && decoded.userId) {
            userId = decoded.userId;
            userEmail = decoded.email;
            console.log('Usuário autenticado via JWT:', userId, userEmail);
          }
        } catch (jwtError) {
          console.error('Erro ao verificar JWT no fallback:', jwtError);
        }
      }
    }
    
    // Método 3: Cookie auth_token
    if (!userId && req.cookies?.auth_token) {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'REDACTED_JWT_FALLBACK_PLACEHOLDER';
        const decoded: any = jwt.verify(req.cookies.auth_token, jwtSecret);
        if (decoded && decoded.userId) {
          userId = decoded.userId;
          userEmail = decoded.email;
          console.log('Usuário autenticado via cookie auth_token:', userId, userEmail);
        }
      } catch (jwtError) {
        console.error('Erro ao verificar cookie auth_token no fallback:', jwtError);
      }
    }
    
    // Método 4: Header x-user-id
    if (!userId && req.headers['x-user-id']) {
      const userIdFromHeader = parseInt(req.headers['x-user-id'] as string);
      if (!isNaN(userIdFromHeader)) {
        userId = userIdFromHeader;
        console.log('Usuário identificado via header x-user-id:', userId);
      }
    }
    
    if (!userId) {
      console.log('❌ Não foi possível identificar o usuário para ativar o plano gratuito');
      return res.status(401).json({ success: false, message: "Usuário não autenticado" });
    }
    
    if (!userRecord || userRecord.id !== userId) {
      const [userFromDb] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      userRecord = userFromDb || null;
    }
    
    if (!userRecord) {
      console.log(`❌ Usuário ${userId} não encontrado no banco de dados`);
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    const latestSubscription = await getLatestSubscription(userRecord.id);
    if (latestSubscription?.subscription && latestSubscription.subscription.status === 'active') {
      console.log(`ℹ️ Usuário ${userRecord.email} já possui assinatura ativa. Retornando assinatura existente.`);
      return res.json({
        success: true,
        message: "Plano já estava ativo",
        subscription: {
          ...latestSubscription.subscription,
          plan: latestSubscription.plan,
        },
        redirect: "/dashboard",
      });
    }

    const [freePlan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, 'free'))
      .limit(1);

    if (!freePlan) {
      console.error('❌ Plano gratuito não encontrado na tabela subscription_plans');
      return res.status(500).json({
        success: false,
        message: "Plano gratuito não está configurado",
      });
    }

    // Ativar o plano gratuito de fato
    console.log(`✅ Ativando plano gratuito no banco para usuário ${userEmail || userRecord.email || userRecord.id}`);

    const now = new Date();
    const endDate = addOneMonth(now);

    let createdSubscription: any = null;
    try {
      [createdSubscription] = await db.insert(userSubscriptions).values({
        userId: userRecord.id,
        planId: freePlan.id,
        status: 'active',
        startDate: now,
        endDate,
        paymentMethod: 'free',
        price: freePlan.price,
        cancelAtPeriodEnd: false,
        scheduledPlanId: null,
        scheduledPlanApplied: false,
        createdAt: now,
        updatedAt: now,
      }).returning();
    } catch (insertError) {
      const errorMessage = (insertError as Error)?.message || '';
      
      if (errorMessage.includes('cancel_at_period_end') || errorMessage.includes('scheduled_plan_id')) {
        console.warn('⚠️ Estrutura antiga detectada em user_subscriptions - aplicando insert de compatibilidade', errorMessage);
        
        const fallbackResult = await db.execute(sql`
          INSERT INTO user_subscriptions (user_id, plan_id, status, start_date, end_date, payment_method, price, created_at, updated_at)
          VALUES (${userRecord.id}, ${freePlan.id}, 'active', ${now}, ${endDate}, 'free', ${freePlan.price}, ${now}, ${now})
          RETURNING id, user_id, plan_id, status, start_date, end_date
        `);
        
        const fallbackRow = fallbackResult.rows[0];
        createdSubscription = {
          id: fallbackRow.id,
          userId: fallbackRow.user_id,
          planId: fallbackRow.plan_id,
          status: fallbackRow.status,
          startDate: fallbackRow.start_date ? new Date(fallbackRow.start_date) : now,
          endDate: fallbackRow.end_date ? new Date(fallbackRow.end_date) : endDate,
          paymentMethod: 'free',
          price: freePlan.price,
          cancelAtPeriodEnd: false,
          scheduledPlanId: null,
          scheduledPlanApplied: false,
        };
      } else {
        throw insertError;
      }
    }
    
    const emergencyConsultationsLeft =
      freePlan.price === 0 ? 0 : parseEmergencyConsultations(freePlan.emergencyConsultations) ?? 0;

    await db.update(users)
      .set({
        subscriptionPlan: freePlan.name,
        subscriptionStatus: 'active',
        subscriptionPlanId: freePlan.id,
        subscriptionStartDate: now,
        subscriptionEndDate: endDate,
        subscriptionChangedAt: now,
        emergencyConsultationsLeft,
      })
      .where(eq(users.id, userRecord.id));

    return res.json({
      success: true,
      message: "Plano gratuito ativado com sucesso",
      subscription: {
        id: createdSubscription.id,
        userId: createdSubscription.userId,
        planId: createdSubscription.planId,
        status: createdSubscription.status,
        startDate: createdSubscription.startDate,
        endDate: createdSubscription.endDate,
        plan: freePlan,
        cancelAtPeriodEnd: createdSubscription.cancelAtPeriodEnd ?? false,
        scheduledPlanId: createdSubscription.scheduledPlanId ?? null,
        scheduledPlanApplied: createdSubscription.scheduledPlanApplied ?? false,
      },
      redirect: "/dashboard"
    });
    
  } catch (error) {
    console.error('Erro ao ativar plano gratuito:', error);
    console.error('Stack trace:', (error as Error).stack);
    return res.status(500).json({
      success: false,
      message: "Não foi possível ativar o plano gratuito",
      error: (error as Error).message,
    });
  }
});

// Rota para buscar assinatura atual do usuário
router.get('/current', isAuthenticated, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;

  if (!user) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }

  try {
    console.log(`🔍 Buscando assinatura atual para usuário ${user.email} (ID: ${user.id})`);
    
    const subscriptionRecord = await applyScheduledDowngradeIfEligible(user.id);

    if (subscriptionRecord) {
      const subscription = subscriptionRecord;
      console.log(`✅ Assinatura encontrada:`);
      console.log(`   - ID: ${subscription.subscription.id}`);
      console.log(`   - Status: ${subscription.subscription.status}`);
      console.log(`   - Plano: ${subscription.plan?.name}`);
      console.log(`   - Data criação: ${subscription.subscription.createdAt}`);

      let scheduledPlanDetail = null;
      if (subscription.subscription.scheduledPlanId) {
        const [scheduledPlan] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, subscription.subscription.scheduledPlanId));
        scheduledPlanDetail = scheduledPlan || null;
      }
      
      // **CORREÇÃO: Sincronizar subscriptionPlan na tabela users**
      if (subscription.plan && subscription.subscription.status === 'active') {
        const currentUserPlan = user.subscriptionPlan;
        const actualPlan = subscription.plan.name;
        
        if (currentUserPlan !== actualPlan) {
          console.log(`🔄 Sincronizando plano do usuário: ${currentUserPlan} → ${actualPlan}`);
          
          await db.update(users)
            .set({ 
              subscriptionPlan: actualPlan,
              subscriptionStatus: subscription.subscription.status,
              updatedAt: new Date()
            })
            .where(eq(users.id, user.id));
          
          console.log(`✅ Plano do usuário sincronizado com sucesso`);
        }
      }
      
      return res.json({
        subscription: {
          id: subscription.subscription.id,
          userId: subscription.subscription.userId,
          planId: subscription.subscription.planId,
          status: subscription.subscription.status,
          startDate: subscription.subscription.startDate,
          endDate: subscription.subscription.endDate,
          plan: subscription.plan,
          cancelAtPeriodEnd: subscription.subscription.cancelAtPeriodEnd,
          scheduledPlanId: subscription.subscription.scheduledPlanId,
          scheduledPlanApplied: subscription.subscription.scheduledPlanApplied,
          scheduledPlan: scheduledPlanDetail
        }
      });
    } else {
      console.log(`⚠️ Nenhuma assinatura encontrada para ${user.email}.`);
      
      // Verificar se o usuário tem plano ativo mas não tem registro em userSubscriptions
      if (user.subscriptionPlan && user.subscriptionPlan !== 'free' && user.subscriptionStatus === 'active') {
        console.log(`🔧 Usuário tem plano ${user.subscriptionPlan} ativo mas sem registro. Criando...`);
        
        try {
          // Buscar o ID do plano
          const plan = await db.select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.name, user.subscriptionPlan))
            .limit(1);
          
          if (plan.length > 0) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            
            // Criar registro retroativo
            const newSubscription = await db.insert(userSubscriptions).values({
              userId: user.id,
              planId: plan[0].id,
              status: 'active',
              startDate: startDate,
              endDate: endDate,
              paymentMethod: 'card',
              price: plan[0].price,
              createdAt: new Date(),
              updatedAt: new Date()
            }).returning();
            
            console.log(`✅ Registro de assinatura criado retroativamente para ${user.email}`);
            
            return res.json({
              subscription: {
                id: newSubscription[0].id,
                userId: newSubscription[0].userId,
                planId: newSubscription[0].planId,
                status: newSubscription[0].status,
                startDate: newSubscription[0].startDate,
                endDate: newSubscription[0].endDate,
                plan: plan[0]
              }
            });
          }
        } catch (error) {
          console.error('Erro ao criar registro retroativo:', error);
        }
      }
      
      // Se não há assinatura, retornar null para que o dashboard redirecione para first-subscription
      return res.json({
        subscription: null
      });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar assinatura do usuário:', error);
    
    // Em caso de erro, retornar null para forçar onboarding
    return res.json({
      subscription: null
    });
  }
});

export default router; 
