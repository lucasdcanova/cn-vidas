// Registrar o Service Worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registrado com sucesso:', registration);
          
          // Verificar atualizações periodicamente
          setInterval(() => {
            registration.update();
          }, 60000); // A cada minuto
        })
        .catch(error => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    });
  }
}

// Gerenciar prompt de instalação do PWA
let deferredPrompt: any;

export function initPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    // Prevenir o prompt automático
    e.preventDefault();
    // Salvar o evento para usar depois
    deferredPrompt = e;
    
    // Mostrar botão de instalação customizado
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'block';
    }
  });
}

// Função para mostrar o prompt de instalação
export async function showInstallPrompt() {
  if (!deferredPrompt) {
    console.log('Prompt de instalação não disponível');
    return;
  }
  
  // Mostrar o prompt
  deferredPrompt.prompt();
  
  // Aguardar a escolha do usuário
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    console.log('PWA instalado com sucesso');
  } else {
    console.log('Instalação do PWA recusada');
  }
  
  // Limpar o prompt
  deferredPrompt = null;
}

// Verificar se o app já está instalado
export function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// Solicitar permissão para notificações
export async function requestNotificationPermission() {
  if ('Notification' in window && navigator.serviceWorker) {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Permissão para notificações concedida');
      return true;
    } else {
      console.log('Permissão para notificações negada');
      return false;
    }
  }
  return false;
}

// Enviar notificação push
export async function sendNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, {
      badge: '/icon-72x72.png',
      icon: '/icon-192x192.png',
      vibrate: [200, 100, 200],
      ...options
    });
  }
}