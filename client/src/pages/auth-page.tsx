import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useIOSKeyboard } from "@/hooks/use-ios-keyboard";
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { Button } from "@/components/ui/button";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";
import { Fingerprint, Smartphone } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/components/layouts/auth-layout";
import { useLocation } from "wouter";

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Informe um e-mail válido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
});

// Importação das funções de validação de CPF e CNPJ
import { validateCPF, formatCPF, unformatCPF } from "@/lib/cpf-validator";
import { validateCNPJ, formatCNPJ, unformatCNPJ } from "@/lib/cnpj-validator";
import { useState as useStateHook, useEffect as useEffectHook } from 'react';
import { hapticService as haptic } from '@/services/haptic-service';
import { isNativeApp } from "@/utils/platform";

// Função para processar o conteúdo e adicionar formatação
const formatLegalContent = (content: string): React.ReactNode => {
  // Processar linhas individualmente para preservar quebras de linha
  const lines = content.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Processar cada linha para formatação
    let processedLine: React.ReactNode = line;
    
    // Detectar títulos principais (linhas em maiúsculas ou começando com números romanos)
    if (/^[IVX]+\.\s+/.test(line) || /^\d+\.\s+[A-Z]/.test(line) || /^[A-Z\s]{10,}$/.test(line.trim())) {
      processedLine = <strong>{line}</strong>;
    }
    // Detectar cláusulas importantes
    else if (/^(CLÁUSULA|Cláusula|PARÁGRAFO|Parágrafo|ARTIGO|Art\.)/.test(line)) {
      processedLine = <strong>{line}</strong>;
    }
    // Detectar termos importantes para sublinhar
    else if (line.length > 0) {
      // Substituir termos importantes por versões sublinhadas
      const importantTerms = [
        /\b(IMPORTANTE|ATENÇÃO|OBSERVAÇÃO|NOTA)\b/gi,
        /\b(obrigatório|obrigatória|necessário|necessária)\b/gi,
        /\b(prazo|vencimento|validade|vigência)\b/gi,
        /\b(multa|penalidade|sanção|descumprimento)\b/gi,
        /\b(rescisão|cancelamento|término|encerramento)\b/gi,
        /\b(responsabilidade|obrigação|dever)\b/gi,
        /\b(carência|cobertura|exclusão)\b/gi,
        /\b(não será|não serão|vedado|proibido)\b/gi
      ];
      
      let processedText = line;
      importantTerms.forEach(term => {
        processedText = processedText.replace(term, (match) => `<u>${match}</u>`);
      });
      
      // Converter o texto processado em React elements
      if (processedText !== line) {
        const parts = processedText.split(/(<u>.*?<\/u>)/g);
        processedLine = parts.map((part, partIndex) => {
          if (part.startsWith('<u>') && part.endsWith('</u>')) {
            return <u key={partIndex}>{part.slice(3, -4)}</u>;
          }
          return part;
        });
      }
    }
    
    return (
      <React.Fragment key={lineIndex}>
        {processedLine}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

// Componentes para exibir conteúdo completo dos contratos
const TermsOfUseContent = () => {
  const [content, setContent] = useStateHook<string>("");
  const [loading, setLoading] = useStateHook(true);
  
  useEffectHook(() => {
    fetch("/api/legal-documents/terms-of-use.md")
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent("Erro ao carregar o documento. Por favor, tente novamente.");
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div className="text-center py-4">Carregando...</div>;
  
  return (
    <div className="bg-white text-black p-4">
      <div className="font-sans text-sm leading-relaxed">{formatLegalContent(content)}</div>
    </div>
  );
};

const PrivacyPolicyContent = () => {
  const [content, setContent] = useStateHook<string>("");
  const [loading, setLoading] = useStateHook(true);
  
  useEffectHook(() => {
    fetch("/api/legal-documents/privacy-policy.md")
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent("Erro ao carregar o documento. Por favor, tente novamente.");
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div className="text-center py-4">Carregando...</div>;
  
  return (
    <div className="bg-white text-black p-4">
      <div className="font-sans text-sm leading-relaxed">{formatLegalContent(content)}</div>
    </div>
  );
};

const AdhesionContractContent = () => {
  const [content, setContent] = useStateHook<string>("");
  const [loading, setLoading] = useStateHook(true);
  
  useEffectHook(() => {
    fetch("/api/legal-documents/adhesion-contract.md")
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent("Erro ao carregar o documento. Por favor, tente novamente.");
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div className="text-center py-4">Carregando...</div>;
  
  return (
    <div className="bg-white text-black p-4">
      <div className="font-sans text-sm leading-relaxed">{formatLegalContent(content)}</div>
    </div>
  );
};

const PartnerContractContent = () => {
  const [content, setContent] = useStateHook<string>("");
  const [loading, setLoading] = useStateHook(true);
  
  useEffectHook(() => {
    fetch("/api/legal-documents/partner-contract.md")
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent("Erro ao carregar o documento. Por favor, tente novamente.");
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div className="text-center py-4">Carregando...</div>;
  
  return (
    <div className="bg-white text-black p-4">
      <div className="font-sans text-sm leading-relaxed">{formatLegalContent(content)}</div>
    </div>
  );
};

const DoctorContractContent = () => {
  const [content, setContent] = useStateHook<string>("");
  const [loading, setLoading] = useStateHook(true);
  
  useEffectHook(() => {
    fetch("/api/legal-documents/doctor-contract.md")
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setContent("Erro ao carregar o documento. Por favor, tente novamente.");
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div className="text-center py-4">Carregando...</div>;
  
  return (
    <div className="bg-white text-black p-4">
      <div className="font-sans text-sm leading-relaxed">{formatLegalContent(content)}</div>
    </div>
  );
};

// Registration form schema
const registerSchema = z.discriminatedUnion("role", [
  // Schema para pacientes (requer CPF)
  z.object({
    role: z.literal("patient"),
    email: z.string().email({ message: "Informe um e-mail válido" }),
    username: z.string().optional(),
    cpf: z.string().min(11, { message: "CPF inválido" }).max(14, { message: "CPF inválido" }),
    cnpj: z.string().optional(),
    password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
    fullName: z.string().min(3, { message: "O nome completo é obrigatório" }),
    acceptAllTerms: z.boolean().refine(val => val === true, {
      message: "Você deve aceitar todos os termos e políticas",
    }),
  }),
  // Schema para parceiros (requer CNPJ)
  z.object({
    role: z.literal("partner"),
    email: z.string().email({ message: "Informe um e-mail válido" }),
    username: z.string().optional(),
    cpf: z.string().optional(),
    cnpj: z.string().min(14, { message: "CNPJ inválido" }).max(18, { message: "CNPJ inválido" }),
    password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
    fullName: z.string().min(3, { message: "O nome da empresa é obrigatório" }),
    acceptAllTerms: z.boolean().refine(val => val === true, {
      message: "Você deve aceitar todos os termos e políticas",
    }),
  }),
  // Schema para médicos e admins (requer username)
  z.object({
    role: z.enum(["doctor", "admin"]),
    email: z.string().email({ message: "Informe um e-mail válido" }),
    username: z.string().min(3, { message: "O nome de usuário deve ter pelo menos 3 caracteres" }),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
    fullName: z.string().min(3, { message: "O nome completo é obrigatório" }),
    acceptAllTerms: z.boolean().refine(val => val === true, {
      message: "Você deve aceitar todos os termos e políticas",
    }),
  }),
]).superRefine((data, ctx) => {
  // Se for paciente, CPF é obrigatório e deve ser válido
  if (data.role === "patient") {
    if (!data.cpf) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF é obrigatório para pacientes",
        path: ["cpf"]
      });
      return false;
    }
    
    const cleanCPF = unformatCPF(data.cpf);
    if (!validateCPF(cleanCPF)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF inválido. Verifique os dígitos informados",
        path: ["cpf"]
      });
      return false;
    }
  }
  
  // Se for parceiro, CNPJ é obrigatório e deve ser válido
  if (data.role === "partner") {
    if (!data.cnpj) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CNPJ é obrigatório para empresas",
        path: ["cnpj"]
      });
      return false;
    }
    
    const cleanCNPJ = unformatCNPJ(data.cnpj);
    if (!validateCNPJ(cleanCNPJ)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CNPJ inválido. Verifique os dígitos informados",
        path: ["cnpj"]
      });
      return false;
    }
  }
  
  // Se for médico, username é obrigatório
  if (data.role === "doctor" && !data.username) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Registro no CRM é obrigatório",
      path: ["username"]
    });
    return false;
  }
  
  // Se for admin, username é obrigatório
  if (data.role === "admin" && !data.username) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Nome de usuário é obrigatório para administradores",
      path: ["username"]
    });
    return false;
  }
  
  return true;
});

