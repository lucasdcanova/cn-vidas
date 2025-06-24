import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { showInstallPrompt, isPWAInstalled } from '../pwa';
import { Button } from './ui/button';

export function InstallPWA() {
  const [showButton, setShowButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    setIsInstalled(isPWAInstalled());

    // Escutar o evento de instalação
    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    await showInstallPrompt();
    setShowButton(false);
  };

  // Não mostrar se já estiver instalado ou não houver prompt disponível
  if (isInstalled || !showButton) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in-up">
      <Button
        id="pwa-install-button"
        onClick={handleInstallClick}
        className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg"
      >
        <Download className="w-4 h-4 mr-2" />
        Instalar App
      </Button>
    </div>
  );
}