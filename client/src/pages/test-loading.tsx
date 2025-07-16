import React, { useEffect } from 'react';

const TestLoading: React.FC = () => {
  useEffect(() => {
    // Criar o elemento de loading
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
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
    
    loadingDiv.innerHTML = `
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
              stroke-width="3"
            />
            <circle
              cx="60"
              cy="60"
              r="55"
              fill="none"
              stroke="#3b82f6"
              stroke-width="3"
              stroke-dasharray="345.575"
              stroke-dashoffset="345.575"
              style="animation: circleProgress 2s ease-in-out infinite;"
            />
          </svg>
          
          <!-- Logo no centro -->
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80px; height: 80px;">
            <img 
              src="/assets/cnvidas-logo-transparent.png" 
              alt="CNVidas" 
              style="width: 100%; height: 100%; object-fit: contain;"
              onerror="this.src='/assets/logo.png'"
            />
          </div>
        </div>
        
        <div class="loading-text" style="margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 24px; font-weight: 400; color: #1a202c;">CNVidas</h3>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">Carregando...</p>
        </div>
      </div>
    `;
    
    // Adicionar estilos de animação
    const style = document.createElement('style');
    style.textContent = `
      @keyframes circleProgress {
        0% {
          stroke-dashoffset: 345.575;
        }
        50% {
          stroke-dashoffset: 86.394;
        }
        100% {
          stroke-dashoffset: 345.575;
        }
      }
      
      @media (max-width: 640px) {
        .logo-container {
          transform: scale(0.9);
        }
      }
    `;
    document.head.appendChild(style);
    
    // Adicionar ao body
    document.body.appendChild(loadingDiv);
    
    // Cleanup ao desmontar (não remover para manter em loop eterno)
    return () => {
      // Comentado para manter o loading em loop eterno
      // if (loadingDiv.parentNode) {
      //   loadingDiv.remove();
      // }
      // if (style.parentNode) {
      //   style.remove();
      // }
    };
  }, []);
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Página de Teste - Loading</h1>
      <p>O loading está sendo exibido em tela cheia acima deste conteúdo.</p>
      <p>Use esta página para ajustar o design do loading.</p>
    </div>
  );
};

export default TestLoading;