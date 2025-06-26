import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { isNativeApp, isIOS } from '@/utils/platform';
import { sessionManager } from '@/services/session-manager';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

/**
 * Componente que monitora o ciclo de vida do app iOS
 * Garante que a sessão seja limpa corretamente quando o app é fechado/aberto
 */
export function IOSAppLifecycle() {
  const { user } = useAuth();

  useEffect(() => {
    // Só executar no iOS nativo
    if (!isNativeApp() || !isIOS()) {
      return;
    }

    // Função para verificar e limpar sessão fantasma
    const checkSessionOnResume = async () => {
      console.log('📱 App iOS resumido - verificando sessão');
      
      // Verificar se há token válido
      const authToken = localStorage.getItem('authToken');
      const hasCookies = document.cookie.includes('auth_token');
      
      // Se não há token nem cookies mas há usuário em cache, limpar
      if (!authToken && !hasCookies && user) {
        console.log('👻 Sessão fantasma detectada ao resumir app, limpando...');
        await sessionManager.clearSession();
        
        // Forçar reload da página
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    };

    // Listener para quando o app volta ao primeiro plano
    const resumeListener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('📱 App iOS voltou ao primeiro plano');
        checkSessionOnResume();
      } else {
        console.log('📱 App iOS foi para segundo plano');
      }
    });

    // Listener para quando o app é pausado (vai para background)
    const pauseListener = App.addListener('pause', () => {
      console.log('⏸️ App iOS pausado');
      
      // Se não há token válido, limpar qualquer cache residual
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        queryClient.setQueryData(['/api/user'], null);
      }
    });

    // Listener para quando o app é resumido
    const resumeDirectListener = App.addListener('resume', () => {
      console.log('▶️ App iOS resumido diretamente');
      checkSessionOnResume();
    });

    // Verificar sessão ao montar o componente
    checkSessionOnResume();

    return () => {
      resumeListener.remove();
      pauseListener.remove();
      resumeDirectListener.remove();
    };
  }, [user]);

  return null;
}