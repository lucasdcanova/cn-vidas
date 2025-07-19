/**
 * Serviço para gerenciar eventos do Meta Pixel (Facebook Pixel)
 */

// Tipos para os eventos do Meta Pixel
interface MetaPixelEvent {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  num_items?: number;
  [key: string]: any;
}

// Declaração global para o fbq
declare global {
  interface Window {
    fbq: (command: string, event: string, parameters?: MetaPixelEvent) => void;
  }
}

// Valores dos planos para tracking de conversão
const PLAN_VALUES = {
  // Planos individuais
  basic: 139.90,
  standard: 219.90,  // Valor estimado
  premium: 349.90,   // Valor estimado
  
  // Planos familiares
  family_basic: 279.90,    // Valor estimado para 2 pessoas
  family_plus: 419.90,     // Valor estimado para 4 pessoas
  ultra_family: 699.90,    // Valor estimado para 6 pessoas
  
  // Planos corporativos (valor por funcionário)
  basic_corp: 99.90,
  premium_corp: 189.90,
  ultra_corp: 299.90,
  
  // Plano médico (gratuito)
  medical: 0,
  
  // Valor padrão quando não há plano específico
  default: 139.90
};

class MetaPixelService {
  private initialized = false;

  /**
   * Verifica se o Meta Pixel está disponível
   */
  private isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.fbq === 'function';
  }

  /**
   * Verifica se o usuário consentiu com cookies de marketing
   */
  private hasMarketingConsent(): boolean {
    // Verificar no localStorage se o usuário aceitou cookies de marketing
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) return false;
    
    try {
      const consentData = JSON.parse(consent);
      return consentData.marketing === true;
    } catch {
      return false;
    }
  }

  /**
   * Dispara um evento no Meta Pixel
   */
  private trackEvent(eventName: string, parameters?: MetaPixelEvent): void {
    if (!this.isAvailable()) {
      console.warn('Meta Pixel não está disponível');
      return;
    }

    if (!this.hasMarketingConsent()) {
      console.log('Usuário não consentiu com cookies de marketing');
      return;
    }

    try {
      window.fbq('track', eventName, parameters);
      console.log(`Meta Pixel: Evento '${eventName}' disparado`, parameters);
    } catch (error) {
      console.error('Erro ao disparar evento do Meta Pixel:', error);
    }
  }

  /**
   * Evento de registro completo
   * Disparado quando um usuário completa o cadastro
   */
  trackCompleteRegistration(userData: {
    userId: number;
    role: 'patient' | 'doctor' | 'partner' | 'admin';
    email: string;
    fullName: string;
    subscriptionPlan?: string;
  }): void {
    // Determinar o valor baseado no tipo de usuário e plano
    let value = PLAN_VALUES.default;
    let contentName = 'Registro Padrão';

    if (userData.role === 'patient') {
      // Para pacientes, usar o valor do plano básico como padrão
      value = userData.subscriptionPlan 
        ? PLAN_VALUES[userData.subscriptionPlan as keyof typeof PLAN_VALUES] || PLAN_VALUES.basic
        : PLAN_VALUES.basic;
      contentName = `Registro Paciente - ${userData.subscriptionPlan || 'Plano Básico'}`;
    } else if (userData.role === 'doctor') {
      // Médicos têm registro gratuito
      value = PLAN_VALUES.medical;
      contentName = 'Registro Médico';
    } else if (userData.role === 'partner') {
      // Parceiros B2B - usar valor estimado do plano corporativo básico
      value = PLAN_VALUES.basic_corp;
      contentName = 'Registro Parceiro B2B';
    }

    const eventData: MetaPixelEvent = {
      value: value,
      currency: 'BRL',
      content_name: contentName,
      content_category: userData.role,
      content_ids: [userData.userId.toString()],
      content_type: 'product',
      num_items: 1,
      // Dados adicionais para segmentação
      user_role: userData.role,
      predicted_ltv: value * 12 // Lifetime value estimado (12 meses)
    };

    this.trackEvent('CompleteRegistration', eventData);
  }

  /**
   * Evento de visualização de conteúdo
   * Útil para rastrear quando usuários visualizam planos
   */
  trackViewContent(content: {
    contentId: string;
    contentName: string;
    contentCategory: string;
    value?: number;
  }): void {
    const eventData: MetaPixelEvent = {
      content_ids: [content.contentId],
      content_name: content.contentName,
      content_category: content.contentCategory,
      content_type: 'product',
      value: content.value || 0,
      currency: 'BRL'
    };

    this.trackEvent('ViewContent', eventData);
  }

  /**
   * Evento de início de checkout
   * Quando usuário inicia processo de assinatura
   */
  trackInitiateCheckout(planData: {
    planId: string;
    planName: string;
    value: number;
  }): void {
    const eventData: MetaPixelEvent = {
      content_ids: [planData.planId],
      content_name: planData.planName,
      content_category: 'subscription',
      num_items: 1,
      value: planData.value,
      currency: 'BRL'
    };

    this.trackEvent('InitiateCheckout', eventData);
  }

  /**
   * Evento de compra completada
   * Quando a assinatura é confirmada
   */
  trackPurchase(purchaseData: {
    orderId: string;
    value: number;
    planName: string;
    planId: string;
    userId: number;
  }): void {
    const eventData: MetaPixelEvent = {
      value: purchaseData.value,
      currency: 'BRL',
      content_name: purchaseData.planName,
      content_ids: [purchaseData.planId],
      content_type: 'product',
      num_items: 1,
      order_id: purchaseData.orderId
    };

    this.trackEvent('Purchase', eventData);
  }

  /**
   * Evento customizado para rastrear consultas agendadas
   */
  trackScheduleAppointment(appointmentData: {
    appointmentType: string;
    doctorId?: number;
    value?: number;
  }): void {
    const eventData: MetaPixelEvent = {
      content_name: `Consulta ${appointmentData.appointmentType}`,
      content_category: 'appointment',
      value: appointmentData.value || 0,
      currency: 'BRL'
    };

    this.trackEvent('Schedule', eventData);
  }

  /**
   * Define o consentimento de cookies
   */
  setMarketingConsent(consent: boolean): void {
    const currentConsent = localStorage.getItem('cookieConsent');
    let consentData = { marketing: consent };

    if (currentConsent) {
      try {
        consentData = { ...JSON.parse(currentConsent), marketing: consent };
      } catch {
        // Manter o valor padrão
      }
    }

    localStorage.setItem('cookieConsent', JSON.stringify(consentData));

    if (consent && this.isAvailable()) {
      // Se o usuário consentiu, disparar PageView retroativamente
      window.fbq('track', 'PageView');
    }
  }
}

// Exportar instância única do serviço
export const metaPixel = new MetaPixelService();

// Exportar valores dos planos para uso em outros lugares
export { PLAN_VALUES };