// Types for the form values
type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Lista de estados brasileiros para o seletor de UF do CRM
const estadosBrasileiros = [
  { value: "AC", label: "AC" },
  { value: "AL", label: "AL" },
  { value: "AP", label: "AP" },
  { value: "AM", label: "AM" },
  { value: "BA", label: "BA" },
  { value: "CE", label: "CE" },
  { value: "DF", label: "DF" },
  { value: "ES", label: "ES" },
  { value: "GO", label: "GO" },
  { value: "MA", label: "MA" },
  { value: "MT", label: "MT" },
  { value: "MS", label: "MS" },
  { value: "MG", label: "MG" },
  { value: "PA", label: "PA" },
  { value: "PB", label: "PB" },
  { value: "PR", label: "PR" },
  { value: "PE", label: "PE" },
  { value: "PI", label: "PI" },
  { value: "RJ", label: "RJ" },
  { value: "RN", label: "RN" },
  { value: "RS", label: "RS" },
  { value: "RO", label: "RO" },
  { value: "RR", label: "RR" },
  { value: "SC", label: "SC" },
  { value: "SP", label: "SP" },
  { value: "SE", label: "SE" },
  { value: "TO", label: "TO" }
];


const AuthPage: React.FC = () => {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [estadoSelecionado, setEstadoSelecionado] = useState("SP");
  const [, navigate] = useLocation();
  const { isKeyboardVisible } = useIOSKeyboard();
  const [activeTab, setActiveTab] = useState("register");
  const { 
    isAvailable: isBiometricAvailable, 
    biometryTypeName, 
    authenticate: authenticateBiometric,
    saveCredentials: saveBiometricCredentials,
    getStoredCredentials,
    isAuthenticating 
  } = useBiometricAuth();
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  
  // Refs para os campos de input
  const emailLoginRef = useRef<HTMLInputElement>(null);
  const passwordLoginRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Função para fazer scroll automático
  const scrollToCenter = (element: HTMLElement) => {
    if (!scrollContainerRef.current || !element) return;
    
    // Aguardar um pouco para o teclado abrir completamente
    setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // Calcular a posição para centralizar o elemento
      const scrollTop = container.scrollTop;
      const elementTop = elementRect.top - containerRect.top + scrollTop;
      const containerHeight = containerRect.height;
      const elementHeight = elementRect.height;
      
      // Posição desejada: centro da tela
      const targetScrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
      
      // Fazer scroll suave com requestAnimationFrame para melhor performance
      const startScrollTop = container.scrollTop;
      const distance = targetScrollTop - startScrollTop;
      const duration = 300;
      let start: number | null = null;
      
      const animateScroll = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        
        // Easing function para movimento suave
        const easeInOutCubic = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        container.scrollTop = startScrollTop + (distance * easeInOutCubic);
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };
      
      requestAnimationFrame(animateScroll);
    }, 300); // Aguardar 300ms para o teclado abrir
  };
  
  // Configurar o teclado do iOS
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Configurar comportamento do teclado
      Keyboard.setAccessoryBarVisible({ isVisible: true });
    }
  }, []);
  
  // Adicionar Microsoft Clarity
  useEffect(() => {
    // Criar e adicionar o script do Clarity
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.innerHTML = `
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "sfzv6avsfo");
    `;
    document.head.appendChild(script);
    
    // Cleanup ao desmontar o componente
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);
  
  // Verificar se há credenciais biométricas salvas ao carregar
  useEffect(() => {
    const checkBiometricCredentials = async () => {
      if (isBiometricAvailable && !user) {
        const credentials = await getStoredCredentials();
        if (credentials?.username) {
          // Se há credenciais salvas e o usuário habilitou Face ID, tentar login biométrico automaticamente
          const biometricEnabled = localStorage.getItem('biometricEnabled') === 'true';
          if (biometricEnabled) {
            handleBiometricLogin();
          }
        }
      }
    };
    
    checkBiometricCredentials();
  }, [isBiometricAvailable]);
  
  // Função para login biométrico
  const handleBiometricLogin = async () => {
    try {
      const isAuthenticated = await authenticateBiometric('Faça login no CN Vidas');
      
      if (isAuthenticated) {
        const credentials = await getStoredCredentials();
        if (credentials?.username && credentials?.password) {
          // Fazer login com as credenciais salvas
          setIsLoggingIn(true);
          const user = await loginMutation.mutateAsync({
            email: credentials.username,
            password: credentials.password
          });
          console.log('Login biométrico bem-sucedido');
        }
      }
    } catch (error) {
      console.error('Erro no login biométrico:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Redirect if already authenticated with role-based routing
  useEffect(() => {
    if (user) {
      if (user.role === "doctor") {
        navigate("/doctor-telemedicine");
      } else if (user.role === "partner") {
        navigate("/partner/services"); // Caminho correto com a barra entre partner e services
      } else if (user.role === "admin") {
        navigate("/admin/users");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate]);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      cpf: "",
      cnpj: "",
      password: "",
      fullName: "",
      role: "patient",
    },
  });
  
  // Handle login form submission with role-based redirection
  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoggingIn(true);
    setLoginError(null); // Limpar erros anteriores
    try {
      console.log("Attempting login with:", { email: data.email });
      
      // Make sure we're using the proper credentials format without role
      const loginData = {
        email: data.email,
        password: data.password
      };
      
      const user = await loginMutation.mutateAsync(loginData);
      console.log("Login successful, user data received:", user);
      
      // Store the session ID from the debug info in localStorage for debugging
      if (user && (user as any)._debug && (user as any)._debug.sessionID) {
        localStorage.setItem('sessionID', (user as any)._debug.sessionID);
        console.log("Session ID stored:", (user as any)._debug.sessionID);
      }
      
      // O redirecionamento será feito automaticamente pelo useAuth hook
      console.log("Login processado, aguardando redirecionamento automático...");
      
      // Salvar credenciais biométricas se habilitado
      if (enableBiometric && isBiometricAvailable) {
        await saveBiometricCredentials(data.email, data.password);
        // Salvar preferência do usuário no localStorage
        localStorage.setItem('biometricEnabled', 'true');
      }
      
      // Haptic feedback de sucesso
      await haptic.success();
    } catch (error: any) {
      // Additional error logging
      console.error("Login error:", error);
      
      // Definir mensagem de erro específica baseada na resposta
      let errorMessage = "Erro ao fazer login. Tente novamente.";
      
      if (error.message) {
        if (error.message.includes("Email ou senha incorretos")) {
          errorMessage = "Email ou senha incorretos. Verifique seus dados e tente novamente.";
        } else if (error.message.includes("verifique seu email")) {
          errorMessage = "Por favor, verifique seu email antes de fazer login.";
        } else if (error.message.includes("não encontrado")) {
          errorMessage = "Usuário não encontrado. Verifique o email digitado.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setLoginError(errorMessage);
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Haptic feedback de erro
      await haptic.error();
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Handle register form submission with role-based redirection
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsRegistering(true);
    setRegisterError(null); // Limpar erros anteriores
    try {
      console.log("Attempting registration with:", { email: data.email, role: data.role });
      
      // Make sure we're using the proper registration format based on role
      let registerData;
      
      if (data.role === "patient") {
        // Para pacientes, enviamos o CPF e geramos um username baseado no CPF (sem pontuação)
        const cleanCPF = data.cpf ? unformatCPF(data.cpf) : "";
        registerData = {
          email: data.email,
          username: `p${cleanCPF}`, // Prefixo 'p' seguido do CPF sem formatação
          password: data.password,
          fullName: data.fullName,
          role: data.role,
          cpf: data.cpf, // Enviamos o CPF formatado também
          acceptTerms: data.acceptAllTerms,
          acceptPrivacy: data.acceptAllTerms,
          acceptContract: data.acceptAllTerms,
          acceptRecording: data.acceptAllTerms
        };
      } else if (data.role === "partner") {
        // Para parceiros/empresas, usamos o CNPJ como base para o username
        const cleanCNPJ = data.cnpj ? unformatCNPJ(data.cnpj) : "";
        registerData = {
          email: data.email,
          username: `e${cleanCNPJ}`, // Prefixo 'e' (empresa) seguido pelo CNPJ sem formatação
          password: data.password,
          fullName: data.fullName,
          role: data.role,
          cnpj: data.cnpj, // Enviamos o CNPJ formatado também
          acceptTerms: data.acceptAllTerms,
          acceptPrivacy: data.acceptAllTerms,
          acceptPartnerContract: data.acceptAllTerms
        };
      } else {
        // Para médicos e admins, usamos o username fornecido
        // Garantimos que username nunca seja undefined
        registerData = {
          email: data.email,
          username: data.username || `u_${Date.now()}`, // Fallback para evitar username undefined
          password: data.password,
          fullName: data.fullName,
          role: data.role,
          acceptTerms: data.acceptAllTerms,
          acceptPrivacy: data.acceptAllTerms,
          acceptRecording: data.acceptAllTerms
        };
      }
      
      await registerMutation.mutateAsync(registerData);
      console.log("Registration successful, redirection will be handled by mutation hook");
    } catch (error: any) {
      // Additional error logging
      console.error("Registration error:", error);
      
      // Definir mensagem de erro específica baseada na resposta
      let errorMessage = "Erro ao criar conta. Tente novamente.";
      
      if (error.message) {
        if (error.message.includes("já está cadastrado")) {
          errorMessage = "Este email já está cadastrado. Use outro email ou faça login.";
        } else if (error.message.includes("CPF inválido")) {
          errorMessage = "CPF inválido. Verifique os dígitos informados.";
        } else if (error.message.includes("CNPJ inválido")) {
          errorMessage = "CNPJ inválido. Verifique os dígitos informados.";
        } else if (error.message.includes("senha")) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres.";
        } else if (error.message.includes("aceitar")) {
          errorMessage = "Você deve aceitar todos os termos e políticas para continuar.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setRegisterError(errorMessage);
      
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Haptic feedback de erro
      await haptic.error();
    } finally {
      setIsRegistering(false);
    }
  };
  
  return (
    <AuthLayout activeTab={activeTab}>
      <div 
        ref={scrollContainerRef}
        className={`flex-1 flex flex-col max-w-xl mx-auto w-full px-4 ${
          activeTab === 'register' && isKeyboardVisible ? 'py-1' : 
          isKeyboardVisible ? 'py-2' : 
          activeTab === 'login' ? 'py-4' : 'py-6'
        } ${activeTab === 'login' ? '' : 'overflow-y-auto'}`} 
        style={{
          maxHeight: isKeyboardVisible ? '100%' : 'auto',
          paddingBottom: isKeyboardVisible ? '0' : undefined,
          scrollBehavior: 'smooth',
          overflow: activeTab === 'login' && !isKeyboardVisible ? 'hidden' : undefined
        }}>
        <Tabs defaultValue="register" value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          // Limpar erros ao trocar de aba
          setLoginError(null);
          setRegisterError(null);
        }} className="w-full flex-1 flex flex-col">
          <TabsList className={`grid w-full grid-cols-2 p-0.5 bg-gray-100/60 backdrop-blur-sm rounded-lg shadow-lg ${activeTab === 'login' ? 'mb-3' : 'mb-4'}`}>
            <TabsTrigger value="login" className="rounded-md py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600" style={{ transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="rounded-md py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600" style={{ transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Cadastro
            </TabsTrigger>
          </TabsList>
        
        <TabsContent value="login">
          <div className="relative p-4 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/10 border border-white/60 overflow-hidden">
            {/* Gradient orbs para efeito de profundidade */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="relative z-10">
              <div className="mb-3 text-center">
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Bem-vindo de volta
                </h1>
                <p className="text-gray-500 mt-0.5 text-xs font-light">
                  Acesse sua conta para continuar
                </p>
              </div>
              
              {/* Mensagem de erro do login */}
              {loginError && (
                <Alert className="mb-4 border-red-200 bg-red-50/50 backdrop-blur-sm">
                  <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <AlertDescription className="text-xs text-red-800">
                    {loginError}
                  </AlertDescription>
                </Alert>
              )}
            
            <Form {...loginForm}>
              <form 
                onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
                className="space-y-3"
                onKeyDown={(e) => {
                  // Navegar entre campos com Tab ou tecla de próximo do iOS
                  if (e.key === 'Tab' && !e.shiftKey && document.activeElement === emailLoginRef.current) {
                    e.preventDefault();
                    passwordLoginRef.current?.focus();
                  }
                }}
              >
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 text-xs font-medium mb-1.5 block">E-mail</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                          </div>
                          <input 
                            ref={emailLoginRef}
                            placeholder="seu@email.com" 
                            type="email" 
                            disabled={isLoggingIn}
                            className="pl-9 pr-3 py-2.5 rounded-xl h-10 text-xs bg-gray-50/50 border border-gray-200/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 w-full transition-all duration-200 hover:bg-white/60"
                            autoComplete="email"
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck="false"
                            inputMode="email"
                            enterKeyHint="next"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] mt-1" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-1.5">
                        <FormLabel className="text-gray-700 text-xs font-medium">Senha</FormLabel>
                        <a href="/esqueci-senha" className="text-[10px] font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200">
                          Esqueceu a senha?
                        </a>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <input 
                            ref={passwordLoginRef}
                            placeholder="••••••••" 
                            type="password"
                            disabled={isLoggingIn}
                            className="pl-9 pr-3 py-2.5 rounded-xl h-10 text-xs bg-gray-50/50 border border-gray-200/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 w-full transition-all duration-200 hover:bg-white/60"
                            autoComplete="current-password"
                            enterKeyHint="go"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                loginForm.handleSubmit(onLoginSubmit)();
                              }
                            }}
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] mt-1" />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-1.5 my-2">
                  <label className="flex items-center cursor-pointer group">
                    <div className="relative">
                      <input 
                        id="remember-me" 
                        name="remember-me" 
                        type="checkbox" 
                        className="sr-only peer" 
                      />
                      <div className="w-3.5 h-3.5 bg-gray-100 rounded peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 transition-all duration-200"></div>
                      <svg className="absolute top-0 left-0 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200 p-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="ml-2 text-[11px] text-gray-600 group-hover:text-gray-800 transition-colors">
                      Lembrar-me
                    </span>
                  </label>
                  
                  {isBiometricAvailable && (
                    <label className="flex items-center cursor-pointer group">
                      <div className="relative">
                        <input 
                          id="enable-biometric" 
                          name="enable-biometric" 
                          type="checkbox"
                          checked={enableBiometric}
                          onChange={(e) => setEnableBiometric(e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-3.5 h-3.5 bg-gray-100 rounded peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 transition-all duration-200"></div>
                        <svg className="absolute top-0 left-0 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200 p-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="ml-2 text-[11px] text-gray-600 group-hover:text-gray-800 transition-colors">
                        Habilitar login com {biometryTypeName}
                      </span>
                    </label>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-9 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group mt-3"
                  style={{ transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                  disabled={isLoggingIn || isAuthenticating}
                >
                  <div className="absolute inset-0 -top-[200%] bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:top-0" />
                  <span className="relative flex items-center justify-center">
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        Entrar
                        <svg className="ml-2 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </span>
                </Button>
              </form>
            </Form>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="register">
          <div className="relative p-6 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/10 border border-white/60 overflow-hidden">
            {/* Gradient orbs para efeito de profundidade */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <div className="relative z-10">
              <div className="mb-4 text-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Crie sua conta
                </h1>
                <p className="text-gray-500 mt-1 text-xs font-light">
                  Preencha os dados para criar seu perfil na CN Vidas
                </p>
              </div>
              
              {/* Mensagem de erro do registro */}
              {registerError && (
                <Alert className="mb-4 border-red-200 bg-red-50/50 backdrop-blur-sm">
                  <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <AlertDescription className="text-xs text-red-800">
                    {registerError}
                  </AlertDescription>
                </Alert>
              )}
            
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3">
                <FormField
                  control={registerForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 text-xs font-medium mb-2 block">Tipo de perfil</FormLabel>
                      <div className="grid grid-cols-3 gap-2"
                        onFocus={(e) => activeTab === 'register' && scrollToCenter(e.currentTarget)}
                        tabIndex={0}
                      >
                        <div 
                          className={`relative flex flex-col items-center p-2.5 border-2 ${
                            field.value === "patient" 
                              ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-700" 
                              : "border-gray-200/50 text-gray-600 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-blue-100/20"
                          } rounded-xl cursor-pointer shadow-md hover:shadow-lg overflow-hidden group`} 
                          style={{ transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                          onClick={() => field.onChange("patient")}
                        >
                          {field.value === "patient" && (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-600/10 animate-pulse" />
                          )}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mb-1 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-[10px] font-medium relative z-10">Paciente</span>
                        </div>
                        
                        <div 
                          className={`relative flex flex-col items-center p-2.5 border-2 ${
                            field.value === "doctor" 
                              ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-700" 
                              : "border-gray-200/50 text-gray-600 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-blue-100/20"
                          } rounded-xl cursor-pointer shadow-md hover:shadow-lg overflow-hidden group`} 
                          style={{ transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                          onClick={() => field.onChange("doctor")}
                        >
                          {field.value === "doctor" && (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-600/10 animate-pulse" />
                          )}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mb-1 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          <span className="text-[10px] font-medium relative z-10">Médico</span>
                        </div>
                        
                        <div 
                          className={`relative flex flex-col items-center p-2.5 border-2 ${
                            field.value === "partner" 
                              ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-700" 
                              : "border-gray-200/50 text-gray-600 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-blue-100/20"
                          } rounded-xl cursor-pointer shadow-md hover:shadow-lg overflow-hidden group`} 
                          style={{ transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                          onClick={() => field.onChange("partner")}
                        >
                          {field.value === "partner" && (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-600/10 animate-pulse" />
                          )}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mb-1 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="text-[10px] font-medium relative z-10">Empresa</span>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 text-xs font-medium mb-1 block">E-mail</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                          </div>
                          <Input 
                            placeholder="seu@email.com" 
                            type="email" 
                            disabled={isRegistering}
                            className="pl-10 pr-3 py-2.5 rounded-xl h-11 text-sm bg-gray-50/50 border border-gray-200/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 w-full transition-all duration-200 hover:bg-white/60"
                            onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {registerForm.watch("role") === "patient" ? (
                    <FormField
                      control={registerForm.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-xs font-medium mb-1 block">CPF</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                              </div>
                              <Input 
                                placeholder="000.000.000-00" 
                                disabled={isRegistering}
                                className="pl-10 pr-3 py-2.5 rounded-xl h-11 text-sm bg-gray-50/50 border border-gray-200/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 w-full transition-all duration-200 hover:bg-white/60"
                                onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                                onChange={(e) => {
                                // Formata o CPF enquanto o usuário digita
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 11) {
                                  // Formata conforme o usuário digita
                                  if (value.length > 9) {
                                    value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
                                  } else if (value.length > 6) {
                                    value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
                                  } else if (value.length > 3) {
                                    value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
                                  }
                                  field.onChange(value);
                                }
                              }}
                              value={field.value || ''}
                            />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  ) : registerForm.watch("role") === "doctor" ? (
                    <div className="space-y-2">
                      <FormLabel className="text-gray-700 text-xs font-medium mb-1 block">Registro no CRM</FormLabel>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <svg className="h-4 w-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 pl-10">
                            <Select 
                              defaultValue={estadoSelecionado}
                              onValueChange={setEstadoSelecionado}
                            >
                              <SelectTrigger className="rounded-xl h-11 text-sm bg-gray-50/50 border border-gray-200/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 hover:bg-white/60">
                                <SelectValue placeholder="UF" />
                              </SelectTrigger>
                              <SelectContent>
                                {estadosBrasileiros.map((estado) => (
                                  <SelectItem key={estado.value} value={estado.value}>
                                    {estado.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <FormField
                              control={registerForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      placeholder="12345" 
                                      disabled={isRegistering}
                                      className="rounded-xl h-11 text-sm bg-gray-50/50 border border-gray-200/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 w-full transition-all duration-200 hover:bg-white/60"
                                      onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                                      {...field}
                                      value={field.value?.replace(/CRM[A-Z]{2}/i, '') || ''}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        field.onChange(`CRM${estadoSelecionado}${value}`);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : registerForm.watch("role") === "partner" ? (
                    <FormField
                      control={registerForm.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-xs font-medium mb-1 block">CNPJ da Empresa</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <Input 
                                placeholder="00.000.000/0000-00" 
                                disabled={isRegistering}
                                className="pl-10 pr-3 py-2.5 rounded-xl h-11 text-sm bg-gray-50/50 border border-gray-200/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 w-full transition-all duration-200 hover:bg-white/60"
                                onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                                onChange={(e) => {
                                  // Formatação do CNPJ
                                  let value = e.target.value.replace(/\D/g, '');
                                  if (value.length <= 14) {
                                    // Formata conforme o usuário digita
                                    if (value.length > 12) {
                                      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
                                    } else if (value.length > 8) {
                                      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
                                    } else if (value.length > 5) {
                                      value = value.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
                                    } else if (value.length > 2) {
                                      value = value.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
                                    }
                                    field.onChange(value);
                                  }
                                }}
                                value={field.value || ''}
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 text-sm">Nome de usuário</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="seunome123" 
                              disabled={isRegistering}
                              className="rounded-lg h-10 text-sm backdrop-blur-sm bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-blue-500 shadow-md"
                              onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 text-xs font-medium mb-1 block">Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-4 w-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                            <Input 
                              placeholder="••••••••" 
                              type="password" 
                              disabled={isRegistering}
                              className="pl-10 pr-3 py-2.5 rounded-xl h-11 text-sm bg-gray-50/50 border border-gray-200/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 w-full transition-all duration-200 hover:bg-white/60"
                              onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={registerForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 text-xs font-medium mb-1 block">Nome completo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <Input 
                            placeholder="Seu Nome Completo" 
                            disabled={isRegistering}
                            className="pl-10 pr-3 py-2.5 rounded-xl h-11 text-sm bg-gray-50/50 border border-gray-200/50 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 w-full transition-all duration-200 hover:bg-white/60"
                            onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                
                {/* Seção de Aceitação de Termos */}
                <div className="border-t border-gray-100/50 pt-4 mt-4">
                  <h3 className="text-xs font-medium text-gray-700 mb-3">
                    Documentos Legais (Obrigatório)
                  </h3>
                  
                  <FormField
                    control={registerForm.control}
                    name="acceptAllTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isRegistering}
                            onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-xs text-gray-600">
                            Li e aceito todos os documentos legais:{" "}
                            <Dialog>
                              <DialogTrigger asChild>
                                <button
                                  type="button"
                                  className="text-blue-600 hover:underline font-medium text-xs"
                                >
                                  Termos de Uso
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
                                <DialogHeader>
                                  <DialogTitle>Termos de Uso - CN Vidas</DialogTitle>
                                  <DialogDescription>
                                    Documento completo. Para consultar posteriormente, acesse <a href="/ajuda?tab=docs" className="text-blue-600 hover:underline">Central de Documentos</a>
                                  </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="h-[60vh] w-full">
                                  <TermsOfUseContent />
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                            ,{" "}
                            <Dialog>
                              <DialogTrigger asChild>
                                <button
                                  type="button"
                                  className="text-blue-600 hover:underline font-medium text-xs"
                                >
                                  Política de Privacidade
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
                                <DialogHeader>
                                  <DialogTitle>Política de Privacidade - CN Vidas</DialogTitle>
                                  <DialogDescription>
                                    Documento completo. Para consultar posteriormente, acesse <a href="/ajuda?tab=docs" className="text-blue-600 hover:underline">Central de Documentos</a>
                                  </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="h-[60vh] w-full">
                                  <PrivacyPolicyContent />
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                            {registerForm.watch("role") === "patient" && (
                              <>
                                ,{" "}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button
                                      type="button"
                                      className="text-blue-600 hover:underline font-medium text-xs"
                                    >
                                      Contrato de Adesão dos Planos
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
                                    <DialogHeader>
                                      <DialogTitle>Contrato de Adesão - Planos CN Vidas</DialogTitle>
                                      <DialogDescription>
                                        <span className="text-red-600 font-semibold">IMPORTANTE:</span> Leia todo o contrato, especialmente as cláusulas sobre carência e coberturas
                                      </DialogDescription>
                                    </DialogHeader>
                                    <ScrollArea className="h-[60vh] w-full">
                                      <AdhesionContractContent />
                                    </ScrollArea>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                            {registerForm.watch("role") === "partner" && (
                              <>
                                ,{" "}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button
                                      type="button"
                                      className="text-blue-600 hover:underline font-medium text-xs"
                                    >
                                      Contrato de Parceria
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
                                    <DialogHeader>
                                      <DialogTitle>Contrato de Parceria - CN Vidas</DialogTitle>
                                      <DialogDescription>
                                        Parceria gratuita e sem exclusividade. Para consultar posteriormente, acesse <a href="/ajuda?tab=docs" className="text-blue-600 hover:underline">Central de Documentos</a>
                                      </DialogDescription>
                                    </DialogHeader>
                                    <ScrollArea className="h-[60vh] w-full">
                                      <PartnerContractContent />
                                    </ScrollArea>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                            {registerForm.watch("role") === "doctor" && (
                              <>
                                ,{" "}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button
                                      type="button"
                                      className="text-blue-600 hover:underline font-medium text-xs"
                                    >
                                      Contrato de Prestação de Serviços Médicos
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
                                    <DialogHeader>
                                      <DialogTitle>Contrato de Prestação de Serviços Médicos</DialogTitle>
                                      <DialogDescription>
                                        Termos para médicos prestadores de telemedicina. Para consultar posteriormente, acesse <a href="/ajuda?tab=docs" className="text-blue-600 hover:underline">Central de Documentos</a>
                                      </DialogDescription>
                                    </DialogHeader>
                                    <ScrollArea className="h-[60vh] w-full">
                                      <DoctorContractContent />
                                    </ScrollArea>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                            {(registerForm.watch("role") === "patient" || registerForm.watch("role") === "doctor") && (
                              <>
                                {" "}
                                e{" "}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button
                                      type="button"
                                      className="text-blue-600 hover:underline font-medium text-xs"
                                    >
                                      Política de Gravação de Teleconsultas
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
                                    <DialogHeader>
                                      <DialogTitle>Política de Gravação de Teleconsultas</DialogTitle>
                                    </DialogHeader>
                                    <ScrollArea className="h-[60vh] w-full">
                                      <div className="text-sm space-y-4 pr-4">
                                        <p>
                                          Ao aceitar esta política, você autoriza que as teleconsultas sejam gravadas automaticamente 
                                          para fins de documentação médica e geração de prontuários com inteligência artificial.
                                        </p>
                                        
                                        <h3 className="font-semibold mt-4">Importante:</h3>
                                        <ul className="list-disc pl-6 space-y-1">
                                          <li>As gravações são processadas com total segurança e sigilo médico</li>
                                          <li>O áudio é transcrito e deletado após o processamento</li>
                                          <li>Apenas médico e paciente têm acesso ao prontuário gerado</li>
                                          <li>Você pode desativar esta opção a qualquer momento nas configurações</li>
                                          <li>A gravação só ocorre quando ambas as partes (médico e paciente) autorizam</li>
                                        </ul>
                                        
                                        <h3 className="font-semibold mt-4">Segurança e Privacidade</h3>
                                        <ul className="list-disc pl-6 space-y-1">
                                          <li>Conformidade com a LGPD</li>
                                          <li>Servidores seguros no Brasil</li>
                                          <li>Acesso restrito e auditado</li>
                                          <li>Criptografia de ponta a ponta</li>
                                          <li>Exclusão automática do áudio após processamento</li>
                                        </ul>
                                      </div>
                                    </ScrollArea>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group mt-4"
                  style={{ transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)' }}
                  disabled={isRegistering}
                >
                  <div className="absolute inset-0 -top-[200%] bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:top-0" />
                  <span className="relative flex items-center justify-center">
                    {isRegistering ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      <>
                        Criar conta
                        <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                </Button>
                
                <p className="text-center text-[10px] text-gray-400 mt-3 font-light">
                  Ao criar uma conta, você confirma ter lido e aceito todos os documentos legais acima.
                </p>
              </form>
            </Form>
            </div>
          </div>
        </TabsContent>
        
        </Tabs>
      </div>
    </AuthLayout>
  );
};

export default AuthPage;