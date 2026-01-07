import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { metaPixel } from '@/services/meta-pixel';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar se já existe consentimento salvo
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Mostrar banner após 2 segundos se não houver consentimento
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('cookieConsent', JSON.stringify(consentData));
    metaPixel.setMarketingConsent(true);
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    const consentData = {
      necessary: true,
      functional: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('cookieConsent', JSON.stringify(consentData));
    metaPixel.setMarketingConsent(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-500"
      style={{ maxWidth: '380px' }}
    >
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-200 flex-1">
            Usamos cookies para melhorar sua experiência.{' '}
            <button
              onClick={handleAcceptAll}
              className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors"
            >
              Aceitar
            </button>
            {' '}ou{' '}
            <button
              onClick={handleAcceptNecessary}
              className="text-gray-400 hover:text-gray-300 underline transition-colors"
            >
              recusar
            </button>
          </p>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};