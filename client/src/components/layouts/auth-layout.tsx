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
    <div className="fixed inset-0 bg-blue-50 overflow-hidden" style={{ backgroundColor: '#eff6ff' }}>
      <div className="h-full relative">
        {/* Logo permanece fixa no fundo */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ 
            paddingTop: 'calc(env(safe-area-inset-top) + 60px)'
          }}
        >
          <img 
            src={cnvidasLogo} 
            alt="CN Vidas" 
            className={`w-auto transition-all duration-500 ease-out ${
              isKeyboardVisible ? 'h-20 opacity-60' : 'h-16 opacity-100'
            }`}
            style={{
              transform: isKeyboardVisible ? 'translateY(-60px)' : 'translateY(0)',
              filter: isKeyboardVisible ? 'blur(2px)' : 'blur(0)'
            }}
          />
        </div>
        
        {/* Container principal com animação */}
        <div 
          className={`absolute left-0 right-0 flex flex-col transition-all ease-out`}
          style={{ 
            paddingTop: isKeyboardVisible ? 'env(safe-area-inset-top)' : 'calc(env(safe-area-inset-top) + 160px)',
            top: isKeyboardVisible ? '0' : 'auto',
            bottom: isKeyboardVisible ? 'auto' : '0',
            height: isKeyboardVisible ? '100%' : 'auto',
            transitionDuration: '400ms',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transform: 'translateZ(0)', // Force hardware acceleration
            willChange: 'transform, padding-top',
          }}
        >
          <div 
            className="flex-1 rounded-t-3xl relative overflow-hidden"
            style={{ 
              paddingBottom: 'env(safe-area-inset-bottom)',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.18)'
            }}
          >
            {/* Background gradient blobs com mais blur */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400 opacity-10 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-20 -right-20 w-80 h-80 bg-green-400 opacity-10 rounded-full filter blur-3xl"></div>
            
            <div className="flex-1 flex flex-col overflow-y-auto relative z-10">
              {children}
            </div>
            
            {/* Copyright com transição suave */}
            <div className={`text-center py-4 text-gray-500 text-xs border-t border-gray-100/30 transition-opacity duration-300 ${
              isKeyboardVisible ? 'opacity-0' : 'opacity-100'
            }`}>
              &copy; {new Date().getFullYear()} CN Vidas. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;