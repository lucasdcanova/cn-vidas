import React, { useEffect } from "react";
import { useLocation, Link } from "wouter";
import cnvidasLogo from "@/assets/cnvidas-logo-transparent.png";
import { configureIOSStatusBar } from "@/utils/ios-config";
import { useIOSKeyboard } from "@/hooks/use-ios-keyboard";

interface AuthLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export const AuthLayout = ({ children, activeTab = "login" }: AuthLayoutProps) => {
  const { isKeyboardVisible } = useIOSKeyboard();
  
  // Configurar status bar do iOS
  useEffect(() => {
    configureIOSStatusBar('#eff6ff');
  }, []);
  
  // Determinar o estado do layout baseado em activeTab e isKeyboardVisible
  const getLayoutState = () => {
    if (activeTab === "register" && isKeyboardVisible) {
      return "register-keyboard"; // Caixa rente ao status bar, logo oculto
    } else if (activeTab === "login" && !isKeyboardVisible) {
      return "login-no-keyboard"; // Logo maior, caixa mais baixa
    } else if (activeTab === "login" && isKeyboardVisible) {
      return "login-keyboard"; // Estado atual: logo menor
    } else {
      return "register-no-keyboard"; // Estado atual
    }
  };

  const layoutState = getLayoutState();

  // Configurações para cada estado
  const getLogoConfig = () => {
    switch (layoutState) {
      case "register-keyboard":
        return { height: 'h-0', marginTop: '0px', logoSize: 'h-0', opacity: 'opacity-0' };
      case "login-no-keyboard":
        return { height: 'h-32', marginTop: '100px', logoSize: 'h-24', opacity: 'opacity-100' }; // Aumentado de 60px para 100px
      case "login-keyboard":
        return { height: 'h-16', marginTop: '20px', logoSize: 'h-12', opacity: 'opacity-100' };
      default: // register-no-keyboard
        return { height: 'h-20', marginTop: '100px', logoSize: 'h-16', opacity: 'opacity-100' };
    }
  };

  const getSpacerHeight = () => {
    switch (layoutState) {
      case "register-keyboard":
        return 'h-0';
      case "login-no-keyboard":
        return 'h-20'; // Aumentado de h-16 para h-20 para descer mais a caixa
      case "login-keyboard":
        return 'h-4';
      default: // register-no-keyboard
        return 'h-10';
    }
  };

  const logoConfig = getLogoConfig();
  const spacerHeight = getSpacerHeight();

  return (
    <div className="fixed inset-0 bg-blue-50" style={{ backgroundColor: '#eff6ff' }}>
      <div className="h-full flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Logo com posição fixa */}
        <div 
          className={`flex items-center justify-center shrink-0 transition-all duration-400 ease-out ${logoConfig.height} ${logoConfig.opacity}`}
          style={{ 
            marginTop: logoConfig.marginTop,
            transform: 'translateZ(0)',
            willChange: 'height, margin-top, opacity'
          }}
        >
          <img 
            src={cnvidasLogo} 
            alt="CN Vidas" 
            className={`w-auto transition-all duration-400 ease-out ${logoConfig.logoSize}`}
            style={{
              filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.25)) drop-shadow(0 6px 15px rgba(0, 0, 0, 0.15)) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))'
            }}
          />
        </div>
        
        {/* Spacer dinâmico */}
        <div className={`transition-all duration-400 ease-out ${spacerHeight}`} />
        
        {/* Container principal */}
        <div 
          className={`flex flex-col relative z-10 flex-1 min-h-0 ${
            layoutState === 'register-keyboard' ? '' : 'rounded-t-3xl'
          }`}
          style={{ 
            paddingBottom: isKeyboardVisible ? '0' : 'env(safe-area-inset-bottom)',
            background: isKeyboardVisible ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: layoutState === 'register-keyboard' 
              ? 'none' 
              : '0 -10px 40px rgba(0, 0, 0, 0.08), 0 -4px 20px rgba(0, 0, 0, 0.04)',
            border: layoutState === 'register-keyboard' 
              ? 'none' 
              : '1px solid rgba(255, 255, 255, 0.18)',
            transition: 'all 400ms ease-out',
            marginTop: layoutState === 'register-keyboard' ? '20px' : '0' // Mudado de -20px para 20px para baixar da status bar
          }}
        >
          {/* Background gradient blobs */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400 opacity-10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 -right-20 w-80 h-80 bg-green-400 opacity-10 rounded-full filter blur-3xl"></div>
          
          <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
            {children}
          </div>
          
          {/* Copyright */}
          {!isKeyboardVisible && layoutState !== 'register-keyboard' && (
            <div className="text-center py-8 text-gray-500 text-xs border-t border-gray-100/30 shrink-0">
              &copy; {new Date().getFullYear()} CN Vidas. Todos os direitos reservados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;