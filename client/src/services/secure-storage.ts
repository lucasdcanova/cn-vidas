import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';

export interface SecureStorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class SecureStorageService {
  private isNative = Capacitor.isNativePlatform();
  private prefix = 'cnvidas_';

  // Salvar dados sensíveis
  async save(key: string, value: any): Promise<SecureStorageResult> {
    try {
      const prefixedKey = this.prefix + key;
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      if (this.isNative) {
        await SecureStorage.set({ key: prefixedKey, value: stringValue });
      } else {
        // Fallback para localStorage em ambiente web (não seguro)
        localStorage.setItem(prefixedKey, stringValue);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error saving to secure storage:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao salvar dados seguros' 
      };
    }
  }

  // Recuperar dados sensíveis
  async get<T = any>(key: string): Promise<SecureStorageResult<T>> {
    try {
      const prefixedKey = this.prefix + key;
      let value: string | null = null;

      if (this.isNative) {
        const result = await SecureStorage.get({ key: prefixedKey });
        value = result.value;
      } else {
        // Fallback para localStorage em ambiente web
        value = localStorage.getItem(prefixedKey);
      }

      if (value === null) {
        return { success: false, error: 'Chave não encontrada' };
      }

      try {
        const parsedValue = JSON.parse(value);
        return { success: true, data: parsedValue };
      } catch {
        // Se não for JSON, retorna como string
        return { success: true, data: value as T };
      }
    } catch (error: any) {
      console.error('Error reading from secure storage:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao recuperar dados seguros' 
      };
    }
  }

  // Remover dados sensíveis
  async remove(key: string): Promise<SecureStorageResult> {
    try {
      const prefixedKey = this.prefix + key;

      if (this.isNative) {
        await SecureStorage.remove({ key: prefixedKey });
      } else {
        localStorage.removeItem(prefixedKey);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error removing from secure storage:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao remover dados seguros' 
      };
    }
  }

  // Limpar todos os dados do app
  async clear(): Promise<SecureStorageResult> {
    try {
      if (this.isNative) {
        await SecureStorage.clear();
      } else {
        // Limpar apenas chaves com nosso prefixo
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error clearing secure storage:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao limpar dados seguros' 
      };
    }
  }

  // Verificar se uma chave existe
  async exists(key: string): Promise<boolean> {
    const result = await this.get(key);
    return result.success;
  }

  // Chaves específicas para dados sensíveis do CNVidas
  static readonly Keys = {
    AUTH_TOKEN: 'auth_token',
    USER_CREDENTIALS: 'user_credentials',
    BIOMETRIC_ENABLED: 'biometric_enabled',
    PAYMENT_INFO: 'payment_info',
    MEDICAL_DATA_CACHE: 'medical_data_cache',
    EMERGENCY_CONTACT: 'emergency_contact',
    SESSION_DATA: 'session_data'
  } as const;
}

export const secureStorage = new SecureStorageService();