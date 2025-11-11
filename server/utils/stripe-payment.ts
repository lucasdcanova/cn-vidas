// @ts-nocheck
import { storage } from '../storage';
import stripe from './stripe-instance';
import type Stripe from 'stripe';
import type { User } from '../types/authenticated-request';
import { AppError } from './app-error';

/**
 * Configurações para os métodos de pagamento brasileiros
 */
export const brazilianPaymentOptions = {
  // Opções para pagamento via PIX
  pix: {
    expires_in: 3600, // 60 minutos (1 hora)
  },
  // Opções para pagamento via boleto
  boleto: {
    expires_in: 259200, // 3 dias (72 horas = 259200 segundos)
  }
};

interface ConsultationMetadata {
  userId: string;
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  appointmentId: string;
  isEmergency: string;
}

/**
 * Cria uma intenção de pagamento para consulta com pré-autorização
 * O valor será reservado no cartão, mas só será capturado após a consulta
 */
export async function createConsultationPaymentIntent(
  amount: number, 
  customerId: string,
  metadata: ConsultationMetadata
): Promise<Stripe.PaymentIntent> {
  try {
    // Criar a intenção de pagamento com captura manual
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Converter para centavos
      currency: 'brl',
      customer: customerId,
      setup_future_usage: 'off_session',
      capture_method: 'manual', // Importante: habilita a captura manual (pré-autorização)
      metadata: {
        ...metadata,
        type: 'consultation_payment',
      },
      description: `Consulta com Dr. ${metadata.doctorName} em ${new Date(metadata.appointmentDate).toLocaleDateString('pt-BR')}`,
    });

    return paymentIntent;
  } catch (error) {
    console.error('Erro ao criar intenção de pagamento para consulta:', error);
    throw error;
  }
}

/**
 * Captura um pagamento pré-autorizado após a consulta ser realizada
 */
export async function captureConsultationPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  try {
    // Capturar o pagamento
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    
    return paymentIntent;
  } catch (error) {
    console.error('Erro ao capturar pagamento de consulta:', error);
    throw error;
  }
}

/**
 * Cancela um pagamento pré-autorizado caso a consulta seja cancelada
 */
export async function cancelConsultationPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  try {
    // Cancelar a intenção de pagamento
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId, {
      cancellation_reason: 'requested_by_customer'
    });
    
    return paymentIntent;
  } catch (error) {
    console.error('Erro ao cancelar pagamento de consulta:', error);
    throw error;
  }
}

/**
 * Consulta o status de um pagamento
 */
export async function checkPaymentStatus(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    throw error;
  }
}

/**
 * Aplica desconto do plano de assinatura ao preço da consulta
 */
export function calculatePriceWithSubscriptionDiscount(
  basePrice: number,
  subscriptionPlan: string | null | undefined
): { finalPrice: number, discountPercentage: number } {
  let discountPercentage = 0;
  
  if (!subscriptionPlan || subscriptionPlan === 'free') {
    discountPercentage = 0;
  } else if (subscriptionPlan === 'basic' || subscriptionPlan === 'basic_family') {
    discountPercentage = 30;
  } else if (subscriptionPlan === 'premium' || subscriptionPlan === 'premium_family') {
    discountPercentage = 50;
  } else if (subscriptionPlan === 'ultra' || subscriptionPlan === 'ultra_family') {
    discountPercentage = 70;
  }
  
  // Calcula o preço com desconto
  const discount = (basePrice * discountPercentage) / 100;
  const finalPrice = basePrice - discount;
  
  return {
    finalPrice,
    discountPercentage
  };
}

/**
 * Verifica se deve cobrar por uma consulta de emergência com base no plano do usuário
 * @param subscriptionPlan Plano de assinatura do usuário
 * @param emergencyConsultationsLeft Número de consultas de emergência restantes (para plano básico)
 * @returns true se deve cobrar, false se estiver incluído no plano
 */
export function shouldChargeForEmergencyConsultation(
  subscriptionPlan: string | null | undefined,
  emergencyConsultationsLeft: number | null | undefined
): boolean {
  // Planos premium e ultra têm consultas de emergência ilimitadas incluídas
  if (
    subscriptionPlan === 'premium' || 
    subscriptionPlan === 'premium_family' || 
    subscriptionPlan === 'ultra' || 
    subscriptionPlan === 'ultra_family'
  ) {
    return false; // Não cobrar
  }
  
  // Plano básico tem um número limitado de consultas de emergência
  if (
    (subscriptionPlan === 'basic' || subscriptionPlan === 'basic_family') && 
    emergencyConsultationsLeft !== null && 
    emergencyConsultationsLeft !== undefined && 
    emergencyConsultationsLeft > 0
  ) {
    return false; // Não cobrar se ainda tiver consultas disponíveis
  }
  
  // Para todos os outros casos (plano gratuito ou básico sem consultas disponíveis)
  return true; // Cobrar normalmente
}

/**
 * Cria uma sessão de pagamento para assinatura com suporte a métodos brasileiros
 * @param planId ID do plano de assinatura
 * @param customerId ID do cliente no Stripe
 * @param paymentMethod Método de pagamento selecionado (card, pix, boleto)
 * @returns Objeto com clientSecret e dados específicos do método de pagamento
 */
