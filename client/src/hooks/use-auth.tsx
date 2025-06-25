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
      console.log("Verificando autenticação do usuário...");
      
      // Verificar cookies disponíveis - deve mostrar o cookie da sessão
      console.log("Cookies disponíveis ANTES da requisição:", document.cookie);
      
      // Obter token de autenticação do armazenamento seguro se disponível
      const authTokenResult = await secureStorage.get<string>('auth_token');
      const authToken = authTokenResult.success ? authTokenResult.data : localStorage.getItem("authToken");
      
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
        console.log("Usando token de autenticação:", authToken);
      }
      
      // Adicionar ID da sessão para facilitar debugging
      const sessionID = localStorage.getItem("sessionID");
      if (sessionID) {
        headers["X-Session-ID"] = sessionID;
      }
      
      // Adicionar ID de usuário como backup se disponível
      const userDataString = localStorage.getItem("userData");
      if (userDataString && !authToken) {
        try {
          const userData = JSON.parse(userDataString);
          if (userData && userData.id) {
            headers["X-User-ID"] = userData.id.toString();
          }
        } catch (e) {
          console.warn("Erro ao processar dados de usuário do localStorage");
        }
      }
      
      // Fazer a requisição com todas as configurações necessárias
      const res = await httpRequest({
        url: '/api/user',
        method: 'GET',
        headers,
      });
      
      if (!res.ok) {
        console.error("Erro na verificação de autenticação:", res.status, res.statusText);
        return null;
      }
      
      const userData = await res.json();
      console.log("Usuário autenticado:", userData);
      console.log("🎯 Plano do usuário:", userData.subscriptionPlan);
      console.log("🎯 Status da assinatura:", userData.subscriptionStatus);
      return userData;
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
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
        // Salvar no armazenamento seguro e localStorage como fallback
        await secureStorage.save('auth_token', responseData.authToken);
        localStorage.setItem("authToken", responseData.authToken);
      }
      
      // Armazenar ID da sessão se disponível
      if (responseData.sessionId) {
        console.log("ID da sessão recebido:", responseData.sessionId);
        // Salvar no armazenamento seguro e localStorage como fallback
        await secureStorage.save('session_id', responseData.sessionId);
        localStorage.setItem("sessionID", responseData.sessionId);
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
      
      // Redirecionar com base no papel do usuário
      if (userData.role === "admin") {
        console.log("Usuário é administrador, redirecionando para /admin/users");
        window.location.href = "/admin/users";
      } else if (userData.role === "doctor") {
        // Verificar se o médico completou o onboarding
        console.log("Usuário é médico, verificando status de onboarding...");
        try {
          const profileResponse = await fetch('/api/doctors/profile', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${userData.authToken || localStorage.getItem('authToken')}`
            }
          });
          
          if (profileResponse.ok) {
            const doctorProfile = await profileResponse.json();
            if (!doctorProfile.onboardingCompleted) {
              console.log("Médico não completou onboarding, redirecionando para /onboarding/doctor");
              window.location.href = "/onboarding/doctor";
              return;
            }
          } else if (profileResponse.status === 404) {
            // Se o perfil não existe, redirecionar para onboarding
            console.log("Perfil de médico não encontrado, redirecionando para /onboarding/doctor");
            window.location.href = "/onboarding/doctor";
            return;
          }
        } catch (error) {
          console.error("Erro ao verificar perfil do médico:", error);
          // Em caso de erro, redirecionar para onboarding por segurança
          window.location.href = "/onboarding/doctor";
          return;
        }
        
        console.log("Médico com onboarding completo, redirecionando para /doctor-telemedicine");
        window.location.href = "/doctor-telemedicine";
      } else if (userData.role === "partner") {
        console.log("Usuário é parceiro, redirecionando para /partner/dashboard");
        window.location.href = "/partner/dashboard";
      } else {
        // Pacientes e outros usuários vão para a página principal
        console.log("Usuário é paciente, redirecionando para /dashboard");
        window.location.href = "/dashboard";
      }
      
      // Forçar uma verificação de autenticação
      setTimeout(() => refetch(), 300);
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
      
      // Redirecionar com base no papel do usuário
      if (userData.role === "admin") {
        console.log("Usuário é administrador, redirecionando para /admin/users");
        window.location.href = "/admin/users";
      } else if (userData.role === "doctor") {
        // Verificar se o médico completou o onboarding
        console.log("Usuário é médico, verificando status de onboarding...");
        try {
          const profileResponse = await fetch('/api/doctors/profile', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${userData.authToken || localStorage.getItem('authToken')}`
            }
          });
          
          if (profileResponse.ok) {
            const doctorProfile = await profileResponse.json();
            if (!doctorProfile.onboardingCompleted) {
              console.log("Médico não completou onboarding, redirecionando para /onboarding/doctor");
              window.location.href = "/onboarding/doctor";
              return;
            }
          } else if (profileResponse.status === 404) {
            // Se o perfil não existe, redirecionar para onboarding
            console.log("Perfil de médico não encontrado, redirecionando para /onboarding/doctor");
            window.location.href = "/onboarding/doctor";
            return;
          }
        } catch (error) {
          console.error("Erro ao verificar perfil do médico:", error);
          // Em caso de erro, redirecionar para onboarding por segurança
          window.location.href = "/onboarding/doctor";
          return;
        }
        
        console.log("Médico com onboarding completo, redirecionando para /doctor-telemedicine");
        window.location.href = "/doctor-telemedicine";
      } else if (userData.role === "partner") {
        console.log("Usuário é parceiro, redirecionando para /partner/dashboard");
        window.location.href = "/partner/dashboard";
      } else {
        // Pacientes e outros usuários vão para a página principal
        console.log("Usuário é paciente, redirecionando para /dashboard");
        window.location.href = "/dashboard";
      }
      
      // Forçar uma verificação de autenticação
      setTimeout(() => refetch(), 300);
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
      try {
        // Obter token de autenticação para enviar no header
        const authToken = localStorage.getItem("authToken");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        };
        
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }
        
        // Tentar fazer logout no servidor
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
          headers,
          cache: "no-cache",
        });
        
        // Log da resposta para debug
        console.log("Logout response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Logout response data:", data);
        }
      } catch (error) {
        console.log("Erro ao chamar logout no servidor, continuando com limpeza local:", error);
      }
      
      // Limpar dados locais imediatamente, independente da resposta do servidor
      // Limpar armazenamento seguro
      await secureStorage.clear();
      // Limpar localStorage e sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Função melhorada para limpar cookies
      const clearAllCookies = () => {
        // Obter todos os cookies
        const cookies = document.cookie.split(";");
        
        // Para cada cookie, tentar removê-lo de várias formas
        cookies.forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
          
          if (name) {
            // Tentar remover o cookie com diferentes combinações de path e domain
            const paths = ["/", window.location.pathname];
            const domains = [
              "",
              window.location.hostname,
              `.${window.location.hostname}`,
              window.location.hostname.replace(/^www\./, ""),
              `.${window.location.hostname.replace(/^www\./, "")}`,
            ];
            
            paths.forEach(path => {
              domains.forEach(domain => {
                // Definir cookie com valor vazio e data de expiração no passado
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path};${domain ? ` domain=${domain};` : ""}`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=${path};${domain ? ` domain=${domain};` : ""}`;
              });
            });
          }
        });
        
        // Verificar se ainda há cookies e logar
        console.log("Cookies após limpeza:", document.cookie);
      };
      
      // Limpar todos os cookies
      clearAllCookies();
      
      // Limpar cache do React Query
      queryClient.clear();
      queryClient.removeQueries();
      queryClient.cancelQueries();
      
      // Retornar sucesso sempre
      return { success: true };
    },
    onSettled: () => {
      // Sempre redirecionar, mesmo se houve erro
      console.log("Redirecionando para página de login...");
      // Usar setTimeout para garantir que todas as operações de limpeza sejam concluídas
      setTimeout(() => {
        window.location.href = "/auth";
      }, 100);
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
      
      // Redirecionar com base no papel do usuário (login automático)
      if (userData.role === "admin") {
        console.log("Usuário é administrador, redirecionando para /admin/users");
        window.location.href = "/admin/users";
      } else if (userData.role === "doctor") {
        console.log("Usuário é médico, redirecionando para /onboarding/doctor");
        // Pequeno delay para garantir que o perfil do médico seja criado no backend
        setTimeout(() => {
          window.location.href = "/onboarding/doctor";
        }, 1000);
      } else if (userData.role === "partner") {
        console.log("Usuário é parceiro, redirecionando para /partner-onboarding");
        window.location.href = "/partner-onboarding";
      } else if (userData.role === "patient") {
        // Novos pacientes vão direto para a página de seleção obrigatória de plano
        console.log("Usuário é paciente, redirecionando para /first-subscription");
        window.location.href = "/first-subscription";
      } else {
        console.log("Usuário registrado, redirecionando para /dashboard");
        window.location.href = "/dashboard";
      }
      
      // Forçar uma verificação de autenticação
      setTimeout(() => refetch(), 300);
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
