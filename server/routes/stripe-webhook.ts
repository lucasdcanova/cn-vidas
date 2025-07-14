import { Router, Request, Response } from 'express';
import stripe from '../utils/stripe-instance.js';
import { db } from '../db.js';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const stripeWebhookRouter = Router();

// Webhook endpoint para processar eventos do Stripe
stripeWebhookRouter.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET não configurado');
    return res.status(500).send('Webhook secret não configurado');
  }

  let event;

  try {
    // Verificar a assinatura do webhook
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error(`❌ Erro na verificação do webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📨 Evento Stripe recebido: ${event.type}`);

  try {
    switch (event.type) {
      case 'setup_intent.succeeded': {
        const setupIntent = event.data.object as any;
        console.log('✅ Setup Intent bem-sucedido:', setupIntent.id);
        
        // O payment method já está anexado ao customer automaticamente
        // quando usamos setup intents com um customer específico
        
        if (setupIntent.payment_method && setupIntent.customer) {
          console.log(`💳 Payment method ${setupIntent.payment_method} já está anexado ao customer ${setupIntent.customer}`);
          
          // Opcionalmente, definir como método de pagamento padrão
          try {
            await stripe.customers.update(setupIntent.customer, {
              invoice_settings: {
                default_payment_method: setupIntent.payment_method
              }
            });
            console.log('✅ Método de pagamento definido como padrão');
          } catch (error) {
            console.error('⚠️ Erro ao definir método padrão:', error);
          }
        }
        break;
      }

      case 'payment_method.attached': {
        const paymentMethod = event.data.object as any;
        console.log(`💳 Método de pagamento anexado: ${paymentMethod.id} ao cliente ${paymentMethod.customer}`);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        console.log('💰 Pagamento bem-sucedido:', paymentIntent.id);
        
        // Se o pagamento foi bem-sucedido e tem um payment method,
        // garantir que ele está salvo para uso futuro
        if (paymentIntent.payment_method && paymentIntent.customer && paymentIntent.setup_future_usage) {
          try {
            // O payment method já deve estar anexado, mas vamos verificar
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string);
            
            if (!paymentMethod.customer) {
              // Se não estiver anexado, anexar agora
              await stripe.paymentMethods.attach(paymentIntent.payment_method as string, {
                customer: paymentIntent.customer as string
              });
              console.log('✅ Método de pagamento anexado ao cliente após pagamento');
            }
          } catch (error) {
            console.error('⚠️ Erro ao verificar/anexar método de pagamento:', error);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        console.log(`📅 Assinatura ${event.type === 'customer.subscription.created' ? 'criada' : 'atualizada'}:`, subscription.id);
        
        // Atualizar o status da assinatura no banco de dados
        if (subscription.customer) {
          try {
            // Buscar o usuário pelo stripeCustomerId
            const [user] = await db.select()
              .from(users)
              .where(eq(users.stripeCustomerId, subscription.customer))
              .limit(1);
            
            if (user) {
              await db.update(users)
                .set({
                  stripeSubscriptionId: subscription.id,
                  subscriptionStatus: subscription.status === 'active' ? 'active' : 'pending'
                })
                .where(eq(users.id, user.id));
              
              console.log(`✅ Status da assinatura atualizado para o usuário ${user.email}`);
            }
          } catch (error) {
            console.error('⚠️ Erro ao atualizar assinatura no banco:', error);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        console.log('❌ Assinatura cancelada:', subscription.id);
        
        // Atualizar o status no banco de dados
        if (subscription.customer) {
          try {
            const [user] = await db.select()
              .from(users)
              .where(eq(users.stripeCustomerId, subscription.customer))
              .limit(1);
            
            if (user) {
              await db.update(users)
                .set({
                  subscriptionStatus: 'inactive',
                  stripeSubscriptionId: null
                })
                .where(eq(users.id, user.id));
              
              console.log(`✅ Assinatura cancelada para o usuário ${user.email}`);
            }
          } catch (error) {
            console.error('⚠️ Erro ao cancelar assinatura no banco:', error);
          }
        }
        break;
      }

      default:
        console.log(`⚠️ Evento não tratado: ${event.type}`);
    }

    // Retornar sucesso para o Stripe
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).send('Erro ao processar webhook');
  }
});

export default stripeWebhookRouter;