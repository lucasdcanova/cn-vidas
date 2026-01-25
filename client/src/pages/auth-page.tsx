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


// Lazy load do Stripe quando necessário
const loadStripe = () => {
  if (typeof window !== 'undefined' && !(window as any).Stripe) {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
};

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

  // Estilos customizados para inputs no padrão Triunfo - otimizado para mobile
  // font-size 16px é crítico para evitar zoom automático no iOS
  const inputBaseClass = "triunfo-input pl-11 pr-3 py-3 rounded-xl h-12 text-[16px] bg-gradient-to-b from-white to-slate-50/80 border-2 border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 focus:bg-white w-full transition-all duration-200 placeholder:text-slate-400/70 shadow-sm active:scale-[0.99]";

  const inputIconClass = "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none";

  return (
    <AuthLayout activeTab={activeTab}>
      <div
        ref={scrollContainerRef}
        className={`flex flex-col max-w-lg mx-auto w-full ${activeTab === 'register' ? 'flex-1 overflow-y-auto' : ''}`}
        style={{
          padding: isKeyboardVisible
            ? (activeTab === 'register' ? 'clamp(8px, 2vw, 12px) clamp(12px, 4vw, 20px)' : 'clamp(12px, 3vw, 16px) clamp(12px, 4vw, 20px)')
            : 'clamp(16px, 4vw, 24px) clamp(12px, 4vw, 20px)',
          maxHeight: isKeyboardVisible ? '100%' : 'auto',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          // Para login, o conteúdo se ajusta automaticamente
          ...(activeTab === 'login' ? {
            overflow: 'visible',
            height: 'auto'
          } : {})
        }}>
        <Tabs defaultValue="register" value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          setLoginError(null);
          setRegisterError(null);
        }} className={`w-full flex flex-col ${activeTab === 'register' ? 'flex-1' : ''}`}>
          {/* Tabs refinadas com estilo Triunfo - mobile optimized */}
          <TabsList
            className="grid w-full grid-cols-2 p-1 rounded-xl border shadow-sm shrink-0"
            style={{
              background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
              borderColor: "rgba(13, 148, 136, 0.12)",
              marginBottom: "clamp(12px, 3vw, 20px)"
            }}
          >
            <TabsTrigger
              value="login"
              className="rounded-lg font-semibold transition-all duration-200 data-[state=active]:shadow-md flex items-center justify-center gap-1.5"
              style={{
                color: activeTab === 'login' ? '#0f766e' : '#64748b',
                background: activeTab === 'login' ? 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)' : 'transparent',
                boxShadow: activeTab === 'login' ? '0 2px 8px rgba(13, 148, 136, 0.12)' : 'none',
                minHeight: '44px',
                fontSize: 'clamp(13px, 3.5vw, 14px)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Entrar</span>
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="rounded-lg font-semibold transition-all duration-200 data-[state=active]:shadow-md flex items-center justify-center gap-1.5"
              style={{
                color: activeTab === 'register' ? '#0f766e' : '#64748b',
                background: activeTab === 'register' ? 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)' : 'transparent',
                boxShadow: activeTab === 'register' ? '0 2px 8px rgba(13, 148, 136, 0.12)' : 'none',
                minHeight: '44px',
                fontSize: 'clamp(13px, 3.5vw, 14px)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Cadastrar</span>
            </TabsTrigger>
          </TabsList>

        {/* ========== LOGIN TAB ========== */}
        <TabsContent value="login">
          <div className="relative">
            {/* Header do Login - compacto em mobile */}
            <div className="text-center" style={{ marginBottom: "clamp(12px, 3vw, 20px)" }}>
              <h1
                className="triunfo-title"
                style={{ color: "#042f2e", fontSize: "clamp(20px, 5vw, 26px)" }}
              >
                Bem-vindo de volta
              </h1>
              <p
                className="font-medium"
                style={{ color: "#64748b", lineHeight: "1.5", marginTop: "clamp(4px, 1vw, 8px)", fontSize: "clamp(13px, 3.5vw, 14px)" }}
              >
                Acesse sua conta para continuar
              </p>
            </div>

            {/* Mensagem de erro do login */}
            {loginError && (
              <div
                className="rounded-xl flex items-start gap-2"
                style={{
                  background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  padding: "clamp(10px, 2.5vw, 14px)",
                  marginBottom: "clamp(12px, 3vw, 18px)"
                }}
              >
                <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium leading-snug" style={{ fontSize: "clamp(12px, 3vw, 13px)" }}>
                  {loginError}
                </p>
              </div>
            )}

            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 3vw, 18px)" }}
                onKeyDown={(e) => {
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
                      <FormLabel
                        className="font-semibold block"
                        style={{ color: "#134e4a", fontSize: "clamp(13px, 3.5vw, 14px)", marginBottom: "clamp(4px, 1vw, 8px)" }}
                      >
                        E-mail
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className={inputIconClass}>
                            <svg className="h-5 w-5" style={{ color: "#0d9488" }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                          </div>
                          <input
                            ref={emailLoginRef}
                            placeholder="seu@email.com"
                            type="email"
                            disabled={isLoggingIn}
                            className={inputBaseClass}
                            style={{ color: "#134e4a" }}
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
                      <FormMessage className="text-xs mt-2 text-red-600 font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center" style={{ marginBottom: "clamp(4px, 1vw, 8px)" }}>
                        <FormLabel
                          className="font-semibold"
                          style={{ color: "#134e4a", fontSize: "clamp(13px, 3.5vw, 14px)" }}
                        >
                          Senha
                        </FormLabel>
                        <a
                          href="/esqueci-senha"
                          className="font-semibold transition-colors active:opacity-70"
                          style={{ color: "#0d9488", fontSize: "clamp(11px, 3vw, 12px)" }}
                        >
                          Esqueceu?
                        </a>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <div className={inputIconClass}>
                            <svg className="h-5 w-5" style={{ color: "#0d9488" }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <input
                            ref={passwordLoginRef}
                            placeholder="••••••••"
                            type="password"
                            disabled={isLoggingIn}
                            className={inputBaseClass}
                            style={{ color: "#134e4a" }}
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
                      <FormMessage className="text-xs mt-2 text-red-600 font-medium" />
                    </FormItem>
                  )}
                />

                {/* Checkboxes refinados - touch friendly */}
                <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 2vw, 12px)", paddingTop: "clamp(4px, 1vw, 8px)" }}>
                  <label className="flex items-center cursor-pointer group active:opacity-80" style={{ minHeight: "44px" }}>
                    <div className="relative shrink-0">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div
                        className="w-5 h-5 rounded-md border-2 peer-checked:border-teal-600 peer-checked:bg-teal-600 transition-all duration-200"
                        style={{ borderColor: "#cbd5e1" }}
                      ></div>
                      <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span
                      className="ml-2.5 font-medium"
                      style={{ color: "#475569", fontSize: "clamp(13px, 3.5vw, 14px)" }}
                    >
                      Lembrar-me
                    </span>
                  </label>

                  {isBiometricAvailable && (
                    <label className="flex items-center cursor-pointer group active:opacity-80" style={{ minHeight: "44px" }}>
                      <div className="relative shrink-0">
                        <input
                          id="enable-biometric"
                          name="enable-biometric"
                          type="checkbox"
                          checked={enableBiometric}
                          onChange={(e) => setEnableBiometric(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className="w-5 h-5 rounded-md border-2 peer-checked:border-teal-600 peer-checked:bg-teal-600 transition-all duration-200"
                          style={{ borderColor: "#cbd5e1" }}
                        ></div>
                        <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span
                        className="ml-2.5 font-medium"
                        style={{ color: "#475569", fontSize: "clamp(13px, 3.5vw, 14px)" }}
                      >
                        Login com {biometryTypeName}
                      </span>
                    </label>
                  )}
                </div>

                {/* Botão de Login - mobile optimized */}
                <Button
                  type="submit"
                  className="w-full rounded-xl font-bold transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    color: "#ffffff",
                    boxShadow: "0 8px 32px rgba(13, 148, 136, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                    height: "clamp(48px, 12vw, 56px)",
                    marginTop: "clamp(12px, 3vw, 20px)",
                    fontSize: "clamp(15px, 4vw, 16px)"
                  }}
                  disabled={isLoggingIn || isAuthenticating}
                >
                  <span className="flex items-center justify-center">
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        Entrar
                        <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </span>
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>

        {/* ========== REGISTER TAB ========== */}
        <TabsContent value="register">
          <div className="relative">
            {/* Header do Cadastro - compacto em mobile */}
            <div className="text-center" style={{ marginBottom: "clamp(10px, 2.5vw, 16px)" }}>
              <h1
                className="triunfo-title"
                style={{ color: "#042f2e", fontSize: "clamp(18px, 4.5vw, 24px)" }}
              >
                Crie sua conta
              </h1>
              <p
                className="font-medium"
                style={{ color: "#64748b", lineHeight: "1.4", marginTop: "clamp(2px, 0.5vw, 6px)", fontSize: "clamp(12px, 3vw, 13px)" }}
              >
                Preencha os dados para criar seu perfil
              </p>
            </div>

            {/* Mensagem de erro do registro */}
            {registerError && (
              <div
                className="rounded-xl flex items-start gap-2"
                style={{
                  background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  padding: "clamp(8px, 2vw, 12px)",
                  marginBottom: "clamp(10px, 2.5vw, 16px)"
                }}
              >
                <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium leading-snug" style={{ fontSize: "clamp(11px, 2.8vw, 12px)" }}>
                  {registerError}
                </p>
              </div>
            )}

            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 2.5vw, 16px)" }}>
                {/* Seletor de Tipo de Perfil - mobile optimized */}
                <FormField
                  control={registerForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="font-semibold block"
                        style={{ color: "#134e4a", fontSize: "clamp(12px, 3vw, 13px)", marginBottom: "clamp(6px, 1.5vw, 10px)" }}
                      >
                        Tipo de perfil
                      </FormLabel>
                      <div
                        className="grid grid-cols-3"
                        style={{ gap: "clamp(6px, 1.5vw, 10px)" }}
                        onFocus={(e) => activeTab === 'register' && scrollToCenter(e.currentTarget)}
                        tabIndex={0}
                      >
                        {/* Paciente */}
                        <div
                          className="relative flex flex-col items-center rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.97]"
                          style={{
                            padding: "clamp(10px, 2.5vw, 14px) clamp(6px, 1.5vw, 10px)",
                            border: field.value === "patient" ? "2px solid #0d9488" : "2px solid #e2e8f0",
                            background: field.value === "patient"
                              ? "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)"
                              : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                            boxShadow: field.value === "patient"
                              ? "0 3px 12px rgba(13, 148, 136, 0.18)"
                              : "0 1px 4px rgba(0, 0, 0, 0.04)",
                            minHeight: "clamp(70px, 18vw, 90px)"
                          }}
                          onClick={() => field.onChange("patient")}
                        >
                          <div
                            className="rounded-lg flex items-center justify-center"
                            style={{
                              width: "clamp(32px, 8vw, 40px)",
                              height: "clamp(32px, 8vw, 40px)",
                              marginBottom: "clamp(4px, 1vw, 8px)",
                              background: field.value === "patient"
                                ? "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)"
                                : "#f1f5f9"
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "clamp(16px, 4vw, 20px)", height: "clamp(16px, 4vw, 20px)" }} fill="none" viewBox="0 0 24 24" stroke={field.value === "patient" ? "#ffffff" : "#64748b"}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span
                            className="font-semibold"
                            style={{ color: field.value === "patient" ? "#0f766e" : "#64748b", fontSize: "clamp(10px, 2.5vw, 12px)" }}
                          >
                            Paciente
                          </span>
                        </div>

                        {/* Médico */}
                        <div
                          className="relative flex flex-col items-center rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.97]"
                          style={{
                            padding: "clamp(10px, 2.5vw, 14px) clamp(6px, 1.5vw, 10px)",
                            border: field.value === "doctor" ? "2px solid #0d9488" : "2px solid #e2e8f0",
                            background: field.value === "doctor"
                              ? "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)"
                              : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                            boxShadow: field.value === "doctor"
                              ? "0 3px 12px rgba(13, 148, 136, 0.18)"
                              : "0 1px 4px rgba(0, 0, 0, 0.04)",
                            minHeight: "clamp(70px, 18vw, 90px)"
                          }}
                          onClick={() => field.onChange("doctor")}
                        >
                          <div
                            className="rounded-lg flex items-center justify-center"
                            style={{
                              width: "clamp(32px, 8vw, 40px)",
                              height: "clamp(32px, 8vw, 40px)",
                              marginBottom: "clamp(4px, 1vw, 8px)",
                              background: field.value === "doctor"
                                ? "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)"
                                : "#f1f5f9"
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "clamp(16px, 4vw, 20px)", height: "clamp(16px, 4vw, 20px)" }} fill="none" viewBox="0 0 24 24" stroke={field.value === "doctor" ? "#ffffff" : "#64748b"}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          </div>
                          <span
                            className="font-semibold"
                            style={{ color: field.value === "doctor" ? "#0f766e" : "#64748b", fontSize: "clamp(10px, 2.5vw, 12px)" }}
                          >
                            Médico
                          </span>
                        </div>

                        {/* Empresa */}
                        <div
                          className="relative flex flex-col items-center rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.97]"
                          style={{
                            padding: "clamp(10px, 2.5vw, 14px) clamp(6px, 1.5vw, 10px)",
                            border: field.value === "partner" ? "2px solid #0d9488" : "2px solid #e2e8f0",
                            background: field.value === "partner"
                              ? "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)"
                              : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                            boxShadow: field.value === "partner"
                              ? "0 3px 12px rgba(13, 148, 136, 0.18)"
                              : "0 1px 4px rgba(0, 0, 0, 0.04)",
                            minHeight: "clamp(70px, 18vw, 90px)"
                          }}
                          onClick={() => field.onChange("partner")}
                        >
                          <div
                            className="rounded-lg flex items-center justify-center"
                            style={{
                              width: "clamp(32px, 8vw, 40px)",
                              height: "clamp(32px, 8vw, 40px)",
                              marginBottom: "clamp(4px, 1vw, 8px)",
                              background: field.value === "partner"
                                ? "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)"
                                : "#f1f5f9"
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "clamp(16px, 4vw, 20px)", height: "clamp(16px, 4vw, 20px)" }} fill="none" viewBox="0 0 24 24" stroke={field.value === "partner" ? "#ffffff" : "#64748b"}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <span
                            className="font-semibold"
                            style={{ color: field.value === "partner" ? "#0f766e" : "#64748b", fontSize: "clamp(10px, 2.5vw, 12px)" }}
                          >
                            Empresa
                          </span>
                        </div>
                      </div>
                      <FormMessage style={{ fontSize: "clamp(10px, 2.5vw, 11px)", marginTop: "clamp(4px, 1vw, 6px)" }} className="text-red-600 font-medium" />
                    </FormItem>
                  )}
                />

                {/* Campo de Email */}
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="font-semibold block"
                        style={{ color: "#134e4a", fontSize: "clamp(12px, 3vw, 13px)", marginBottom: "clamp(4px, 1vw, 6px)" }}
                      >
                        E-mail
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className={inputIconClass}>
                            <svg className="h-5 w-5" style={{ color: "#0d9488" }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                          </div>
                          <Input
                            placeholder="seu@email.com"
                            type="email"
                            disabled={isRegistering}
                            className={inputBaseClass}
                            style={{ color: "#134e4a" }}
                            onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs mt-2 text-red-600 font-medium" />
                    </FormItem>
                  )}
                />

                {/* Campos condicionais baseados no role - responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "clamp(10px, 2.5vw, 16px)" }}>
                  {registerForm.watch("role") === "patient" ? (
                    <FormField
                      control={registerForm.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel
                            className="font-semibold block"
                            style={{ color: "#134e4a", fontSize: "clamp(12px, 3vw, 13px)", marginBottom: "clamp(4px, 1vw, 6px)" }}
                          >
                            CPF
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className={inputIconClass}>
                                <svg className="h-5 w-5" style={{ color: "#0d9488" }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                              </div>
                              <Input
                                placeholder="000.000.000-00"
                                disabled={isRegistering}
                                className={inputBaseClass}
                                style={{ color: "#134e4a" }}
                                onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, '');
                                  if (value.length <= 11) {
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
                          <FormMessage className="text-xs mt-2 text-red-600 font-medium" />
                        </FormItem>
                      )}
                    />
                  ) : registerForm.watch("role") === "doctor" ? (
                    <div className="space-y-2">
                      <FormLabel
                        className="text-sm font-semibold mb-2 block"
                        style={{ color: "#134e4a" }}
                      >
                        Registro no CRM
                      </FormLabel>
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <Select
                            defaultValue={estadoSelecionado}
                            onValueChange={setEstadoSelecionado}
                          >
                            <SelectTrigger
                              className="rounded-2xl h-14 text-base border-2 focus:ring-4 focus:ring-teal-500/10 transition-all duration-300"
                              style={{
                                color: "#134e4a",
                                borderColor: "#e2e8f0",
                                background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)"
                              }}
                            >
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
                                    className="rounded-2xl h-14 text-base border-2 border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 bg-gradient-to-b from-white to-slate-50/80 transition-all duration-300"
                                    style={{ color: "#134e4a" }}
                                    onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                                    {...field}
                                    value={field.value?.replace(/CRM[A-Z]{2}/i, '') || ''}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/\D/g, '');
                                      field.onChange(`CRM${estadoSelecionado}${value}`);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs mt-2 text-red-600 font-medium" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ) : registerForm.watch("role") === "partner" ? (
                    <FormField
                      control={registerForm.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel
                            className="font-semibold block"
                            style={{ color: "#134e4a", fontSize: "clamp(12px, 3vw, 13px)", marginBottom: "clamp(4px, 1vw, 6px)" }}
                          >
                            CNPJ da Empresa
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className={inputIconClass}>
                                <svg className="h-5 w-5" style={{ color: "#0d9488" }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <Input
                                placeholder="00.000.000/0000-00"
                                disabled={isRegistering}
                                className={inputBaseClass}
                                style={{ color: "#134e4a" }}
                                onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, '');
                                  if (value.length <= 14) {
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
                          <FormMessage className="text-xs mt-2 text-red-600 font-medium" />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel
                            className="font-semibold block"
                            style={{ color: "#134e4a", fontSize: "clamp(12px, 3vw, 13px)", marginBottom: "clamp(4px, 1vw, 6px)" }}
                          >
                            Nome de usuário
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="seunome123"
                              disabled={isRegistering}
                              className="rounded-2xl h-14 text-base border-2 border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 bg-gradient-to-b from-white to-slate-50/80 transition-all duration-300"
                              style={{ color: "#134e4a" }}
                              onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs mt-2 text-red-600 font-medium" />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Campo de Senha */}
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className="text-sm font-semibold mb-2 block"
                          style={{ color: "#134e4a" }}
                        >
                          Senha
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className={inputIconClass}>
                              <svg className="h-5 w-5" style={{ color: "#0d9488" }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                            <Input
                              placeholder="••••••••"
                              type="password"
                              disabled={isRegistering}
                              className={inputBaseClass}
                              style={{ color: "#134e4a" }}
                              onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs mt-2 text-red-600 font-medium" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Campo de Nome Completo */}
                <FormField
                  control={registerForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-sm font-semibold mb-2 block"
                        style={{ color: "#134e4a" }}
                      >
                        Nome completo
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className={inputIconClass}>
                            <svg className="h-5 w-5" style={{ color: "#0d9488" }} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <Input
                            placeholder="Seu Nome Completo"
                            disabled={isRegistering}
                            className={inputBaseClass}
                            style={{ color: "#134e4a" }}
                            onFocus={(e) => activeTab === 'register' && scrollToCenter(e.target)}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs mt-2 text-red-600 font-medium" />
                    </FormItem>
                  )}
                />

                {/* Seção de Aceitação de Termos */}
                <div
                  className="pt-5 mt-5"
                  style={{ borderTop: "1px solid rgba(13, 148, 136, 0.1)" }}
                >
                  <h3
                    className="text-sm font-semibold mb-4"
                    style={{ color: "#134e4a" }}
                  >
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
                            className="mt-0.5 h-5 w-5 rounded-md border-2 border-slate-300 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel
                            className="text-sm leading-relaxed"
                            style={{ color: "#475569" }}
                          >
                            Li e aceito todos os documentos legais:{" "}
                            <Dialog>
                              <DialogTrigger asChild>
                                <button
                                  type="button"
                                  className="font-semibold text-xs hover:underline"
                                  style={{ color: "#0d9488" }}
                                >
                                  Termos de Uso
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
                                <DialogHeader>
                                  <DialogTitle>Termos de Uso - CN Vidas</DialogTitle>
                                  <DialogDescription>
                                    Documento completo. Para consultar posteriormente, acesse <a href="/ajuda?tab=docs" className="text-teal-700 hover:underline">Central de Documentos</a>
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
                                  className="font-semibold text-xs hover:underline"
                                  style={{ color: "#0d9488" }}
                                >
                                  Política de Privacidade
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
                                <DialogHeader>
                                  <DialogTitle>Política de Privacidade - CN Vidas</DialogTitle>
                                  <DialogDescription>
                                    Documento completo. Para consultar posteriormente, acesse <a href="/ajuda?tab=docs" className="text-teal-700 hover:underline">Central de Documentos</a>
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
                                      className="font-semibold text-xs hover:underline"
                                      style={{ color: "#0d9488" }}
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
                                      className="font-semibold text-xs hover:underline"
                                      style={{ color: "#0d9488" }}
                                    >
                                      Contrato de Parceria
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
                                    <DialogHeader>
                                      <DialogTitle>Contrato de Parceria - CN Vidas</DialogTitle>
                                      <DialogDescription>
                                        Parceria gratuita e sem exclusividade. Para consultar posteriormente, acesse <a href="/ajuda?tab=docs" className="text-teal-700 hover:underline">Central de Documentos</a>
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
                                      className="font-semibold text-xs hover:underline"
                                      style={{ color: "#0d9488" }}
                                    >
                                      Contrato de Prestação de Serviços Médicos
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[80vh] bg-white">
                                    <DialogHeader>
                                      <DialogTitle>Contrato de Prestação de Serviços Médicos</DialogTitle>
                                      <DialogDescription>
                                        Termos para médicos prestadores de telemedicina. Para consultar posteriormente, acesse <a href="/ajuda?tab=docs" className="text-teal-700 hover:underline">Central de Documentos</a>
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
                                      className="font-semibold text-xs hover:underline"
                                      style={{ color: "#0d9488" }}
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

                {/* Botão de Cadastro - mobile optimized */}
                <Button
                  type="submit"
                  className="w-full rounded-xl font-bold transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    color: "#ffffff",
                    boxShadow: "0 8px 32px rgba(13, 148, 136, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                    height: "clamp(48px, 12vw, 56px)",
                    marginTop: "clamp(8px, 2vw, 16px)",
                    fontSize: "clamp(15px, 4vw, 16px)"
                  }}
                  disabled={isRegistering}
                >
                  <span className="flex items-center justify-center">
                    {isRegistering ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      <>
                        Criar conta
                        <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                </Button>

                <p
                  className="text-center"
                  style={{ color: "#94a3b8", marginTop: "clamp(10px, 2.5vw, 16px)", fontSize: "clamp(10px, 2.5vw, 11px)", paddingBottom: "clamp(8px, 2vw, 16px)" }}
                >
                  Ao criar uma conta, você confirma ter lido e aceito todos os documentos legais acima.
                </p>
              </form>
            </Form>
          </div>
        </TabsContent>

        </Tabs>
      </div>
    </AuthLayout>
  );
};

export default AuthPage;
