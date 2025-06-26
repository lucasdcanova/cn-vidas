import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isNativeApp, isIOS } from '@/utils/platform';
import { sessionManager } from '@/services/session-manager';
import { queryClient } from '@/lib/queryClient';

/**
 * Componente que monitora e protege contra sessões fantasmas no iOS
 * Deve ser usado no componente raiz da aplicação
 */
export function IOSSessionGuard() {
  const location = useLocation();

  useEffect(() => {
    // Só executar no iOS nativo
    if (!isNativeApp() || !isIOS()) {
      return;
    }

    // Verificar sessão quando navegar para /auth (página de login)
    if (location.pathname === '/auth') {
      console.log('🔒 IOSSessionGuard: Verificando sessão na página de login');
      
      const checkAndClearPhantomSession = async () => {
        try {
          // Verificar se há dados de usuário em cache mas sem token válido
          const cachedUser = queryClient.getQueryData(['/api/user']);
          const authToken = localStorage.getItem('authToken');
          const hasCookies = document.cookie.includes('auth_token');
          
          if (cachedUser && !authToken && !hasCookies) {
            console.log('👻 IOSSessionGuard: Detectada sessão fantasma, limpando...');
            
            // Limpar completamente a sessão
            await sessionManager.clearSession();
            
            // Forçar reload da página para garantir estado limpo
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        } catch (error) {
          console.error('Erro ao verificar sessão fantasma:', error);
        }
      };

      // Adicionar delay para evitar conflitos no carregamento inicial
      setTimeout(checkAndClearPhantomSession, 100);
    }
  }, [location.pathname]);

  // Monitorar mudanças no estado de autenticação
  useEffect(() => {
    if (!isNativeApp() || !isIOS()) {
      return;
    }

    // Função para verificar consistência da sessão
    const checkSessionConsistency = () => {
      const cachedUser = queryClient.getQueryData(['/api/user']);
      const authToken = localStorage.getItem('authToken');
      
      // Se há usuário em cache mas sem token, há inconsistência
      if (cachedUser && !authToken && location.pathname !== '/auth') {
        console.log('⚠️ IOSSessionGuard: Inconsistência detectada - usuário sem token');
        
        // Invalidar cache do usuário
        queryClient.setQueryData(['/api/user'], null);
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      }
    };

    // Verificar consistência ao montar e a cada 5 segundos
    checkSessionConsistency();
    const interval = setInterval(checkSessionConsistency, 5000);

    return () => clearInterval(interval);
  }, [location.pathname]);

  // Adicionar listener para eventos de visibilidade da página
  useEffect(() => {
    if (!isNativeApp() || !isIOS()) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 IOSSessionGuard: App voltou ao primeiro plano');
        
        // Verificar se estamos na página de login sem token
        if (location.pathname === '/auth') {
          const authToken = localStorage.getItem('authToken');
          const cachedUser = queryClient.getQueryData(['/api/user']);
          
          if (!authToken && cachedUser) {
            console.log('🧹 IOSSessionGuard: Limpando cache após retornar ao app');
            queryClient.setQueryData(['/api/user'], null);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  return null;
}