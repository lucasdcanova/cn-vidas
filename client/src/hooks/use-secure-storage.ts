import { useState, useCallback } from 'react';
import { secureStorage, SecureStorageResult } from '@/services/secure-storage';
import { useToast } from '@/hooks/use-toast';

export interface UseSecureStorageReturn {
  isLoading: boolean;
  saveSecure: <T = any>(key: string, value: T) => Promise<boolean>;
  getSecure: <T = any>(key: string) => Promise<T | null>;
  removeSecure: (key: string) => Promise<boolean>;
  clearAll: () => Promise<boolean>;
  checkExists: (key: string) => Promise<boolean>;
}

export function useSecureStorage(): UseSecureStorageReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveSecure = useCallback(async <T = any>(key: string, value: T): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await secureStorage.save(key, value);
      
      if (!result.success && result.error) {
        toast({
          title: 'Erro ao salvar',
          description: result.error,
          variant: 'destructive'
        });
      }
      
      return result.success;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getSecure = useCallback(async <T = any>(key: string): Promise<T | null> => {
    setIsLoading(true);
    try {
      const result = await secureStorage.get<T>(key);
      
      if (!result.success) {
        return null;
      }
      
      return result.data || null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeSecure = useCallback(async (key: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await secureStorage.remove(key);
      
      if (!result.success && result.error) {
        toast({
          title: 'Erro ao remover',
          description: result.error,
          variant: 'destructive'
        });
      }
      
      return result.success;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearAll = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await secureStorage.clear();
      
      if (!result.success && result.error) {
        toast({
          title: 'Erro ao limpar dados',
          description: result.error,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Dados limpos',
          description: 'Todos os dados seguros foram removidos',
        });
      }
      
      return result.success;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const checkExists = useCallback(async (key: string): Promise<boolean> => {
    return await secureStorage.exists(key);
  }, []);

  return {
    isLoading,
    saveSecure,
    getSecure,
    removeSecure,
    clearAll,
    checkExists
  };
}