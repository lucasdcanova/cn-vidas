import React, { useEffect } from "react";
import { useLocation, Link } from "wouter";
import cnvidasLogo from "@/assets/cnvidas-logo-transparent.png";
import { configureIOSStatusBar } from "@/utils/ios-config";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  // Configurar status bar do iOS
  useEffect(() => {
    configureIOSStatusBar('#eff6ff');
  }, []);
  
  return (
    <div className="min-h-screen bg-blue-50" style={{ backgroundColor: '#eff6ff' }}>
      <div className="min-h-screen flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Logo com posição ajustada */}
        <div 
          className="flex items-center justify-center h-20"
          style={{ 
            marginTop: '100px'
          }}
        >
          <img 
            src={cnvidasLogo} 
            alt="CN Vidas" 
            className="w-auto h-16"
          />
        </div>
        
        {/* Spacer menor */}
        <div style={{ height: '40px' }} />
        
        {/* Container principal */}
        <div 
          className="glass-morphism rounded-t-3xl flex flex-col relative z-10 flex-1"
          style={{ 
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
        {/* Background gradient blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400 opacity-10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-green-400 opacity-10 rounded-full filter blur-3xl"></div>
        
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>
        
        {/* Copyright dentro da caixa */}
        <div className="text-center py-4 text-gray-500 text-xs border-t border-gray-100/30">
          &copy; {new Date().getFullYear()} CN Vidas. Todos os direitos reservados.
        </div>
      </div>
    </div>
    </div>
  );
};

export default AuthLayout;