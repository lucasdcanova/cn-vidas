import React from "react";
import { useLocation, Link } from "wouter";
import cnvidasLogo from "@/assets/cnvidas-logo-transparent.png";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      {/* Header com logo - movido mais para baixo */}
      <div className="flex justify-center pt-20 pb-8">
        <img 
          src={cnvidasLogo} 
          alt="CN Vidas" 
          className="h-14 w-auto" 
        />
      </div>
      
      {/* Container principal que vai até o bottom */}
      <div className="flex-1 flex flex-col relative">
        {/* Background gradient blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400 opacity-10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-green-400 opacity-10 rounded-full filter blur-3xl"></div>
        
        {/* Caixa de conteúdo que vai até as bordas */}
        <div className="flex-1 glass-morphism rounded-t-3xl overflow-hidden flex flex-col relative z-10">
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          
          {/* Copyright dentro da caixa */}
          <div className="text-center py-6 text-gray-500 text-sm border-t border-gray-100/30">
            &copy; {new Date().getFullYear()} CN Vidas. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
