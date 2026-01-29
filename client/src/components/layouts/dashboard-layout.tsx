import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useFreshUserData } from "@/hooks/use-fresh-user-data";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, Home, FileText, Users, Calendar, Stethoscope, Building2, Settings, CreditCard, Bell, User, Shield, Activity, Heart, Phone, MessageSquare, Briefcase, BarChart3, UserCheck, ClipboardList, DollarSign, MapPin, Clock, Star, HelpCircle, ChevronDown, ChevronRight, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/components/shared/user-profile";
import { PlanIndicator } from "@/components/shared/plan-indicator";
import { cn } from "@/lib/utils";
// Logo quadrado branco HCSR para header/sidebar teal
const hcsrLogoSquare = "/assets/hcsr-logo-white.png";
import SidebarNavigation from "@/components/shared/sidebar-navigation";
import MobileNavigation from "@/components/shared/mobile-navigation";
import { useQuery } from "@tanstack/react-query";
import { getUnreadNotificationsCount, markAllNotificationsAsRead, getDoctorByUserId } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { getPlanColor } from "@/components/shared/plan-indicator";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { isNativeApp, isIPad, isIOS, isIPhone } from "@/utils/platform";

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
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [userWithProfileImage, setUserWithProfileImage] = useState(user);
  const [isIPadDevice, setIsIPadDevice] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isIPhoneDevice, setIsIPhoneDevice] = useState(false);
  const [recentlyActivated, setRecentlyActivated] = useState(() => {
    return sessionStorage.getItem('subscription-just-activated') === 'true';
  });

  // Verificar origem do login (HSJ ou padrão)
  const loginSource = localStorage.getItem('loginSource');
  const isHSJLogin = loginSource === 'hsj';
  const hsjLogoPath = '/cropped-icone_sao_jose-removebg-preview.png';
  // Usar logo quadrado branco HCSR para o header teal
  const logoToUse = isHSJLogin ? hsjLogoPath : hcsrLogoSquare;

  // Debug location changes
  useEffect(() => {
    console.log("Current location:", location);
  }, [location]);

  useEffect(() => {
    if (!user) return;

    // Se acabou de ativar assinatura, manter no dashboard
    if (recentlyActivated) {
      if (user.birthDate && user.cpf) {
        // Dados completos, pode remover a flag
        sessionStorage.removeItem('subscription-just-activated');
        setRecentlyActivated(false);
      }
      // Não fazer mais nada enquanto a flag estiver ativa
      return;
    }

    // Verificar se precisa de dados pessoais (apenas para pacientes)
    const needsPersonalData =
      user.role === 'patient' &&
      (
        !user.birthDate ||
        user.birthDate === '' ||
        !user.cpf ||
        user.cpf.trim() === ''
      );

    // Se não precisa de dados pessoais, não fazer nada
    if (!needsPersonalData) {
      return;
    }

    // CORREÇÃO: Apenas exibir aviso uma única vez por sessão, sem redirecionar
    // O redirecionamento automático estava causando loops infinitos
    const alreadyWarned = sessionStorage.getItem('warned-personal-data');
    if (!alreadyWarned) {
      sessionStorage.setItem('warned-personal-data', 'true');
      toast({
        title: 'Complete seus dados',
        description: 'Acesse Configurações para informar CPF e data de nascimento.',
        duration: 10000,
      });
    }
  }, [user, toast, recentlyActivated]);

  // Use o hook para garantir dados frescos do usuário ao montar o componente
  useFreshUserData();

  // Detectar se é iOS (iPhone ou iPad)
  useEffect(() => {
    setIsIPadDevice(isIPad());
    setIsIOSDevice(isIOS());
    setIsIPhoneDevice(isIPhone());
  }, []);

  // Configurar status bar para iOS - agora com fundo teal
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Mostrar e configurar status bar para o dashboard
      StatusBar.show();

      if (isIPadDevice) {
        // No iPad, configurar status bar com cor teal para combinar com o header
        StatusBar.setBackgroundColor({ color: '#18c2b3' }); // Teal claro do gradiente
        StatusBar.setStyle({ style: Style.Dark }); // Texto branco
        StatusBar.setOverlaysWebView({ overlay: true }); // Permitir conteúdo sob a status bar
      } else {
        // iPhone e outros - também usa teal
        StatusBar.setBackgroundColor({ color: '#18c2b3' });
        StatusBar.setStyle({ style: Style.Dark }); // Texto branco
        StatusBar.setOverlaysWebView({ overlay: false });
      }
    }

    // Cleanup - voltar para as cores do auth quando sair do dashboard
    return () => {
      if (Capacitor.isNativePlatform()) {
        // Voltar para a cor teal da página de auth
        StatusBar.setBackgroundColor({ color: '#2ad4c3' });
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setOverlaysWebView({ overlay: false });
      }
    };
  }, [isIPadDevice]);

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

  // Buscar o perfil de parceiro se o usuário for um parceiro
  const { data: partnerData, error: partnerError } = useQuery({
    queryKey: ["/api/partners/me"],
    queryFn: async () => {
      try {
        // Primeiro, fazer debug
        const debugResponse = await apiRequest('GET', '/api/partners/debug-me');
        const debugData = await debugResponse.json();
        console.log('🔍 DashboardLayout - Debug data:', debugData);

        // Depois, buscar o parceiro real
        const response = await apiRequest('GET', '/api/partners/me');
        const data = await response.json();
        console.log('🔍 DashboardLayout - Partner data:', data);
        return data;
      } catch (error) {
        console.error('🔍 DashboardLayout - Error fetching partner:', error);
        throw error;
      }
    },
    enabled: !!user?.id && user?.role === "partner",
    staleTime: 0, // Sempre buscar dados frescos
    cacheTime: 0  // Não manter cache
  });

  // Log do erro se houver
  useEffect(() => {
    if (partnerError) {
      console.error('🔍 DashboardLayout - Partner query error:', partnerError);
    }
  }, [partnerError]);

  // Atualizar o objeto do usuário com a imagem de perfil do médico ou parceiro, se disponível
  useEffect(() => {
    if (user) {
      if (user.role === "doctor" && doctorData?.profileImage) {
        console.log('🔍 DashboardLayout - Usando imagem do médico:', doctorData.profileImage);
        setUserWithProfileImage({
          ...user,
          profileImage: doctorData.profileImage
        });
      } else if (user.role === "partner" && partnerData?.profileImage) {
        console.log('🔍 DashboardLayout - Usando imagem do parceiro:', partnerData.profileImage);
        setUserWithProfileImage({
          ...user,
          profileImage: partnerData.profileImage
        });
      } else {
        // Para pacientes e outros tipos de usuário, usar a imagem do próprio user
        console.log('🔍 DashboardLayout - Usando imagem do user:', user.profileImage);
        setUserWithProfileImage(user);
      }
    }
  }, [user, doctorData, partnerData]);

  const { data: notificationsData } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: getUnreadNotificationsCount,
  });

  const unreadCount = notificationsData?.count || 0;

  // Determinar se deve mostrar a sidebar - esconder completamente no iOS
  const shouldShowSidebar = !isIOSDevice;

  return (
    <div className={cn(
      "flex h-screen overflow-hidden bg-blue-50",
      !shouldShowSidebar && "flex-col" // Use flex-col when no sidebar
    )}>{/* Fundo azul claro sólido que corresponde à identidade visual */}

      {/* Overlay when sidebar is open on mobile - não mostrar para pacientes no iOS */}
      {shouldShowSidebar && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar for desktop - ocultar para pacientes no iOS */}
      {shouldShowSidebar && (
        <aside className={`fixed inset-y-0 left-0 z-50 md:relative md:flex md:flex-col md:w-64 glass-sidebar shadow-lg transition-transform transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}>
          <div className="p-5 border-b border-white/20">
            <div className="flex items-center space-x-2">
              {/* Logo quadrado branco HCSR */}
              <img
                src={logoToUse}
                alt={isHSJLogin ? "Hospital São José" : "HCSR"}
                className="h-11 w-auto"
                style={{
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
                  maxWidth: isHSJLogin ? 'auto' : '150px'
                }}
              />


              {/* Close button on mobile */}
              <button
                className="ml-auto md:hidden text-white/80 hover:text-white transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <SidebarNavigation userRole={user?.role} subscriptionPlan={user?.subscriptionPlan} sidebarTeal />

          <div className="mt-auto p-4 border-t border-white/20">
            <UserProfile user={userWithProfileImage} sidebarTeal />
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className={cn(
        "flex flex-col flex-1 overflow-hidden relative z-10",
        !shouldShowSidebar && "w-full" // Ensure full width when no sidebar
      )}>
        {/* Top navbar - teal gradient matching auth page */}
        <header className={cn(
          "sticky top-0 z-10 shadow-lg",
          isIPadDevice ? "header-glassmorphism-ipad" : "header-teal-gradient"
        )}
        style={{
          background: isIPadDevice ? undefined : 'linear-gradient(165deg, #18c2b3 0%, #0d9488 55%, #0b6b64 100%)'
        }}>
          <div className="md:hidden flex items-center justify-between p-4">
            <div className="flex items-center">
              {/* Mostrar botão de menu apenas quando houver sidebar */}
              {shouldShowSidebar && (
                <button
                  type="button"
                  className="text-white/90 hover:text-white focus:outline-none transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <div className={shouldShowSidebar ? "ml-3 flex items-center space-x-2" : "flex items-center space-x-2"}>
                <img
                  src={logoToUse}
                  alt={isHSJLogin ? "Hospital São José" : "HCSR"}
                  className="h-9 w-auto"
                  style={{
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
                    maxWidth: isHSJLogin ? 'auto' : '120px'
                  }}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Link para Financeiro - apenas para médicos */}
              {user?.role === "doctor" && (
                <>
                  <Link href="/doctor/financeiro">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full hover:bg-white/20 hover:scale-110 transition-transform duration-150 ease-out h-9 w-9",
                        location === "/doctor/financeiro" && "bg-white/20"
                      )}
                      title="Financeiro"
                    >
                      <DollarSign className="h-5 w-5 text-white" />
                    </Button>
                  </Link>
                  <Link href="/doctor/settings">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full hover:bg-white/20 hover:scale-110 transition-transform duration-150 ease-out h-9 w-9",
                        location === "/doctor/settings" && "bg-white/20"
                      )}
                      title="Configurações"
                    >
                      <Settings className="h-5 w-5 text-white" />
                    </Button>
                  </Link>
                  <div className="w-px h-6 bg-white/30 mx-1"></div>
                </>
              )}

              {/* Ícones de navegação conforme o tipo de usuário */}
              {/* Endereços - apenas para parceiros */}
              {user?.role === "partner" && (
                <Link href="/partner/addresses">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "rounded-full hover:bg-white/20 hover:scale-110 transition-transform duration-150 ease-out h-9 w-9",
                      location === "/partner/addresses" ? "bg-white/20" : ""
                    )}
                    title="Endereços"
                  >
                    <MapPin className="h-5 w-5 text-white" />
                  </Button>
                </Link>
              )}

              {/* Configurações - para todos os usuários */}
              <Link href={user?.role === "doctor" ? "/doctor/settings" : "/settings"}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-full hover:bg-white/20 hover:scale-110 transition-transform duration-150 ease-out h-9 w-9",
                    location === "/settings" || location === "/doctor/settings" ? "bg-white/20" : ""
                  )}
                  title="Configurações"
                >
                  <Settings className="h-5 w-5 text-white" />
                </Button>
              </Link>

              {/* Ícones adicionais apenas para pacientes */}
              {user?.role === "patient" && (
                <>
                  {/* Botão de Planos - apenas no iPhone */}
                  {isIPhoneDevice && (
                    <Link href="/subscription">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "rounded-full hover:bg-white/20 hover:scale-110 transition-transform duration-150 ease-out h-9 w-9",
                          location === "/subscription" ? "bg-white/20" : ""
                        )}
                        title="Planos"
                      >
                        <CreditCard className="h-5 w-5 text-white" />
                      </Button>
                    </Link>
                  )}
                  <Link href="/help">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full hover:bg-white/20 hover:scale-110 transition-transform duration-150 ease-out h-9 w-9",
                        location === "/help" ? "bg-white/20" : ""
                      )}
                      title="Fale Conosco"
                    >
                      <HelpCircle className="h-5 w-5 text-white" />
                    </Button>
                  </Link>
                  <div className="w-px h-6 bg-white/30 mx-1"></div>
                </>
              )}
              <UserProfile user={userWithProfileImage} compact headerTeal />
            </div>
          </div>

          <div className="hidden md:flex items-center justify-between px-6 py-4">
            <div className="flex-1 flex items-center gap-4">
              {/* Logo quadrado HCSR para desktop/iPad */}
              <img
                src={logoToUse}
                alt={isHSJLogin ? "Hospital São José" : "HCSR"}
                className="h-10 w-auto"
                style={{
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))',
                  maxWidth: isHSJLogin ? 'auto' : '140px'
                }}
              />
              <h1 className="text-2xl font-semibold text-white drop-shadow-sm">{title}</h1>
            </div>
            <div className="flex items-center ml-4 space-x-3">
              {/* Link para Financeiro - apenas para médicos */}
              {user?.role === "doctor" && (
                <Link href="/doctor/financeiro">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-white/20 hover:scale-105 transition-transform duration-150 ease-out"
                    title="Financeiro"
                  >
                    <DollarSign className="h-5 w-5 text-white" />
                  </Button>
                </Link>
              )}

              {/* Link para Endereços - apenas para parceiros */}
              {user?.role === "partner" && (
                <Link href="/partner/addresses">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-white/20 hover:scale-105 transition-transform duration-150 ease-out"
                    title="Endereços"
                  >
                    <MapPin className="h-5 w-5 text-white" />
                  </Button>
                </Link>
              )}

              {/* Link para Configurações */}
              <Link href={user?.role === "doctor" ? "/doctor/settings" : "/settings"}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-white/20 hover:scale-105 transition-all duration-300 ease-out"
                >
                  <Settings className="h-5 w-5 text-white" />
                </Button>
              </Link>

              {/* Link para Ajuda - apenas para pacientes */}
              {user?.role === "patient" && (
                <Link href="/help">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-white/20 hover:scale-105 transition-transform duration-150 ease-out"
                  >
                    <HelpCircle className="h-5 w-5 text-white" />
                  </Button>
                </Link>
              )}

              {/* Foto do perfil com separador */}
              <div className="flex items-center">
                <div className="h-8 w-px bg-white/30 mr-4"></div>
                <UserProfile user={userWithProfileImage} compact headerTeal />
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
