import { useEffect, useRef } from 'react';
import { isNativeApp, isIOS } from '@/utils/platform';
import { queryClient } from '@/lib/queryClient';

/**
 * Componente que monitora o ciclo de vida do app iOS
 * Garante que a sessão seja limpa corretamente quando o app é fechado/aberto
 *
 * IMPORTANTE: Este componente NÃO usa useAuth() para evitar dependências circulares
 * que podem causar travamentos na inicialização do iOS
 */
export function IOSAppLifecycle() {
  const listenersRef = useRef<Array<{ remove: () => void }>>([]);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Só executar no iOS nativo e apenas uma vez
    if (!isNativeApp() || !isIOS() || isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;

    // Usar timeout para não bloquear a inicialização do app
    const initTimeout = setTimeout(async () => {
      try {
        // Importar App de forma assíncrona para não bloquear o carregamento
        const { App } = await import('@capacitor/app');

        console.log('📱 IOSAppLifecycle: Inicializando listeners...');

        // Função para verificar e limpar sessão fantasma
        const checkSessionOnResume = () => {
          try {
            console.log('📱 App iOS - verificando sessão');

            // Verificar se há token válido
            const authToken = localStorage.getItem('authToken');
            const hasCookies = document.cookie.includes('auth_token');
            const cachedUser = queryClient.getQueryData(['/api/user']);

            // Se não há token nem cookies mas há usuário em cache, limpar
            if (!authToken && !hasCookies && cachedUser) {
              console.log('👻 Sessão fantasma detectada, limpando cache...');
              queryClient.setQueryData(['/api/user'], null);
              queryClient.invalidateQueries({ queryKey: ['/api/user'] });
            }
          } catch (error) {
            console.error('Erro ao verificar sessão:', error);
          }
        };

        // Adicionar listeners com timeout para evitar travamentos
        const addListenerWithTimeout = async (
          eventName: string,
          handler: (...args: any[]) => void,
          timeoutMs = 3000
        ) => {
          return new Promise<{ remove: () => void } | null>((resolve) => {
            const timeout = setTimeout(() => {
              console.warn(`⏱️ Timeout ao adicionar listener ${eventName}`);
              resolve(null);
            }, timeoutMs);

            try {
              const listenerPromise = (App as any).addListener(eventName, handler);

              // Se addListener retorna uma Promise
              if (listenerPromise && typeof listenerPromise.then === 'function') {
                listenerPromise
                  .then((listener: { remove: () => void }) => {
                    clearTimeout(timeout);
                    resolve(listener);
                  })
                  .catch((error: Error) => {
                    clearTimeout(timeout);
                    console.error(`Erro ao adicionar listener ${eventName}:`, error);
                    resolve(null);
                  });
              } else {
                // Se retorna diretamente o listener
                clearTimeout(timeout);
                resolve(listenerPromise);
              }
            } catch (error) {
              clearTimeout(timeout);
              console.error(`Erro ao adicionar listener ${eventName}:`, error);
              resolve(null);
            }
          });
        };

        // Adicionar listeners de forma assíncrona e não bloqueante
        const resumeListener = await addListenerWithTimeout('appStateChange', ({ isActive }: { isActive: boolean }) => {
          if (isActive) {
            console.log('📱 App iOS voltou ao primeiro plano');
            setTimeout(checkSessionOnResume, 200);
          } else {
            console.log('📱 App iOS foi para segundo plano');
          }
        });

        if (resumeListener) {
          listenersRef.current.push(resumeListener);
        }

        const pauseListener = await addListenerWithTimeout('pause', () => {
          console.log('⏸️ App iOS pausado');
          const authToken = localStorage.getItem('authToken');
          if (!authToken) {
            queryClient.setQueryData(['/api/user'], null);
          }
        });

        if (pauseListener) {
          listenersRef.current.push(pauseListener);
        }

        console.log('✅ IOSAppLifecycle: Listeners configurados com sucesso');

      } catch (error) {
        // Se falhar ao importar ou configurar, apenas logar o erro
        // NÃO travar o app por causa disso
        console.error('❌ Erro ao configurar IOSAppLifecycle (não crítico):', error);
      }
    }, 500); // Delay de 500ms para permitir que o app carregue primeiro

    return () => {
      clearTimeout(initTimeout);

      // Limpar listeners de forma segura
      listenersRef.current.forEach((listener) => {
        try {
          if (listener && typeof listener.remove === 'function') {
            listener.remove();
          }
        } catch (error) {
          console.error('Erro ao remover listener:', error);
        }
      });
      listenersRef.current = [];
    };
  }, []);

  return null;
}
