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
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f5f7fa 0%, #e8f2f7 100%);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
  `;
  debugDiv.innerHTML = `
    <div style="text-align: center;">
      <div class="logo-container" style="position: relative; margin: 0 auto 20px;">
        <img src="/assets/cnvidas-logo-transparent.png" alt="CNVidas" style="width: 120px; height: auto; animation: pulse 2s ease-in-out infinite;">
        <div class="logo-glow" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140px; height: 140px; background: radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, transparent 70%); animation: glowPulse 2s ease-in-out infinite; border-radius: 50%; pointer-events: none;"></div>
      </div>
      <div class="loading-text" style="margin-bottom: 30px;">
        <h3 style="margin: 0; font-size: 24px; font-weight: 300; color: #1a202c; letter-spacing: 2px; animation: fadeInOut 3s ease-in-out infinite;">CNVidas</h3>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b; animation: slideUp 1s ease-out;">Preparando sua experiência...</p>
      </div>
      <div class="loading-indicator" style="position: relative; width: 60px; height: 4px; background: #e2e8f0; border-radius: 2px; margin: 0 auto; overflow: hidden;">
        <div class="loading-bar" style="position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, #14b8a6 0%, #0ea5e9 50%, #14b8a6 100%); animation: slideProgress 2s ease-in-out infinite;"></div>
      </div>
      <div class="loading-dots" style="margin-top: 20px;">
        <span style="display: inline-block; width: 8px; height: 8px; margin: 0 3px; background: #14b8a6; border-radius: 50%; animation: bounce 1.4s ease-in-out infinite both; animation-delay: -0.32s;"></span>
        <span style="display: inline-block; width: 8px; height: 8px; margin: 0 3px; background: #14b8a6; border-radius: 50%; animation: bounce 1.4s ease-in-out infinite both; animation-delay: -0.16s;"></span>
        <span style="display: inline-block; width: 8px; height: 8px; margin: 0 3px; background: #14b8a6; border-radius: 50%; animation: bounce 1.4s ease-in-out infinite both;"></span>
      </div>
    </div>
  `;
  
  // Adicionar animação
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.9;
      }
    }
    
    @keyframes glowPulse {
      0%, 100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0.5;
      }
      50% {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 0.8;
      }
    }
    
    @keyframes fadeInOut {
      0%, 100% {
        opacity: 0.5;
      }
      50% {
        opacity: 1;
      }
    }
    
    @keyframes slideUp {
      0% {
        transform: translateY(10px);
        opacity: 0;
      }
      100% {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @keyframes slideProgress {
      0% {
        left: -100%;
      }
      50% {
        left: 100%;
      }
      100% {
        left: 100%;
      }
    }
    
    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    @media (max-width: 640px) {
      .logo-container img {
        width: 100px !important;
      }
      .loading-text h3 {
        font-size: 20px !important;
      }
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
    // Ignorar erro do ResizeObserver que é um falso positivo comum em aplicações React
    if (e.message && e.message.includes('ResizeObserver loop')) {
      e.preventDefault();
      return;
    }
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