import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { isIPad, isIPhone } from "@/utils/platform";

interface MobileNavigationProps {
  userRole?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ userRole = "patient" }) => {
  const [location] = useLocation();
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isIPhoneDevice, setIsIPhoneDevice] = useState(false);
  
  useEffect(() => {
    // Detectar se é iPhone ou iPad
    setIsIOSDevice(isIPad() || isIPhone());
    setIsIPhoneDevice(isIPhone());
  }, []);
  
  const isLinkActive = (path: string) => {
    return location === path;
  };

  const activeClass = "text-primary"; 
  const inactiveClass = "text-gray-500";

  // Classes condicionais para iOS (iPhone e iPad)
  const navigationClasses = isIOSDevice
    ? "glass-nav-ios mobile-nav-bottom-ios flex items-center justify-around fixed z-50"
    : "md:hidden glass-nav mobile-nav-bottom border-t border-gray-100/40 flex items-center justify-around fixed bottom-0 w-full z-10";

  return (
    <div className={navigationClasses}>
      {userRole !== "doctor" && userRole !== "partner" && (
        <Link href="/dashboard">
          <div className={`flex flex-col items-center py-3 px-3 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
            isLinkActive("/dashboard") ? activeClass : inactiveClass
          }`}>
            <span className="material-icons text-lg transition-transform duration-300">dashboard</span>
            <span className="text-xs mt-1 font-medium">Dashboard</span>
          </div>
        </Link>
      )}
      
      {userRole === "doctor" && (
        <>
          <Link href="/doctor-telemedicine">
            <div className={`flex flex-col items-center py-3 px-3 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
              isLinkActive("/doctor-telemedicine") ? activeClass : inactiveClass
            }`}>
              <span className="material-icons text-lg transition-transform duration-300">videocam</span>
              <span className="text-xs mt-1 font-medium">Consultas</span>
            </div>
          </Link>
          
          <Link href="/doctor-availability">
            <div className={`flex flex-col items-center py-3 px-3 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
              isLinkActive("/doctor-availability") ? activeClass : inactiveClass
            }`}>
              <span className="material-icons text-lg transition-transform duration-300">calendar_month</span>
              <span className="text-xs mt-1 font-medium">Agenda</span>
            </div>
          </Link>
          
          <Link href="/doctor/consultation-history">
            <div className={`flex flex-col items-center py-3 px-3 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
              isLinkActive("/doctor/consultation-history") ? activeClass : inactiveClass
            }`}>
              <span className="material-icons text-lg transition-transform duration-300">history</span>
              <span className="text-xs mt-1 font-medium">Histórico</span>
            </div>
          </Link>
          
          <Link href="/doctor/medical-records">
            <div className={`flex flex-col items-center py-3 px-3 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
              isLinkActive("/doctor/medical-records") ? activeClass : inactiveClass
            }`}>
              <span className="material-icons text-lg transition-transform duration-300">folder_open</span>
              <span className="text-xs mt-1 font-medium">Prontuário</span>
            </div>
          </Link>
        </>
      )}
      
      {userRole === "patient" && (
        <Link href="/telemedicine">
          <div className={`flex flex-col items-center py-3 px-3 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
            isLinkActive("/telemedicine") ? activeClass : inactiveClass
          }`}>
            <span className="material-icons text-lg transition-transform duration-300">videocam</span>
            <span className="text-xs mt-1 font-medium">Consultas</span>
          </div>
        </Link>
      )}
      
      {userRole === "patient" && (
        <>
          <Link href="/services">
            <div className={`flex flex-col items-center py-3 px-3 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
              isLinkActive("/services") ? activeClass : inactiveClass
            }`}>
              <span className="material-icons text-lg transition-transform duration-300">medical_services</span>
              <span className="text-xs mt-1 font-medium">Serviços</span>
            </div>
          </Link>
          
          <Link href="/claims">
            <div className={`flex flex-col items-center py-3 px-3 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
              isLinkActive("/claims") ? activeClass : inactiveClass
            }`}>
              <span className="material-icons text-lg transition-transform duration-300">description</span>
              <span className="text-xs mt-1 font-medium">Sinistros</span>
            </div>
          </Link>
          
          {/* Mostrar botão de Planos apenas se NÃO for iPhone */}
          {!isIPhoneDevice && (
            <Link href="/subscription">
              <div className={`flex flex-col items-center py-3 px-3 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
                isLinkActive("/subscription") ? activeClass : inactiveClass
              }`}>
                <span className="material-icons text-lg transition-transform duration-300">credit_card</span>
                <span className="text-xs mt-1 font-medium">Planos</span>
              </div>
            </Link>
          )}
        </>
      )}
      
      {userRole === "partner" && (
        <>
          <Link href="/partner/dashboard">
            <div className={`flex flex-col items-center py-3 px-2 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
              isLinkActive("/partner/dashboard") ? activeClass : inactiveClass
            }`}>
              <span className="material-icons text-lg transition-transform duration-300">dashboard</span>
              <span className="text-xs mt-1 font-medium">Dashboard</span>
            </div>
          </Link>

          <Link href="/partner/services">
            <div className={`flex flex-col items-center py-3 px-2 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
              isLinkActive("/partner/services") ? activeClass : inactiveClass
            }`}>
              <span className="material-icons text-lg transition-transform duration-300">medical_services</span>
              <span className="text-xs mt-1 font-medium">Serviços</span>
            </div>
          </Link>
          
          <Link href="/partner/addresses">
            <div className={`flex flex-col items-center py-3 px-2 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
              isLinkActive("/partner/addresses") ? activeClass : inactiveClass
            }`}>
              <span className="material-icons text-lg transition-transform duration-300">location_on</span>
              <span className="text-xs mt-1 font-medium">Endereços</span>
            </div>
          </Link>
          
          <Link href="/partner/verification">
            <div className={`flex flex-col items-center py-3 px-2 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
              isLinkActive("/partner/verification") ? activeClass : inactiveClass
            }`}>
              <span className="material-icons text-lg transition-transform duration-300">qr_code</span>
              <span className="text-xs mt-1 font-medium">Verificar</span>
            </div>
          </Link>
        </>
      )}
    </div>
  );
};

export default MobileNavigation;
