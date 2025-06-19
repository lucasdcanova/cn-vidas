import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

/**
 * Hook para garantir que os dados do usuário estejam sempre atualizados
 * Útil quando o componente precisa dos dados mais recentes do usuário
 */
export function useFreshUserData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const refreshUserData = async () => {
      try {
        // Forçar refresh dos dados do usuário
        const response = await apiRequest('POST', '/api/auth/refresh-user');
        const userData = await response.json();
        
        // Atualizar o cache com os dados frescos
        queryClient.setQueryData(['/api/user'], userData);
        
        console.log('✅ Dados do usuário atualizados:', userData.email, '- profileImage:', userData.profileImage);
      } catch (error) {
        console.error('Erro ao atualizar dados do usuário:', error);
      }
    };

    refreshUserData();
  }, []); // Executar apenas quando o componente montar

  // Também retornar uma função para refresh manual
  const refreshUserData = async () => {
    try {
      const response = await apiRequest('POST', '/api/auth/refresh-user');
      const userData = await response.json();
      
      queryClient.setQueryData(['/api/user'], userData);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      return userData;
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      throw error;
    }
  };

  return { refreshUserData };
}