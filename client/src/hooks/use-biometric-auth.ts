import { useState, useEffect, useCallback } from 'react';
import { biometricAuth } from '@/services/biometric-auth';
import { useToast } from '@/hooks/use-toast';

export interface UseBiometricAuthReturn {
  isAvailable: boolean;
  biometryType: string | null;
  biometryTypeName: string;
  isAuthenticating: boolean;
  authenticate: (reason?: string) => Promise<boolean>;
  saveCredentials: (username: string, password: string) => Promise<boolean>;
  getStoredCredentials: () => Promise<{ username?: string; password?: string } | null>;
  clearCredentials: () => Promise<boolean>;
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initBiometric = async () => {
      await biometricAuth.initialize();
      setIsAvailable(biometricAuth.isSupported());
      setBiometryType(biometricAuth.getBiometryType());
    };

    initBiometric();
  }, []);

  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    if (!isAvailable) {
      return false;
    }

    setIsAuthenticating(true);
    try {
      const result = await biometricAuth.authenticate(reason);
      
      if (!result.isAuthenticated && result.error) {
        toast({
          title: 'Falha na autenticação',
          description: result.error,
          variant: 'destructive'
        });
      }
      
      return result.isAuthenticated;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAvailable, toast]);

  const saveCredentials = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const saved = await biometricAuth.saveCredentials(username, password);
      if (saved) {
        toast({
          title: 'Credenciais salvas',
          description: `Login rápido com ${biometricAuth.getBiometryTypeName()} ativado`,
        });
      }
      return saved;
    } catch (error) {
      console.error('Error saving credentials:', error);
      return false;
    }
  }, [toast]);

  const getStoredCredentials = useCallback(async () => {
    return await biometricAuth.getCredentials();
  }, []);

  const clearCredentials = useCallback(async (): Promise<boolean> => {
    try {
      const deleted = await biometricAuth.deleteCredentials();
      if (deleted) {
        toast({
          title: 'Credenciais removidas',
          description: 'Login rápido desativado',
        });
      }
      return deleted;
    } catch (error) {
      console.error('Error clearing credentials:', error);
      return false;
    }
  }, [toast]);

  return {
    isAvailable,
    biometryType,
    biometryTypeName: biometricAuth.getBiometryTypeName(),
    isAuthenticating,
    authenticate,
    saveCredentials,
    getStoredCredentials,
    clearCredentials
  };
}