export async function createSubscriptionPaymentSession(
  planId: string,
  customerId: string,
  paymentMethod: 'card' | 'pix' | 'boleto',
  user: User
): Promise<{
  clientSecret: string;
  paymentMethod: string;
  pixInfo?: any;
  boletoInfo?: any;
}> {
  try {
    // Primeiro, obter informações do plano do banco de dados
    const plan = await storage.getPlanById(Number(planId));
    if (!plan) {
      throw new Error('Plano não encontrado');
    }

    const sanitizeDigits = (value?: string | null) => (value ? value.replace(/\D/g, '') : '');

    const ensureTaxId = (): string => {
      const digits = sanitizeDigits(user.cpf);
      if (!digits) {
        throw new AppError('Para pagar com boleto é necessário informar um CPF válido no seu perfil.', 400);
      }
      if (digits.length !== 11 && digits.length !== 14) {
        throw new AppError('CPF/CNPJ inválido. Atualize seus dados para continuar.', 400);
      }
      return digits;
    };

    const normalizeState = () => (user.state?.trim().toUpperCase() || 'SP').slice(0, 2);
    const normalizePostalCode = () => {
      const digits = sanitizeDigits(user.zipcode);
      if (!digits) return '00000000';
      return digits.padEnd(8, '0').slice(0, 8);
    };

    const buildAddress = (): Stripe.AddressParam => {
      const line1 = user.street?.trim() || user.address?.trim() || 'Endereço não informado';
      const line2Parts: string[] = [];
      if (user.number) line2Parts.push(`Nº ${user.number}`);
      if (user.complement) line2Parts.push(user.complement.trim());

      return {
        line1,
        line2: line2Parts.length ? line2Parts.join(' ') : undefined,
        city: user.city?.trim() || 'São Paulo',
        state: normalizeState(),
        country: 'BR',
        postal_code: normalizePostalCode(),
      };
    };

    const billingName = user.fullName || user.username || user.email;
    const billingEmail = user.email;

    if (!billingEmail) {
      throw new AppError('Não foi possível localizar um e-mail válido para emissão do pagamento.', 400);
    }

    // Configuração base para todos os métodos
    const baseOptions: Stripe.PaymentIntentCreateParams = {
      amount: plan.price,
      currency: 'brl',
      customer: customerId,
      metadata: {
        planId,
        planName: plan.name,
        planType: 'subscription',
        userId: user.id.toString(),
      },
      description: `Assinatura do plano ${plan.displayName}`,
      receipt_email: billingEmail,
    };
    
    // Adicionar configurações específicas para cada método de pagamento
    if (paymentMethod === 'pix') {
      // Configuração específica para PIX
      const pixExpiresSeconds = brazilianPaymentOptions.pix.expires_in;
      const paymentIntent = await stripe.paymentIntents.create({
        ...baseOptions,
        payment_method_types: ['pix'],
        payment_method_data: {
          type: 'pix',
        } as Stripe.PaymentIntentCreateParams.PaymentMethodData,
        payment_method_options: {
          pix: {
            expires_after_seconds: pixExpiresSeconds,
          },
        },
        confirm: true,
      });
      
      const pixAction = paymentIntent.next_action?.pix_display_qr_code;
      if (!pixAction) {
        throw new Error('Não foi possível gerar o QR Code PIX.');
      }

      const pixExpiresAt = pixAction.expires_at
        ? new Date(pixAction.expires_at * 1000).toISOString()
        : new Date(Date.now() + pixExpiresSeconds * 1000).toISOString();
      
      // Retornar dados específicos do PIX
      return {
        clientSecret: paymentIntent.client_secret as string,
        paymentMethod: 'pix',
        pixInfo: {
          qrCodeText: pixAction.data || '',
          qrCodeUrl: pixAction.image_url_png || '',
          amount: plan.price / 100,
          expiresAt: pixExpiresAt
        }
      };
    } else if (paymentMethod === 'boleto') {
      const taxId = ensureTaxId();
      const billingAddress = buildAddress();
      const boletoExpiresDays = Math.max(
        1,
        Math.round(brazilianPaymentOptions.boleto.expires_in / (24 * 60 * 60))
      );

      // Configuração específica para boleto
      const paymentIntent = await stripe.paymentIntents.create({
        ...baseOptions,
        payment_method_types: ['boleto'],
        payment_method_data: {
          type: 'boleto',
          billing_details: {
            name: billingName,
            email: billingEmail,
            address: billingAddress,
            phone: user.phone || undefined,
          },
          boleto: {
            tax_id: taxId,
          },
        } as unknown as Stripe.PaymentIntentCreateParams.PaymentMethodData,
        payment_method_options: {
          boleto: {
            expires_after_days: boletoExpiresDays,
          },
        },
        shipping: {
          name: billingName,
          address: billingAddress,
        },
        confirm: true,
      });
      
      const boletoDetails = paymentIntent.next_action?.boleto_display_details;
      if (!boletoDetails) {
        throw new Error('Não foi possível gerar o boleto bancário.');
      }
      
      const boletoExpiresAt = boletoDetails.expires_at
        ? new Date(boletoDetails.expires_at * 1000).toISOString()
        : new Date(Date.now() + boletoExpiresDays * 24 * 60 * 60 * 1000).toISOString();
      
      // Retornar dados específicos do boleto
      return {
        clientSecret: paymentIntent.client_secret as string,
        paymentMethod: 'boleto',
        boletoInfo: {
          code: boletoDetails.number || '',
          url: boletoDetails.hosted_voucher_url || '',
          amount: plan.price / 100,
          expiresAt: boletoExpiresAt
        }
      };
    } else {
      // Configuração para cartão de crédito (padrão)
      const paymentIntent = await stripe.paymentIntents.create({
        ...baseOptions,
        payment_method_types: ['card'],
        // Removido setup_future_usage que é incompatível com assinaturas
      });
      
      return {
        clientSecret: paymentIntent.client_secret as string,
        paymentMethod: 'card'
      };
    }
  } catch (error) {
    console.error('Erro ao criar sessão de pagamento para assinatura:', error);
    throw error;
  }
}
