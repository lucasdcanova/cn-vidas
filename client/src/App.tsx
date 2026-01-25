CONTINUimport * as React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { PushNotificationService } from "@/services/push-notifications";
import { isNativeApp } from "@/utils/platform";
import { useThemeColor } from "@/hooks/use-theme-color";
import { configureIOSStatusBar } from "@/utils/ios-config";
import { IOSSessionGuard } from "@/components/ios-session-guard";
import { IOSAppLifecycle } from "@/components/ios-app-lifecycle";
import { StatusBarConfig } from "@/utils/statusbar-config";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HSJAuthPage from "@/pages/hsj-auth-page";
import HCCAuthPage from "@/pages/hcc-auth-page";
import Dashboard from "@/pages/dashboard";
import Telemedicine from "@/pages/telemedicine";
import TelemedicinePage from "@/pages/telemedicine-page";

import DailyTelemedicine from "@/pages/daily-telemedicine";
import TelemedicineEmergencyPage from "@/pages/telemedicine-emergency";
import TelemedicineEmergencyV2 from "@/pages/telemedicine-emergency-v2";
import TelemedicineEmergencyV3 from "@/pages/telemedicine-emergency-v3";
import TelemedicineEmergencyRoomV4 from "@/pages/telemedicine-emergency-room-v4";
import UnifiedEmergencyRoom from "@/pages/unified-emergency-room";
import TelemedicineConsultation from "@/pages/telemedicine-consultation";
import EmergencyCallPage from "@/pages/emergency-call";
import Claims from "@/pages/claims";
import NewClaim from "@/pages/claims/new";
import Services from "@/pages/services";
import Profile from "@/pages/profile";
import ProfileV2 from "@/pages/profile-v2";
import Payments from "@/pages/payments";
import Address from "@/pages/address";
import Checkout from "@/pages/checkout";

import Subscription from "@/pages/subscription";
import FirstSubscriptionGuard from "@/components/subscription/first-subscription-guard";
import PaymentSuccess from "@/pages/payment-success";
import SubscriptionSuccess from "@/pages/subscription-success";
import PatientOnboarding from "@/pages/patient-onboarding";
import HelpPage from "@/pages/help";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminPartners from "@/pages/admin/partners";
import AdminClaims from "@/pages/admin/claims";
import AdminServices from "@/pages/admin/services";
import AdminAnalytics from "@/pages/admin/analytics";
import QrAuthLogs from "@/pages/admin/qr-auth-logs";
import AdminSubscriptionPlans from "@/pages/admin/subscription-plans";
import AdminUserDependents from "@/pages/admin/users/dependents";
import SellerStats from "@/pages/admin/seller-stats";
import CheckoutTrackingPage from "@/pages/admin/checkout-tracking";
import DoctorTelemedicine from "@/pages/doctor-telemedicine";
import DoctorOnboarding from "@/pages/doctor-onboarding";
import DoctorAvailability from "@/pages/doctor-availability";
import DoctorEmergencyRoom from "@/pages/doctor-emergency-room";
import PatientEmergencyRoom from "@/pages/patient-emergency-room";
import DoctorDirectEmergency from "@/pages/doctor-direct-emergency";
import DoctorWelcome from "@/pages/doctor/welcome";
import DoctorFinanceiro from "@/pages/doctor/financeiro";
import DoctorConsultationHistory from "@/pages/doctor/consultation-history";
import DoctorSettings from "@/pages/doctor/settings";
import PartnerDashboard from "@/pages/partner-dashboard";
import PartnerOnboarding from "@/pages/partner-onboarding";
import PartnerVerification from "@/pages/partner-verification";
import PartnerServices from "@/pages/partner-services";
import PartnerAddresses from "@/pages/partner/PartnerAddresses";
import PartnerCollaborators from "@/pages/partner/collaborators";
import CorporatePlansPage from "@/pages/partner/corporate-plans";
import CorporateEmployees from "@/pages/partner/corporate-employees";
import CorporateInvitePage from "@/pages/corporate-invite";
import QRCodePage from "@/pages/qr-code";
import { TestQRPage } from "@/pages/test-qr";
import PatientSettings from "@/pages/patient/settings";
import DependentsPage from "@/pages/dependents-page-responsive";
import RecentActivitiesPage from "@/pages/recent-activities";
import VerificarEmail from "@/pages/verificar-email";
import RedefinirSenha from "@/pages/redefinir-senha";
import ReenviarVerificacao from "@/pages/reenviar-verificacao";
import EsqueciSenha from "@/pages/esqueci-senha";
import AdminMedicalRecords from "@/pages/admin/medical-records";
import AdminDoctors from "@/pages/admin/doctors";
import AdminLeads from "@/pages/admin/leads";
import DoctorMedicalRecords from "@/pages/doctor/medical-records";
import DoctorMedicalRecordEdit from "@/pages/doctor/medical-record-edit";
import ProcessingMedicalRecordPage from "@/pages/doctor/processing-medical-record";
import TestHeadlessDaily from "@/pages/test-headless-daily";
import { ProcessingWaitPage } from "@/pages/processing-wait";
import { CampaignTaquari } from "@/pages/CampaignTaquari";
import { CampaignBrasilia } from "@/pages/CampaignBrasilia";
import HospitalBriefing from "@/pages/hospital-briefing";

