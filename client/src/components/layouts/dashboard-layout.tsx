import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useFreshUserData } from "@/hooks/use-fresh-user-data";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, Home, FileText, Users, Calendar, Stethoscope, Building2, Settings, CreditCard, Bell, User, Shield, Activity, Heart, Phone, MessageSquare, Briefcase, BarChart3, UserCheck, ClipboardList, DollarSign, MapPin, Clock, Star, HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/components/shared/user-profile";
import { PlanIndicator } from "@/components/shared/plan-indicator";
import { cn } from "@/lib/utils";
import cnvidasLogo from "@/assets/cnvidas-logo-transparent.png";
import SidebarNavigation from "@/components/shared/sidebar-navigation";
import MobileNavigation from "@/components/shared/mobile-navigation";
import { useQuery } from "@tanstack/react-query";
import { getUnreadNotificationsCount, markAllNotificationsAsRead, getDoctorByUserId } from "@/lib/api";
import { getPlanColor } from "@/components/shared/plan-indicator";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { isNativeApp } from "@/utils/platform";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = "Dashboard",
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [userWithProfileImage, setUserWithProfileImage] = useState(user);
  
  // Use o hook para garantir dados frescos do usuário ao montar o componente
  useFreshUserData();
  
  // Configurar status bar para iOS
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Mostrar e configurar status bar para o dashboard
      StatusBar.show();
      StatusBar.setBackgroundColor({ color: '#ffffff' });
      StatusBar.setStyle({ style: Style.Light }); // Texto escuro em fundo claro
      StatusBar.setOverlaysWebView({ overlay: false });
    }
    
    // Cleanup - voltar para as cores originais quando sair do dashboard
    return () => {
      if (Capacitor.isNativePlatform()) {
        // Voltar para a cor azul clara da página de auth
        StatusBar.setBackgroundColor({ color: '#eff6ff' });
        StatusBar.setStyle({ style: Style.Light });
      }
    };
  }, []);

  // Auto-refresh após completar onboarding
  React.useEffect(() => {
    const justCompletedOnboarding = localStorage.getItem('justCompletedOnboarding');
    
    if (justCompletedOnboarding === 'true' && user?.role === 'doctor') {
      // Remove a flag imediatamente para evitar múltiplos refreshes
      localStorage.removeItem('justCompletedOnboarding');
      
      // Mostrar mensagem informativa
      toast({
        title: 'Atualizando informações...',
        description: 'Seus dados estão sendo carregados. A página será atualizada em instantes.',
        duration: 5000,
      });
      
      // Aguardar 5 segundos e recarregar a página
      const timeoutId = setTimeout(() => {
        window.location.reload();
      }, 5000);
      
      // Cleanup do timeout
      return () => clearTimeout(timeoutId);
    }
  }, [toast, user?.role]);
  
  // Debug: Log user data
  React.useEffect(() => {
    console.log("🔍 DashboardLayout - User data:", user);
    console.log("🔍 DashboardLayout - Subscription Plan:", user?.subscriptionPlan);
    console.log("🔍 DashboardLayout - Subscription Status:", user?.subscriptionStatus);
  }, [user]);
  
  // Buscar o perfil de médico se o usuário for um médico
  const { data: doctorData } = useQuery({
    queryKey: ["/api/doctors/user", user?.id],
    queryFn: () => getDoctorByUserId(user?.id || 0),
    enabled: !!user?.id && user?.role === "doctor"
  });
  
  // Atualizar o objeto do usuário com a imagem de perfil do médico, se disponível
  useEffect(() => {
    if (user) {
      if (user.role === "doctor" && doctorData?.profileImage) {
        setUserWithProfileImage({
          ...user,
          profileImage: doctorData.profileImage
        });
      } else {
        // Para pacientes e outros tipos de usuário, usar a imagem do próprio user
        setUserWithProfileImage(user);
      }
    }
  }, [user, doctorData]);
  
  const { data: notificationsData } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: getUnreadNotificationsCount,
  });
  
  const unreadCount = notificationsData?.count || 0;
  
  // Determinar se deve mostrar a sidebar - esconder para pacientes e médicos no iOS
  const shouldShowSidebar = !(isNativeApp() && (user?.role === "patient" || user?.role === "doctor"));

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">{/* Fundo azul claro sólido que corresponde à identidade visual */}

      {/* Overlay when sidebar is open on mobile - não mostrar para pacientes no iOS */}
      {shouldShowSidebar && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar for desktop - ocultar para pacientes no iOS */}
      {shouldShowSidebar && (
        <aside className={`fixed inset-y-0 left-0 z-50 md:relative md:flex md:flex-col md:w-64 glass-sidebar shadow-lg transition-transform transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}>
          <div className="p-5 border-b border-gray-100/50">
            <div className="flex items-center space-x-2">
              {/* Logo */}
              <img 
                src={cnvidasLogo} 
                alt="CN Vidas" 
                className="h-9 w-auto" 
              />
              
              
              {/* Close button on mobile */}
              <button 
                className="ml-auto md:hidden text-gray-500 hover:text-gray-700 transition-colors" 
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <SidebarNavigation userRole={user?.role} subscriptionPlan={user?.subscriptionPlan} />
          
          <div className="mt-auto p-4 border-t border-gray-100/50">
            <UserProfile user={userWithProfileImage} />
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        {/* Top navbar */}
        <header className="bg-white sticky top-0 z-10 shadow-sm border-b border-gray-100">
          <div className="md:hidden flex items-center justify-between p-4">
            <div className="flex items-center">
              {/* Mostrar botão de menu apenas quando houver sidebar */}
              {shouldShowSidebar && (
                <button 
                  type="button" 
                  className="text-gray-600 hover:text-gray-800 focus:outline-none transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <div className={shouldShowSidebar ? "ml-3 flex items-center space-x-2" : "flex items-center space-x-2"}>
                <img 
                  src={cnvidasLogo} 
                  alt="CN Vidas" 
                  className="h-8 w-auto" 
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Link para Financeiro - apenas para médicos */}
              {user?.role === "doctor" && (
                <>
                  <Link to="/doctor/financeiro">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-gray-100 hover:scale-110 transition-all duration-300 ease-out h-9 w-9"
                      title="Financeiro"
                    >
                      <DollarSign className="h-5 w-5 text-gray-600" />
                    </Button>
                  </Link>
                  <Link to="/doctor/settings">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-gray-100 hover:scale-110 transition-all duration-300 ease-out h-9 w-9"
                      title="Configurações"
                    >
                      <Settings className="h-5 w-5 text-gray-600" />
                    </Button>
                  </Link>
                  <div className="w-px h-6 bg-gray-200 mx-1"></div>
                </>
              )}
              
              {/* Ícones de configurações e ajuda apenas para pacientes */}
              {user?.role === "patient" && (
                <>
                  <Link to="/settings">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-gray-100 hover:scale-110 transition-all duration-300 ease-out h-9 w-9"
                    >
                      <Settings className="h-5 w-5 text-gray-600" />
                    </Button>
                  </Link>
                  <Link to="/help">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-gray-100 hover:scale-110 transition-all duration-300 ease-out h-9 w-9"
                    >
                      <HelpCircle className="h-5 w-5 text-gray-600" />
                    </Button>
                  </Link>
                  <div className="w-px h-6 bg-gray-200 mx-1"></div>
                </>
              )}
              <UserProfile user={user} compact />
            </div>
          </div>
          
          <div className="hidden md:flex items-center justify-between px-6 py-4">
            <div className="flex-1 flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
            </div>
            <div className="flex items-center ml-4 space-x-3">
              {/* Link para Financeiro - apenas para médicos */}
              {user?.role === "doctor" && (
                <Link to="/doctor/financeiro">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full glass-card-subtle hover:bg-white/80 hover:scale-105 transition-all duration-300 ease-out"
                    title="Financeiro"
                  >
                    <DollarSign className="h-5 w-5 text-gray-700" />
                  </Button>
                </Link>
              )}
              
              {/* Link para Configurações */}
              <Link to={user?.role === "doctor" ? "/doctor/settings" : "/settings"}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full glass-card-subtle hover:bg-white/80 hover:scale-105 transition-all duration-300 ease-out"
                >
                  <Settings className="h-5 w-5 text-gray-700" />
                </Button>
              </Link>
              
              {/* Link para Ajuda - apenas para pacientes */}
              {user?.role === "patient" && (
                <Link to="/help">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full glass-card-subtle hover:bg-white/80 hover:scale-105 transition-all duration-300 ease-out"
                  >
                    <HelpCircle className="h-5 w-5 text-gray-700" />
                  </Button>
                </Link>
              )}
              
              {/* Foto do perfil com separador */}
              <div className="flex items-center">
                <div className="h-8 w-px bg-gray-200 mr-4"></div>
                <UserProfile user={userWithProfileImage} compact />
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile bottom navigation */}
        <MobileNavigation userRole={user?.role} />
      </div>
    </div>
  );
};

export default DashboardLayout;
