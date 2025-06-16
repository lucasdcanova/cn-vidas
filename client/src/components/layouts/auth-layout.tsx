import React from "react";
import { useLocation, Link } from "wouter";
import cnvidasLogo from "@/assets/cnvidas-logo-transparent.png";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      {/* Centered form container */}
      <div className="w-full max-w-md p-8 relative">
        {/* Background gradient blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-400 opacity-10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-green-400 opacity-10 rounded-full filter blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <img 
              src={cnvidasLogo} 
              alt="CN Vidas" 
              className="h-16 w-auto" 
            />
          </div>
          
          <div className="glass-morphism rounded-2xl overflow-hidden">
            {children}
          </div>
          
          <div className="text-center mt-8 text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} CN Vidas. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