// Componente de erro boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
          <h1>🚨 Algo deu errado</h1>
          <p>Houve um erro no carregamento da aplicação.</p>
          <p>Por favor, recarregue a página.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/hsj" component={HSJAuthPage} />
      <Route path="/auth/hcc" component={HCCAuthPage} />

      {/* Verificação de Email e Redefinição de Senha - Acessíveis sem autenticação */}
      <Route path="/verificar-email" component={VerificarEmail} />
      <Route path="/redefinir-senha" component={RedefinirSenha} />
      <Route path="/reenviar-verificacao" component={ReenviarVerificacao} />
      <Route path="/esqueci-senha" component={EsqueciSenha} />

      {/* Patient & General Routes */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/telemedicine" component={TelemedicinePage} allowedRoles={["patient"]} />

      <ProtectedRoute path="/daily-telemedicine/:appointmentId" component={DailyTelemedicine} />
      <ProtectedRoute path="/telemedicine-emergency" component={TelemedicineEmergencyPage} allowedRoles={["patient"]} />
      <ProtectedRoute path="/emergency-v2" component={TelemedicineEmergencyV2} allowedRoles={["patient"]} />
      <ProtectedRoute path="/emergency-v3" component={TelemedicineEmergencyV3} allowedRoles={["patient"]} />
      <ProtectedRoute path="/unified-emergency-room" component={UnifiedEmergencyRoom} allowedRoles={["doctor", "patient"]} />
      <ProtectedRoute path="/emergency-room-v4" component={TelemedicineEmergencyRoomV4} allowedRoles={["doctor", "patient"]} />
      <ProtectedRoute path="/emergency-room-v4/:id" component={TelemedicineEmergencyRoomV4} allowedRoles={["doctor", "patient"]} />
      <ProtectedRoute path="/claims" component={Claims} allowedRoles={["patient"]} />
      <ProtectedRoute path="/claims/new" component={NewClaim} allowedRoles={["patient"]} />
      <ProtectedRoute path="/services" component={Services} allowedRoles={["patient"]} />
      <ProtectedRoute path="/profile" component={ProfileV2} />
      <ProtectedRoute path="/payments" component={Payments} allowedRoles={["patient"]} />
      <ProtectedRoute path="/address" component={Address} />
      <ProtectedRoute path="/settings" component={PatientSettings} allowedRoles={["patient"]} />
      <ProtectedRoute path="/dependents" component={DependentsPage} allowedRoles={["patient"]} />
      <ProtectedRoute path="/recent-activities" component={RecentActivitiesPage} allowedRoles={["patient"]} />
      <ProtectedRoute path="/qr-code" component={QRCodePage} allowedRoles={["patient", "partner"]} />
      <ProtectedRoute path="/test-qr" component={TestQRPage} />
      <ProtectedRoute path="/help" component={HelpPage} />
      <ProtectedRoute path="/checkout" component={Checkout} />
      <ProtectedRoute path="/subscribe" component={Payments} />{/* Redireciona para payments */}
      <ProtectedRoute path="/subscription" component={Subscription} />
      <ProtectedRoute path="/first-subscription" component={PatientOnboarding} allowedRoles={["patient"]} />
      <ProtectedRoute path="/payment-success" component={PaymentSuccess} />
      <ProtectedRoute path="/subscription-success" component={SubscriptionSuccess} />

      {/* Doctor Routes */}
      <ProtectedRoute path="/doctor" component={DoctorTelemedicine} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor/welcome" component={DoctorWelcome} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor/financeiro" component={DoctorFinanceiro} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor/consultation-history" component={DoctorConsultationHistory} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor/settings" component={DoctorSettings} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor/medical-records" component={DoctorMedicalRecords} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor/medical-records/edit" component={DoctorMedicalRecordEdit} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor/medical-records/processing" component={ProcessingMedicalRecordPage} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor/processing-wait" component={ProcessingWaitPage} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor-onboarding" component={DoctorOnboarding} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor-telemedicine" component={DoctorTelemedicine} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor-availability" component={DoctorAvailability} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor-emergency" component={TelemedicineEmergencyV3} allowedRoles={["doctor", "patient"]} />
      <ProtectedRoute path="/doctor-direct" component={DoctorDirectEmergency} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor-direct-emergency" component={DoctorDirectEmergency} allowedRoles={["doctor"]} />

      {/* Telemedicine Room com Daily.co - Nova implementação com melhor conexão */}
      <ProtectedRoute path="/telemedicine/:appointmentId" component={DailyTelemedicine} allowedRoles={["doctor", "patient"]} />

      {/* Nova implementação reescrita com melhores práticas do Daily.co */}
      <ProtectedRoute path="/consultation/:id" component={TelemedicineConsultation} allowedRoles={["doctor", "patient"]} />

      {/* Sala de Emergência Daily.co */}
      <ProtectedRoute path="/emergency-call" component={EmergencyCallPage} allowedRoles={["patient", "doctor"]} />

      {/* Sala de Emergência específica do médico */}
      <ProtectedRoute path="/emergency/doctor/:doctorId" component={DoctorEmergencyRoom} allowedRoles={["patient", "doctor"]} />

      {/* Nova implementação de emergência */}
      <ProtectedRoute path="/emergency-room" component={PatientEmergencyRoom} allowedRoles={["patient"]} />
      <ProtectedRoute path="/doctor-emergency/:appointmentId" component={DoctorEmergencyRoom} allowedRoles={["doctor"]} />
      <ProtectedRoute path="/doctor-emergency-room/:id" component={DoctorEmergencyRoom} allowedRoles={["doctor"]} />

      {/* Partner Routes */}
      <ProtectedRoute path="/partner-onboarding" component={PartnerOnboarding} allowedRoles={["partner"]} />
      <ProtectedRoute path="/partner/dashboard" component={PartnerDashboard} allowedRoles={["partner"]} />
      <ProtectedRoute path="/partner/verification" component={PartnerVerification} allowedRoles={["partner"]} />
      <ProtectedRoute path="/partner/services" component={PartnerServices} allowedRoles={["partner"]} />
      <ProtectedRoute path="/partner/addresses" component={PartnerAddresses} allowedRoles={["partner"]} />
      <ProtectedRoute path="/partner/collaborators" component={PartnerCollaborators} allowedRoles={["partner"]} />
      <ProtectedRoute path="/partner/corporate-plans" component={CorporatePlansPage} allowedRoles={["partner"]} />
      <ProtectedRoute path="/partner/corporate-employees" component={CorporateEmployees} allowedRoles={["partner"]} />

      {/* Corporate invite route - accessible without authentication */}
      <Route path="/corporate-invite/:token" component={CorporateInvitePage} />

      {/* Campaign pages - accessible without authentication */}
      <Route path="/campanha/taquari" component={CampaignTaquari} />
      <Route path="/campanha/brasilia" component={CampaignBrasilia} />

      {/* Hospital briefing page - accessible without authentication */}
      <Route path="/hospital-briefing" component={HospitalBriefing} />

      {/* Admin Routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/users" component={AdminUsers} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/users/dependents/:userId" component={AdminUserDependents} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/partners" component={AdminPartners} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/services" component={AdminServices} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/claims" component={AdminClaims} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/qr-auth-logs" component={QrAuthLogs} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/analytics" component={AdminAnalytics} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/subscription-plans" component={AdminSubscriptionPlans} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/seller-stats" component={SellerStats} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/checkout-tracking" component={CheckoutTrackingPage} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/medical-records" component={AdminMedicalRecords} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/doctors" component={AdminDoctors} allowedRoles={["admin"]} />
      <ProtectedRoute path="/admin/leads" component={AdminLeads} allowedRoles={["admin"]} />

      {/* Test routes */}
      <ProtectedRoute path="/test-headless-daily" component={TestHeadlessDaily} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  // const [initialCheckDone, setInitialCheckDone] = React.useState(false);
  const [, setLocation] = useLocation();

  // Usar hook para atualizar a cor do tema dinamicamente
  useThemeColor();

  // Verificação inicial rápida de autenticação no iOS
  React.useEffect(() => {
    if (isNativeApp()) {
      // Verificar rapidamente se há token
      const authToken = localStorage.getItem("authToken");
      const currentPath = window.location.pathname;

      console.log("🔍 Verificação inicial iOS:", { authToken: !!authToken, currentPath });

      // Se não há token e não estamos em uma página pública, redirecionar para /auth
      const publicPaths = ['/auth', '/auth/hsj', '/auth/hcc', '/verificar-email', '/redefinir-senha',
        '/reenviar-verificacao', '/esqueci-senha', '/corporate-invite', '/campanha',
        '/hospital-briefing'];
      const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));

      if (!authToken && !isPublicPath) {
        console.log("📱 iOS: Sem token, redirecionando para /auth");
        setLocation('/auth');
      }
    }
    // setInitialCheckDone(true);
  }, [setLocation]);

  // Inicializar push notifications e configurações iOS em apps nativos
  React.useEffect(() => {
    if (isNativeApp()) {
      // Inicializar configurações do StatusBar com a nova classe
      StatusBarConfig.initialize().catch(error => {
        console.error('Erro ao inicializar StatusBar:', error);
      });

      // Manter a configuração antiga também para compatibilidade
      configureIOSStatusBar().catch(error => {
        console.error('Erro ao inicializar configurações iOS:', error);
      });

      // Inicializar push notifications
      PushNotificationService.initialize().catch(error => {
        console.error('Erro ao inicializar push notifications:', error);
      });
    }
  }, []);

  // Bloqueio de renderização removido

  return (
    <>
      <IOSSessionGuard />
      <Router />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
