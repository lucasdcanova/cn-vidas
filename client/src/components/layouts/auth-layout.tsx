import React, { useEffect } from "react";
import { useLocation, Link } from "wouter";
import cnvidasLogo from "@/assets/cnvidas-logo-transparent.png";
import { useIOSKeyboard } from "@/hooks/use-ios-keyboard";
import { configureIOSStatusBar } from "@/utils/ios-config";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { keyboardHeight, isKeyboardVisible } = useIOSKeyboard();
  
  // Configurar status bar do iOS
  useEffect(() => {
    configureIOSStatusBar('#eff6ff');
  }, []);
  
  return (
    <div className="fixed inset-0 bg-blue-50 overflow-hidden">
      <div className="absolute inset-0 bg-blue-50" />
      <div className="min-h-screen flex flex-col relative safe-area-inset-top">
        {/* Spacer para empurrar conteúdo para baixo quando teclado não está ativo */}
        {!isKeyboardVisible && <div className="flex-1" style={{ minHeight: '10vh' }} />}
        
        {/* Header com logo - ajusta tamanho e posição com animação */}
        <div 
          className={`flex items-center justify-center transition-all ease-out ${
            isKeyboardVisible ? 'h-12 duration-150' : 'h-20 duration-200'
          }`}
          style={{ 
            marginTop: isKeyboardVisible ? '10px' : '20px',
            willChange: 'height',
            opacity: isKeyboardVisible ? 0.7 : 1
          }}
        >
          <img 
            src={cnvidasLogo} 
            alt="CN Vidas" 
            className={`w-auto transition-all ease-out ${
              isKeyboardVisible ? 'h-10 duration-150' : 'h-16 duration-200'
            }`}
            style={{ willChange: 'height' }}
          />
        </div>
        
        {/* Container principal com altura dinâmica */}
        <div 
          className="glass-morphism rounded-t-3xl overflow-hidden flex flex-col relative z-10 transition-all ease-out mt-6"
          style={{ 
            height: isKeyboardVisible 
              ? `calc(100vh - ${keyboardHeight}px - 120px)` 
              : '60vh',
            marginBottom: '0',
            transform: isKeyboardVisible ? `translateY(-${Math.min(keyboardHeight * 0.25, 80)}px)` : 'translateY(0)',
            transitionDuration: isKeyboardVisible ? '150ms' : '200ms',
            willChange: 'height, transform'
          }}
        >
        {/* Background gradient blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400 opacity-10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-green-400 opacity-10 rounded-full filter blur-3xl"></div>
        
        <div className={`flex-1 flex flex-col overflow-y-auto ${
          isKeyboardVisible ? 'pb-4' : ''
        }`}>
          {children}
        </div>
        
        {/* Copyright dentro da caixa - esconde quando teclado está visível */}
        {!isKeyboardVisible && (
          <div className="text-center py-4 text-gray-500 text-xs border-t border-gray-100/30">
            &copy; {new Date().getFullYear()} CN Vidas. Todos os direitos reservados.
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default AuthLayout;