import React, { useEffect } from "react";
import { useLocation, Link } from "wouter";
import cnvidasLogo from "@/assets/cnvidas-logo-transparent.png";
import { configureIOSStatusBar } from "@/utils/ios-config";
import { useIOSKeyboard } from "@/hooks/use-ios-keyboard";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { isKeyboardVisible } = useIOSKeyboard();
  
  // Configurar status bar do iOS
  useEffect(() => {
    configureIOSStatusBar('#eff6ff');
  }, []);
  
  return (
    <div className="fixed inset-0 bg-blue-50" style={{ backgroundColor: '#eff6ff' }}>
      <div className="h-full flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Logo com posição fixa */}
        <div 
          className={`flex items-center justify-center shrink-0 transition-all duration-400 ease-out ${
            isKeyboardVisible ? 'h-16' : 'h-20'
          }`}
          style={{ 
            marginTop: isKeyboardVisible ? '20px' : '100px',
            transform: 'translateZ(0)',
            willChange: 'height, margin-top'
          }}
        >
          <img 
            src={cnvidasLogo} 
            alt="CN Vidas" 
            className={`w-auto transition-all duration-400 ease-out ${
              isKeyboardVisible ? 'h-12' : 'h-16'
            }`}
          />
        </div>
        
        {/* Spacer dinâmico */}
        <div className={`transition-all duration-400 ease-out ${
          isKeyboardVisible ? 'h-4' : 'h-10'
        }`} />
        
        {/* Container principal */}
        <div 
          className="rounded-t-3xl flex flex-col relative z-10 flex-1 min-h-0"
          style={{ 
            paddingBottom: 'env(safe-area-inset-bottom)',
            background: isKeyboardVisible ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            transition: 'background 400ms ease-out'
          }}
        >
          {/* Background gradient blobs */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400 opacity-10 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 -right-20 w-80 h-80 bg-green-400 opacity-10 rounded-full filter blur-3xl"></div>
          
          <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
            {children}
          </div>
          
          {/* Copyright */}
          <div className={`text-center py-4 text-gray-500 text-xs border-t border-gray-100/30 shrink-0 transition-opacity duration-300 ${
            isKeyboardVisible ? 'opacity-0' : 'opacity-100'
          }`}>
            &copy; {new Date().getFullYear()} CN Vidas. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;