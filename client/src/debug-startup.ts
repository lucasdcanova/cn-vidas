// Debug para problemas de inicialização no iOS
export function debugStartup() {
  console.log('🚀 App iniciando...');
  console.log('📱 Plataforma:', navigator.userAgent);
  console.log('🌐 URL:', window.location.href);
  console.log('📄 Document readyState:', document.readyState);
  
  // Adicionar indicador visual de carregamento
  const debugDiv = document.createElement('div');
  debugDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 9999;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  debugDiv.innerHTML = `
    <h3 style="margin: 0 0 10px 0; color: #333;">CN Vidas</h3>
    <p style="margin: 0; color: #666;">Carregando aplicação...</p>
    <div style="margin-top: 10px;">
      <div style="width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
    </div>
  `;
  
  // Adicionar animação
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(debugDiv);
  
  // Remover após 3 segundos ou quando o app carregar
  setTimeout(() => {
    if (debugDiv.parentNode) {
      debugDiv.remove();
    }
  }, 3000);
  
  // Log de eventos importantes
  window.addEventListener('error', (e) => {
    console.error('❌ Erro global:', e.message, e.filename, e.lineno, e.colno);
    // Mostrar alerta com erro
    alert(`Erro: ${e.message}\nArquivo: ${e.filename}\nLinha: ${e.lineno}`);
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Promise rejeitada:', e.reason);
    alert(`Promise rejeitada: ${e.reason}`);
  });
  
  return debugDiv;
}