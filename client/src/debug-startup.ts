// Debug para problemas de inicialização no iOS
// VERSÃO SIMPLIFICADA SEM OVERLAY PARA EVITAR CONFLITOS COM TELA DE LOADING DO REACT

export function debugStartup() {
  console.log('🚀 App iniciando...');
  console.log('📱 Plataforma:', navigator.userAgent);
  console.log('🌐 URL:', window.location.href);
  console.log('📄 Document readyState:', document.readyState);

  // Listeners de erro apenas
  window.addEventListener('error', (e) => {
    // Ignorar erro do ResizeObserver que é um falso positivo comum em aplicações React
    if (e.message && e.message.includes('ResizeObserver loop')) {
      e.preventDefault();
      return;
    }
    console.error('❌ Erro global:', e.message);
  });

  window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Promise rejeitada:', e.reason);
  });

  // Retornar null pois não criamos elementos visuais
  return null;
}