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
      <div class="logo-container" style="position: relative; margin: 0 auto 30px; width: 120px; height: 120px;">
        <!-- Círculo de progresso -->
        <svg style="position: absolute; top: 0; left: 0; width: 120px; height: 120px; transform: rotate(-90deg);">
          <circle
            cx="60"
            cy="60"
            r="55"
            fill="none"
            stroke="#e5e7eb"
            stroke-width="8"
          />
          <!-- Círculo de base sempre visível -->
          <circle
            cx="60"
            cy="60"
            r="55"
            fill="none"
            stroke="#3b82f6"
            stroke-width="8"
            class="base-circle"
          />
          <!-- Círculo animado -->
          <circle
            cx="60"
            cy="60"
            r="55"
            fill="none"
            stroke="#10b981"
            stroke-width="8"
            stroke-dasharray="345.575"
            stroke-dashoffset="345.575"
            style="animation: circleProgress 2s linear infinite;"
          />
        </svg>
        
        <!-- Logo no centro -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80px; height: 80px;">
          <img 
            src="/assets/cnvidas-logo.png" 
            alt="CNVidas" 
            style="width: 100%; height: 100%; object-fit: contain;"
            onerror="this.src='/assets/logo.png'"
          />
        </div>
      </div>
    </div>
  `;
  
  // Adicionar animação
  const style = document.createElement('style');
  style.textContent = `
    @keyframes circleProgress {
      0% {
        stroke-dashoffset: 345.575;
      }
      100% {
        stroke-dashoffset: 0;
      }
    }
    
    .base-circle {
      animation: colorChange 4s linear infinite;
    }
    
    @keyframes colorChange {
      0% {
        stroke: #3b82f6;
      }
      50% {
        stroke: #10b981;
      }
      100% {
        stroke: #3b82f6;
      }
    }
    
    @media (max-width: 640px) {
      .logo-container {
        transform: scale(0.9);
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