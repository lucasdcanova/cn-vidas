import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { httpRequest } from "@/lib/http-client";
import { useToast } from "@/hooks/use-toast";
import { User, UserData, LoginCredentials, RegisterCredentials } from "@/shared/types";
import { secureStorage } from "@/services/secure-storage";
import { isNativeApp } from '@/utils/platform';
import { getApiBaseUrl } from '@/config/api';
import { sessionManager } from '@/services/session-manager';
import { metaPixel } from '@/services/meta-pixel';

type AuthContextType = {
  user: UserData | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserData, Error, LoginCredentials>;
  loginWithQRCodeMutation: UseMutationResult<UserData, Error, { token: string }>;
  logoutMutation: UseMutationResult<Response, Error, void>;
  registerMutation: UseMutationResult<UserData, Error, RegisterCredentials>;
  forgotPasswordMutation: UseMutationResult<Response, Error, { email: string }>;
  resetPasswordMutation: UseMutationResult<Response, Error, { token: string; password: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Função para verificar a autenticação do usuário
  const checkAuth = async (): Promise<UserData | null> => {
    try {
      console.log("🔍 Verificando autenticação do usuário...");
      
      // No iOS, verificar se não há dados residuais de sessão
      if (isNativeApp()) {
        // Se não há token mas há dados de usuário em cache, limpar
        const hasToken = localStorage.getItem("authToken") || 
                        (await secureStorage.get<string>('auth_token')).success;
        const hasCachedUser = queryClient.getQueryData(['/api/user']);
        
        if (!hasToken && hasCachedUser) {
          console.log("⚠️ Detectado cache de usuário sem token no iOS, limpando...");
          queryClient.setQueryData(['/api/user'], null);
          return null;
        }
      }
      
      // Verificar cookies disponíveis
      console.log("🍪 Cookies disponíveis:", document.cookie);
      
      // Obter token de autenticação do armazenamento seguro se disponível
      const authTokenResult = await secureStorage.get<string>('auth_token');
      const authToken = authTokenResult.success ? authTokenResult.data : localStorage.getItem("authToken");
      
      // Se não há token, não há sessão ativa
      if (!authToken && !document.cookie.includes('auth_token')) {
        console.log("❌ Nenhum token de autenticação encontrado");
        return null;
      }
      
      // Criar headers com token de autenticação se disponível
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      };
      
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
        headers["X-Auth-Token"] = authToken;
        console.log("🔑 Usando token de autenticação");
      }
      
      // Adicionar ID da sessão para facilitar debugging
      const sessionID = localStorage.getItem("sessionID");
      if (sessionID) {
        headers["X-Session-ID"] = sessionID;
      }
      
      // Fazer a requisição com todas as configurações necessárias
      const res = await httpRequest({
        url: '/api/user',
        method: 'GET',
        headers,
      });
      
      if (!res.ok) {
        console.error("❌ Erro na verificação de autenticação:", res.status, res.statusText);
        
        // Se recebeu 401, limpar dados locais no iOS
        if (res.status === 401 && isNativeApp()) {
          console.log("🧹 Limpando dados locais após 401 no iOS");
          await sessionManager.clearSession();
        }
        
        return null;
      }
      
      const userData = await res.json();
      console.log("✅ Usuário autenticado:", userData.email);
      console.log("🎯 Plano do usuário:", userData.subscriptionPlan);
      console.log("🎯 Status da assinatura:", userData.subscriptionStatus);
      return userData;
    } catch (error) {
      console.error("❌ Erro ao verificar autenticação:", error);
      
      // Em caso de erro no iOS, limpar sessão se não há token válido
      if (isNativeApp()) {
        const hasValidToken = localStorage.getItem("authToken") || 
                             (await secureStorage.get<string>('auth_token')).success;
        if (!hasValidToken) {
          console.log("🧹 Limpando sessão no iOS após erro sem token válido");
          await sessionManager.clearSession();
        }
      }
      
      return null;
    }
  };

  // Query para verificar autenticação
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/user"],
    queryFn: checkAuth,
    retry: 1,
    // **CORREÇÃO: Configurações para garantir dados atualizados do usuário**
    staleTime: 0, // Sempre considera os dados como 'stale' (desatualizados)
    cacheTime: 0, // Sem cache - sempre busca dados frescos do servidor
    refetchOnWindowFocus: true, // Recarregar quando a janela ganha foco
    refetchOnMount: true, // Sempre recarregar ao montar o componente
    refetchOnReconnect: true, // Recarregar quando reconectar à internet
    refetchInterval: false, // Não fazer polling automático
    networkMode: 'always', // Sempre tentar buscar do servidor
  });

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log("Tentando login com credenciais:", { email: credentials.email });
      
      const response = await apiRequest("POST", "/api/login", credentials);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha no login");
      }
      
      const responseData = await response.json();
      
      // Armazenar token de autenticação se disponível
      if (responseData.authToken) {
        console.log("Token de autenticação recebido:", responseData.authToken);
        // Sempre usar localStorage no iOS devido a problemas com SecureStorage
        localStorage.setItem("authToken", responseData.authToken);
        
        // Tentar salvar no armazenamento seguro, mas não falhar se der erro
        try {
          await secureStorage.save('auth_token', responseData.authToken);
        } catch (error) {
          console.warn("SecureStorage falhou, usando apenas localStorage:", error);
        }
      }
      
      // Armazenar ID da sessão se disponível
      if (responseData.sessionId) {
        console.log("ID da sessão recebido:", responseData.sessionId);
        // Sempre usar localStorage no iOS devido a problemas com SecureStorage
        localStorage.setItem("sessionID", responseData.sessionId);
        
        // Tentar salvar no armazenamento seguro, mas não falhar se der erro
        try {
          await secureStorage.save('session_id', responseData.sessionId);
        } catch (error) {
          console.warn("SecureStorage falhou, usando apenas localStorage:", error);
        }
      }
      
      // Armazenar dados do usuário localmente para autenticação alternativa em chamadas de emergência
      try {
        const userData = {
          id: responseData.id,
          email: responseData.email,
          role: responseData.role,
          username: responseData.username,
          fullName: responseData.fullName
        };
        // Salvar no armazenamento seguro e localStorage como fallback
        await secureStorage.save('user_data', userData);
        localStorage.setItem("userData", JSON.stringify(userData));
        console.log("Dados do usuário armazenados para autenticação alternativa");
      } catch (e) {
        console.warn("Erro ao armazenar dados do usuário:", e);
      }
      
      return responseData;
    },
    onSuccess: async (userData: UserData & { sessionId?: string, authToken?: string }) => {
      console.log("Login bem-sucedido:", userData);
      
      // Salvar os dados do usuário na cache
      queryClient.setQueryData(["/api/user"], userData);
      
      // Para médicos, invalidar cache do perfil para forçar busca fresca
      if (userData.role === "doctor") {
        console.log("🔄 Invalidando cache do perfil do médico após login...");
        queryClient.invalidateQueries({ queryKey: ['/api/doctors/profile'] });
        queryClient.removeQueries({ queryKey: ['/api/doctors/profile'] });
      }
      
      // Redirecionar com base no papel do usuário
      if (userData.role === "admin") {
        console.log("Usuário é administrador, redirecionando para /admin/users");
        window.location.href = "/admin/users";
      } else if (userData.role === "doctor") {
        // Verificar se o médico completou o onboarding
        console.log("🏥 [Login] Usuário é médico, verificando status de onboarding...");
        console.log("📱 [Login] Plataforma:", isNativeApp() ? 'iOS' : 'Web');
        
        // No iOS, se temos problemas para buscar o perfil, vamos direto para telemedicina
        // e deixar o guard verificar
        if (isNativeApp()) {
          console.log("📱 [Login] iOS detectado - redirecionando direto para /doctor-telemedicine");
          console.log("📱 [Login] O guard de onboarding irá verificar o status do perfil");
          window.location.href = "/doctor-telemedicine";
          return;
        }
        
        // Na web, continuar com a verificação normal
        try {
          const doctorProfile = await httpRequest<any>('/api/doctors/profile', {
            method: 'GET'
          });
          
          console.log('📊 [Login] Perfil do médico recebido:', {
            id: doctorProfile.id,
            userId: doctorProfile.userId,
            onboardingCompleted: doctorProfile.onboardingCompleted,
            onboardingCompletedType: typeof doctorProfile.onboardingCompleted,
            profileExists: !!doctorProfile
          });
          
          // IMPORTANTE: Verificação explícita de onboardingCompleted
          if (doctorProfile.onboardingCompleted === true) {
            console.log("✅ [Login] Médico com onboarding completo, redirecionando para /doctor-telemedicine");
            window.location.href = "/doctor-telemedicine";
            return;
          } else {
            console.log("⚠️ [Login] Médico não completou onboarding (onboardingCompleted =", doctorProfile.onboardingCompleted, "), redirecionando para /doctor-onboarding");
            window.location.href = "/doctor-onboarding";
            return;
          }
        } catch (error: any) {
          console.error("❌ [Login] Erro ao verificar perfil do médico:", error);
          console.error("❌ [Login] Detalhes do erro:", {
            status: error?.status,
            message: error?.message,
            code: error?.code,
            errorObject: JSON.stringify(error)
          });
          
          // Se for 404, redirecionar para onboarding
          if (error?.status === 404) {
            console.log("📋 [Login] Perfil de médico não encontrado (404), redirecionando para /doctor-onboarding");
            window.location.href = "/doctor-onboarding";
            return;
          }
          
          // Em caso de outro erro, ir para telemedicina e deixar o guard decidir
          console.log("🚨 [Login] Erro ao buscar perfil, redirecionando para /doctor-telemedicine");
          window.location.href = "/doctor-telemedicine";
          return;
        }
      } else if (userData.role === "partner") {
        console.log("Usuário é parceiro, redirecionando para /partner/dashboard");
        window.location.href = "/partner/dashboard";
      } else {
        // Pacientes e outros usuários vão para a página principal
        console.log("Usuário é paciente, redirecionando para /dashboard");
        window.location.href = "/dashboard";
      }
      
      // Forçar uma verificação de autenticação antes do redirecionamento
      await refetch();
    },
    onError: (error: Error) => {
      console.error("Erro no login:", error);
      toast({
        title: "Erro no login",
        description: error.message || "Não foi possível fazer login. Verifique suas credenciais.",
        variant: "destructive",
      });
    },
  });

  // Mutation para login com QR Code
  const loginWithQRCodeMutation = useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      console.log("Tentando login com QR Code:", token);
      
      const response = await apiRequest("POST", "/api/auth/login-qr", { token });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "QR Code inválido ou expirado");
      }
      
      const responseData = await response.json();
      
      // Armazenar token de autenticação se disponível
      if (responseData.authToken) {
        console.log("Token de autenticação recebido:", responseData.authToken);
        localStorage.setItem("authToken", responseData.authToken);
      }
      
      // Armazenar ID da sessão se disponível
      if (responseData.sessionId) {
        console.log("ID da sessão recebido:", responseData.sessionId);
        localStorage.setItem("sessionID", responseData.sessionId);
      }
      
      // Armazenar dados do usuário localmente
      try {
        localStorage.setItem("userData", JSON.stringify({
          id: responseData.id,
          email: responseData.email,
          role: responseData.role,
          username: responseData.username,
          fullName: responseData.fullName
        }));
        console.log("Dados do usuário armazenados para autenticação alternativa");
      } catch (e) {
        console.warn("Erro ao armazenar dados do usuário:", e);
      }
      
      return responseData;
    },
    onSuccess: async (userData: UserData & { sessionId?: string, authToken?: string }) => {
      console.log("Login com QR Code bem-sucedido:", userData);
      
      // Salvar os dados do usuário na cache
      queryClient.setQueryData(["/api/user"], userData);
      
      // Para médicos, invalidar cache do perfil para forçar busca fresca
      if (userData.role === "doctor") {
        console.log("🔄 Invalidando cache do perfil do médico após login com QR Code...");
        queryClient.invalidateQueries({ queryKey: ['/api/doctors/profile'] });
        queryClient.removeQueries({ queryKey: ['/api/doctors/profile'] });
      }
      
      // Redirecionar com base no papel do usuário
      if (userData.role === "admin") {
        console.log("Usuário é administrador, redirecionando para /admin/users");
        window.location.href = "/admin/users";
      } else if (userData.role === "doctor") {
        // Verificar se o médico completou o onboarding
        console.log("🏥 [Login] Usuário é médico, verificando status de onboarding...");
        console.log("📱 [Login] Plataforma:", isNativeApp() ? 'iOS' : 'Web');
        
        // No iOS, se temos problemas para buscar o perfil, vamos direto para telemedicina
        // e deixar o guard verificar
        if (isNativeApp()) {
          console.log("📱 [Login] iOS detectado - redirecionando direto para /doctor-telemedicine");
          console.log("📱 [Login] O guard de onboarding irá verificar o status do perfil");
          window.location.href = "/doctor-telemedicine";
          return;
        }
        
        // Na web, continuar com a verificação normal
        try {
          const doctorProfile = await httpRequest<any>('/api/doctors/profile', {
            method: 'GET'
          });
          
          console.log('📊 [Login] Perfil do médico recebido:', {
            id: doctorProfile.id,
            userId: doctorProfile.userId,
            onboardingCompleted: doctorProfile.onboardingCompleted,
            onboardingCompletedType: typeof doctorProfile.onboardingCompleted,
            profileExists: !!doctorProfile
          });
          
          // IMPORTANTE: Verificação explícita de onboardingCompleted
          if (doctorProfile.onboardingCompleted === true) {
            console.log("✅ [Login] Médico com onboarding completo, redirecionando para /doctor-telemedicine");
            window.location.href = "/doctor-telemedicine";
            return;
          } else {
            console.log("⚠️ [Login] Médico não completou onboarding (onboardingCompleted =", doctorProfile.onboardingCompleted, "), redirecionando para /doctor-onboarding");
            window.location.href = "/doctor-onboarding";
            return;
          }
        } catch (error: any) {
          console.error("❌ [Login] Erro ao verificar perfil do médico:", error);
          console.error("❌ [Login] Detalhes do erro:", {
            status: error?.status,
            message: error?.message,
            code: error?.code,
            errorObject: JSON.stringify(error)
          });
          
          // Se for 404, redirecionar para onboarding
          if (error?.status === 404) {
            console.log("📋 [Login] Perfil de médico não encontrado (404), redirecionando para /doctor-onboarding");
            window.location.href = "/doctor-onboarding";
            return;
          }
          
          // Em caso de outro erro, ir para telemedicina e deixar o guard decidir
          console.log("🚨 [Login] Erro ao buscar perfil, redirecionando para /doctor-telemedicine");
          window.location.href = "/doctor-telemedicine";
          return;
        }
      } else if (userData.role === "partner") {
        console.log("Usuário é parceiro, redirecionando para /partner/dashboard");
        window.location.href = "/partner/dashboard";
      } else {
        // Pacientes e outros usuários vão para a página principal
        console.log("Usuário é paciente, redirecionando para /dashboard");
        window.location.href = "/dashboard";
      }
      
      // Forçar uma verificação de autenticação antes do redirecionamento
      await refetch();
    },
    onError: (error: Error) => {
      console.error("Erro no login com QR Code:", error);
      toast({
        title: "Erro no login",
        description: error.message || "QR Code inválido ou expirado. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("🚪 Iniciando processo de logout");
      
      try {
        // Obter token de autenticação para enviar no header
        const authToken = localStorage.getItem("authToken");
        
        // Fazer logout no servidor
        if (isNativeApp()) {
          // No iOS, usar CapacitorHttp para garantir que cookies sejam limpos
          const { CapacitorHttp } = await import('@capacitor/core');
          
          try {
            const response = await CapacitorHttp.request({
              url: `${getApiBaseUrl()}/api/auth/logout`,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': authToken || '',
              }
            });
            
            console.log("✅ Logout no servidor (iOS):", response.status);
          } catch (error) {
            console.log("⚠️ Erro ao fazer logout no servidor (iOS):", error);
          }
        } else {
          // Para web, usar fetch normal
          try {
            const headers: Record<string, string> = {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            };
            
            if (authToken) {
              headers["Authorization"] = `Bearer ${authToken}`;
              headers["X-Auth-Token"] = authToken;
            }
            
            const response = await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "include",
              headers,
              cache: "no-cache",
            });
            
            console.log("✅ Logout no servidor (Web):", response.status);
          } catch (error) {
            console.log("⚠️ Erro ao fazer logout no servidor (Web):", error);
          }
        }
      } catch (error) {
        console.log("⚠️ Erro geral ao chamar logout no servidor:", error);
      }
      
      // Usar SessionManager para limpar sessão completamente
      await sessionManager.clearSession();
      
      console.log("✅ Logout concluído");
      return { success: true };
    },
    onSuccess: async () => {
      console.log("✅ Logout bem-sucedido");
      
      // Aguardar um momento extra no iOS
      if (isNativeApp()) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Verificar se o login foi via HSJ
      const loginSource = localStorage.getItem('loginSource');
      
      // Limpar loginSource do localStorage
      localStorage.removeItem('loginSource');
      
      // Redirecionar para página de login apropriada
      if (loginSource === 'hsj') {
        window.location.href = "/auth/hsj";
      } else {
        window.location.href = "/auth";
      }
    },
    onError: (error) => {
      console.error("❌ Erro no logout:", error);
      // Mesmo com erro, fazer logout local e redirecionar
      sessionManager.forceLogout();
    },
  });

  // Mutation para registro
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      console.log("Tentando registrar com dados:", { email: credentials.email });
      
      const response = await apiRequest("POST", "/api/register", credentials);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha no registro");
      }
      
      const userData = await response.json();
      
      // Armazenar o token de autenticação se disponível
      if (userData.authToken) {
        console.log("Token de autenticação recebido no registro:", userData.authToken);
        localStorage.setItem("authToken", userData.authToken);
      }
      
      // Armazenar dados do usuário localmente para autenticação alternativa
      try {
        localStorage.setItem("userData", JSON.stringify({
          id: userData.id,
          email: userData.email,
          role: userData.role,
          username: userData.username,
          fullName: userData.fullName
        }));
        console.log("Dados do usuário armazenados após registro");
      } catch (e) {
        console.warn("Erro ao armazenar dados do usuário:", e);
      }
      
      // Save user data to cache
      queryClient.setQueryData(["/api/user"], userData);
      
      return userData;
    },
    onSuccess: async (userData: UserData & { sessionId?: string, authToken?: string }) => {
      console.log("Registro bem-sucedido:", userData);
      
      // Salvar os dados do usuário na cache (login automático)
      queryClient.setQueryData(["/api/user"], userData);
      
      toast({
        title: "Conta criada com sucesso",
        description: `Bem-vindo(a) ao CN Vidas, ${userData.fullName}!`,
      });
      
      // Disparar evento de registro completo para o Meta Pixel
      try {
        metaPixel.trackCompleteRegistration({
          userId: userData.id,
          role: userData.role,
          email: userData.email,
          fullName: userData.fullName,
          subscriptionPlan: userData.subscriptionPlan || undefined
        });
      } catch (error) {
        console.error("Erro ao disparar evento do Meta Pixel:", error);
      }
      
      // Redirecionar com base no papel do usuário (login automático)
      if (userData.role === "admin") {
        console.log("Usuário é administrador, redirecionando para /admin/users");
        window.location.href = "/admin/users";
      } else if (userData.role === "doctor") {
        console.log("Usuário é médico, redirecionando para /doctor-onboarding");
        // Pequeno delay para garantir que o perfil do médico seja criado no backend
        setTimeout(() => {
          window.location.href = "/doctor-onboarding";
        }, 1000);
      } else if (userData.role === "partner") {
        console.log("Usuário é parceiro, redirecionando para /partner/services");
        // Pequeno delay para garantir que os dados sejam salvos no cache
        setTimeout(() => {
          window.location.href = "/partner/services";
        }, 500);
      } else if (userData.role === "patient") {
        // Novos pacientes vão direto para a página de seleção obrigatória de plano
        console.log("Usuário é paciente, redirecionando para /first-subscription");
        window.location.href = "/first-subscription";
      } else {
        console.log("Usuário registrado, redirecionando para /dashboard");
        window.location.href = "/dashboard";
      }
      
      // Forçar uma verificação de autenticação antes do redirecionamento
      await refetch();
    },
    onError: (error: Error) => {
      console.error("Erro no registro:", error);
      toast({
        title: "Erro no registro",
        description: error.message || "Não foi possível criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para recuperação de senha
  const forgotPasswordMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      return await apiRequest("POST", "/api/forgot-password", { email });
    },
    onSuccess: () => {
      toast({
        title: "E-mail enviado",
        description: "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para redefinição de senha
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      return await apiRequest("POST", "/api/reset-password", { token, password });
    },
    onSuccess: () => {
      toast({
        title: "Senha redefinida com sucesso",
        description: "Você já pode fazer login com sua nova senha.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        loginWithQRCodeMutation,
        logoutMutation,
        registerMutation,
        forgotPasswordMutation,
        resetPasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
