import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Cookie } from 'lucide-react';
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
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Card className="p-4 shadow-lg bg-white/95 backdrop-blur-sm border-gray-200">
        <div className="flex items-start space-x-3">
          <Cookie className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-gray-900 mb-1">
              Cookies e Privacidade
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Usamos cookies para melhorar sua experiência, analisar o tráfego do site e personalizar conteúdo. 
              Ao clicar em "Aceitar todos", você concorda com o uso de todos os cookies.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleAcceptAll}
                size="sm"
                className="text-xs"
              >
                Aceitar todos
              </Button>
              <Button
                onClick={handleAcceptNecessary}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Apenas necessários
              </Button>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
};