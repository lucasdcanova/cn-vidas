import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import PatientDashboard from "@/components/dashboards/patient-dashboard";
import PartnerDashboard from "@/components/dashboards/partner-dashboard";
import AdminDashboard from "@/components/dashboards/admin-dashboard";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getUserSubscription } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { NotificationPermissionModal } from "@/components/NotificationPermissionModal";
import { isNativeApp } from "@/utils/platform";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isFirstLogin, setIsFirstLogin] = useState<boolean | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const queryClient = useQueryClient();
  
  // Invalidar cache da assinatura quando o componente montar
  useEffect(() => {
    if (user?.role === "patient") {
      console.log("🔄 Dashboard montado - invalidando cache de assinatura");
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
    }
    
    // Verificar se deve mostrar modal de notificações
    if (isNativeApp() && user) {
      const skippedTime = localStorage.getItem('notificationPermissionSkipped');
      const hasAsked = localStorage.getItem('notificationPermissionAsked');
      
      // Se nunca perguntou, ou se passou mais de 7 dias desde que pulou
      if (!hasAsked || (skippedTime && Date.now() - parseInt(skippedTime) > 7 * 24 * 60 * 60 * 1000)) {
        setShowNotificationModal(true);
        localStorage.setItem('notificationPermissionAsked', 'true');
      }
    }
  }, []); // Executar apenas na montagem
  
  // Buscar assinatura atual do usuário para verificar se é primeiro login
  const { data: userSubscription, isLoading: subscriptionLoading, isError, refetch } = useQuery({
    queryKey: ["/api/subscription/current"],
    queryFn: getUserSubscription,
    enabled: !!user?.id && user?.role === "patient",
    staleTime: 0, // Sempre considerar os dados como desatualizados
    gcTime: 0, // Não manter cache (anteriormente cacheTime)
    refetchOnMount: "always", // Sempre buscar dados novos ao montar
    refetchOnWindowFocus: true, // Buscar novos dados quando a janela ganhar foco
    retry: 3, // Tentar 3 vezes em caso de erro
    retryDelay: 1000, // Aguardar 1 segundo entre tentativas
  });
  
  // Verificar se é o primeiro login de um paciente e redirecionar para seleção de plano obrigatória
  useEffect(() => {
    // Só processar para pacientes
    if (user?.role !== "patient") {
      setIsFirstLogin(false);
      return;
    }

    // Se está carregando ou teve erro, não fazer nada ainda
    if (subscriptionLoading || isError) {
      return;
    }

    // Verificar se acabou de ativar uma assinatura
    const justActivated = sessionStorage.getItem('subscription-just-activated');
    if (justActivated) {
      console.log("✅ Dashboard - Assinatura recém ativada, permanecendo no dashboard");
      sessionStorage.removeItem('subscription-just-activated');
      setIsFirstLogin(false);
      return;
    }
    
    // Lógica simplificada: só redirecionar se não tem assinatura E o status não é ativo
    if (!userSubscription && user.subscriptionStatus !== 'active') {
      console.log("🆕 Dashboard - Novo usuário sem assinatura, redirecionando para first-subscription");
      console.log("Status do usuário:", user.subscriptionStatus);
      setLocation('/first-subscription');
    } else {
      console.log("✅ Dashboard - Usuário tem assinatura ou status ativo");
      console.log("userSubscription:", userSubscription);
      console.log("user.subscriptionStatus:", user.subscriptionStatus);
      setIsFirstLogin(false);
    }
  }, [user, userSubscription, subscriptionLoading, isError, setLocation]);

  // Choose dashboard based on user role
  const renderDashboard = () => {
    if (!user) return null;
    
    // Redirecionar médicos para sua página específica
    if (user.role === "doctor") {
      setLocation("/doctor-telemedicine");
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Redirecionando...</span>
        </div>
      );
    }
    
    // Mostrar carregamento enquanto verifica o status da assinatura para pacientes
    if (user.role === "patient" && (isFirstLogin === null || subscriptionLoading)) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Verificando assinatura...</span>
        </div>
      );
    }

    switch (user.role) {
      case "admin":
        return <AdminDashboard />;
      case "partner":
        return <PartnerDashboard />;
      case "patient":
      default:
        return <PatientDashboard />;
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      {renderDashboard()}
      <NotificationPermissionModal 
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
