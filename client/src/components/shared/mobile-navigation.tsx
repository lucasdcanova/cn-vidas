import React from "react";
import { Link, useLocation } from "wouter";

interface MobileNavigationProps {
  userRole?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ userRole = "patient" }) => {
  const [location] = useLocation();
  
  const isLinkActive = (path: string) => {
    return location === path;
  };

  const activeClass = "text-primary"; 
  const inactiveClass = "text-gray-500";

  return (
    <div className="md:hidden glass-nav mobile-nav-bottom border-t border-gray-100/40 flex items-center justify-around fixed bottom-0 w-full z-10">
      {userRole !== "doctor" && (
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
          
          <Link href="/doctor/financeiro">
            <div className={`flex flex-col items-center py-3 px-3 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
              isLinkActive("/doctor/financeiro") ? activeClass : inactiveClass
            }`}>
              <span className="material-icons text-lg transition-transform duration-300">payments</span>
              <span className="text-xs mt-1 font-medium">Financeiro</span>
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
          
          <Link href="/subscription">
            <div className={`flex flex-col items-center py-3 px-3 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
              isLinkActive("/subscription") ? activeClass : inactiveClass
            }`}>
              <span className="material-icons text-lg transition-transform duration-300">credit_card</span>
              <span className="text-xs mt-1 font-medium">Planos</span>
            </div>
          </Link>
        </>
      )}
      
      {userRole === "partner" && (
        <Link href="/partner/services">
          <div className={`flex flex-col items-center py-3 px-3 transition-all duration-300 ease-out transform-gpu active:scale-95 ${
            isLinkActive("/partner/services") ? activeClass : inactiveClass
          }`}>
            <span className="material-icons text-lg transition-transform duration-300">medical_services</span>
            <span className="text-xs mt-1 font-medium">Serviços</span>
          </div>
        </Link>
      )}
    </div>
  );
};

export default MobileNavigation;
