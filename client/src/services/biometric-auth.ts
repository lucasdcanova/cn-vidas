import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';

export interface BiometricResult {
  isAuthenticated: boolean;
  error?: string;
}

class BiometricAuthService {
  private isAvailable = false;
  private biometryType: string | null = null;

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Biometric auth not available on web');
      return;
    }

    try {
      const result = await BiometricAuth.checkBiometry();
      this.isAvailable = result.isAvailable;
      this.biometryType = result.biometryType;
      
      console.log('Biometric auth initialized:', {
        available: this.isAvailable,
        type: this.biometryType,
        strongBiometry: result.strongBiometryIsAvailable
      });
    } catch (error) {
      console.error('Error initializing biometric auth:', error);
      this.isAvailable = false;
    }
  }

  async authenticate(reason?: string): Promise<BiometricResult> {
    if (!this.isAvailable) {
      return {
        isAuthenticated: false,
        error: 'Biometric authentication not available'
      };
    }

    try {
      const result = await BiometricAuth.authenticate({
        reason: reason || 'Autenticar no CN Vidas',
        cancelTitle: 'Cancelar',
        fallbackTitle: 'Usar senha',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Usar senha',
        androidTitle: 'Autenticação Biométrica',
        androidSubtitle: 'Faça login com sua digital ou face',
        androidConfirmationRequired: false
      });

      return {
        isAuthenticated: true
      };
    } catch (error: any) {
      console.error('Biometric authentication failed:', error);
      
      let errorMessage = 'Falha na autenticação';
      if (error.code) {
        switch (error.code) {
          case 'userCancel':
            errorMessage = 'Autenticação cancelada';
            break;
          case 'systemCancel':
            errorMessage = 'Sistema cancelou a autenticação';
            break;
          case 'passcodeNotSet':
            errorMessage = 'Senha do dispositivo não configurada';
            break;
          case 'biometryNotAvailable':
            errorMessage = 'Biometria não disponível';
            break;
          case 'biometryNotEnrolled':
            errorMessage = 'Nenhuma biometria cadastrada';
            break;
          case 'biometryLockout':
            errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
            break;
          default:
            errorMessage = error.message || 'Erro desconhecido';
        }
      }

      return {
        isAuthenticated: false,
        error: errorMessage
      };
    }
  }

  async saveCredentials(username: string, password: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      // Salvar no keychain do iOS / keystore do Android
      await BiometricAuth.setCredentials({
        username,
        password,
        server: 'com.cnvidas.app'
      });
      return true;
    } catch (error) {
      console.error('Error saving credentials:', error);
      return false;
    }
  }

  async getCredentials(): Promise<{ username?: string; password?: string } | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const credentials = await BiometricAuth.getCredentials({
        server: 'com.cnvidas.app'
      });
      return credentials;
    } catch (error) {
      console.error('Error getting credentials:', error);
      return null;
    }
  }

  async deleteCredentials(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      await BiometricAuth.deleteCredentials({
        server: 'com.cnvidas.app'
      });
      return true;
    } catch (error) {
      console.error('Error deleting credentials:', error);
      return false;
    }
  }

  isSupported(): boolean {
    return this.isAvailable;
  }

  getBiometryType(): string | null {
    return this.biometryType;
  }

  getBiometryTypeName(): string {
    switch (this.biometryType) {
      case 'touchId':
        return 'Touch ID';
      case 'faceId':
        return 'Face ID';
      case 'fingerprintAuthentication':
        return 'Impressão Digital';
      case 'faceAuthentication':
        return 'Reconhecimento Facial';
      case 'irisAuthentication':
        return 'Reconhecimento de Íris';
      default:
        return 'Biometria';
    }
  }
}

export const biometricAuth = new BiometricAuthService();