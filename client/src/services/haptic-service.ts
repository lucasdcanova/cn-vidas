import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

class HapticService {
  private isNative = Capacitor.isNativePlatform();
  private enabled = true;

  // Desabilitar/habilitar haptic feedback
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled && this.isNative;
  }

  // Vibração simples
  async vibrate(duration: number = 300): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.error('Erro ao vibrar:', error);
    }
  }

  // Feedback de impacto com diferentes intensidades
  async impact(style: HapticType = 'medium'): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      let impactStyle: ImpactStyle;
      
      switch (style) {
        case 'light':
          impactStyle = ImpactStyle.Light;
          break;
        case 'heavy':
          impactStyle = ImpactStyle.Heavy;
          break;
        case 'medium':
        default:
          impactStyle = ImpactStyle.Medium;
          break;
      }

      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('Erro no feedback de impacto:', error);
    }
  }

  // Feedback de notificação (sucesso, aviso, erro)
  async notification(type: 'success' | 'warning' | 'error'): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      let notificationType: NotificationType;
      
      switch (type) {
        case 'success':
          notificationType = NotificationType.Success;
          break;
        case 'warning':
          notificationType = NotificationType.Warning;
          break;
        case 'error':
          notificationType = NotificationType.Error;
          break;
      }

      await Haptics.notification({ type: notificationType });
    } catch (error) {
      console.error('Erro no feedback de notificação:', error);
    }
  }

  // Feedback de seleção (leve, para toggles e seleções)
  async selectionStart(): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      await Haptics.selectionStart();
    } catch (error) {
      console.error('Erro no feedback de seleção:', error);
    }
  }

  async selectionChanged(): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      await Haptics.selectionChanged();
    } catch (error) {
      console.error('Erro no feedback de seleção:', error);
    }
  }

  async selectionEnd(): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      await Haptics.selectionEnd();
    } catch (error) {
      console.error('Erro no feedback de seleção:', error);
    }
  }

  // Feedbacks personalizados para ações do CNVidas
  async buttonPress(): Promise<void> {
    await this.impact('light');
  }

  async submitForm(): Promise<void> {
    await this.impact('medium');
  }

  async loginSuccess(): Promise<void> {
    await this.notification('success');
  }

  async errorOccurred(): Promise<void> {
    await this.notification('error');
  }

  async toggleSwitch(): Promise<void> {
    await this.selectionChanged();
  }

  async appointmentBooked(): Promise<void> {
    await this.notification('success');
  }

  async emergencyAlert(): Promise<void> {
    await this.vibrate(500);
    await this.notification('error');
  }

  async messageReceived(): Promise<void> {
    await this.impact('light');
  }

  async photoCapture(): Promise<void> {
    await this.impact('medium');
  }

  async biometricSuccess(): Promise<void> {
    await this.notification('success');
  }

  async pullToRefresh(): Promise<void> {
    await this.impact('light');
  }

  // Métodos de conveniência
  async success(): Promise<void> {
    await this.notification('success');
  }

  async error(): Promise<void> {
    await this.notification('error');
  }

  async warning(): Promise<void> {
    await this.notification('warning');
  }
}

export const hapticService = new HapticService();