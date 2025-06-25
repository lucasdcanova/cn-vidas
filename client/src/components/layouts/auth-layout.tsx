import React from "react";
import { useLocation, Link } from "wouter";
import { useIOSKeyboard } from "@/hooks/use-ios-keyboard";
import cnvidasLogo from "@/assets/cnvidas-logo-transparent.png";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { isKeyboardVisible, keyboardHeight } = useIOSKeyboard();

  return (
    <div className="min-h-screen flex flex-col bg-blue-50" style={{ backgroundColor: '#eff6ff' }}>
      {/* Header com logo - ajustado para ficar mais próximo do box de login */}
      <div className={`flex items-center justify-center transition-all duration-300 ease-in-out ${
        isKeyboardVisible ? 'h-16 py-2' : 'h-32 py-8'
      }`}>
        <img 
          src={cnvidasLogo} 
          alt="CN Vidas" 
          className={`transition-all duration-300 ease-in-out ${
            isKeyboardVisible ? 'h-12' : 'h-24'
          } w-auto`}
        />
      </div>
      
      {/* Container principal com animação para subir quando o teclado aparece */}
      <div 
        className="glass-morphism rounded-t-3xl overflow-hidden flex flex-col relative z-10 transition-all duration-300 ease-in-out" 
        style={{ 
          height: isKeyboardVisible ? `calc(100vh - ${keyboardHeight}px - 64px - env(safe-area-inset-top))` : 'calc(100vh - 128px - env(safe-area-inset-top))',
          marginBottom: isKeyboardVisible ? `${keyboardHeight}px` : 0
        }}
      >
        {/* Background gradient blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400 opacity-10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-green-400 opacity-10 rounded-full filter blur-3xl"></div>
        
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        
        {/* Copyright dentro da caixa */}
        <div className="text-center py-4 text-gray-500 text-xs border-t border-gray-100/30">
          &copy; {new Date().getFullYear()} CN Vidas. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
