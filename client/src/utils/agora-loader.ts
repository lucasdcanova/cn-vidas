/**
 * Utilitário para carregamento lazy do Agora SDK
 * Carrega o SDK apenas quando necessário para videochamadas
 */

let agoraLoadPromise: Promise<void> | null = null;

export const loadAgoraSDK = async (): Promise<void> => {
  // Se já está carregando ou carregado, retorna a promessa existente
  if (agoraLoadPromise) {
    return agoraLoadPromise;
  }
  
  // Se o SDK já está disponível, retorna imediatamente
  if (typeof window !== 'undefined' && (window as any).AgoraRTC) {
    return Promise.resolve();
  }
  
  // Cria nova promessa de carregamento
  agoraLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.18.2.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Agora SDK carregado com sucesso');
      resolve();
    };
    
    script.onerror = () => {
      console.error('Erro ao carregar Agora SDK');
      agoraLoadPromise = null; // Reset para permitir retry
      reject(new Error('Falha ao carregar Agora SDK'));
    };
    
    document.head.appendChild(script);
  });
  
  return agoraLoadPromise;
};

// Hook para verificar se o Agora está carregado
export const useAgoraSDK = () => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    // Verifica se já está carregado
    if (typeof window !== 'undefined' && (window as any).AgoraRTC) {
      setIsLoaded(true);
      return;
    }
  }, []);
  
  const load = React.useCallback(async () => {
    if (isLoaded || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await loadAgoraSDK();
      setIsLoaded(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading]);
  
  return { isLoaded, isLoading, error, load };
};