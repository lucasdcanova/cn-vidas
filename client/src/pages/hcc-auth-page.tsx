import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIOSKeyboard } from '@/hooks/use-ios-keyboard';
import { useHaptic } from '@/hooks/use-haptic';
import { cn } from '@/lib/utils';

// Esquema simplificado (mesmo estilo do HSJ, mas reduzido para evitar duplicação massiva)
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha mínima de 6 caracteres')
});

const registerSchema = z.object({
  fullName: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha mínima de 6 caracteres'),
  cpf: z.string().optional(),
  acceptAllTerms: z.boolean().refine(v => v, 'É necessário aceitar os termos')
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const HCCAuthPage: React.FC = () => {
  const { loginMutation, registerMutation } = useAuth();
  const haptic = useHaptic();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const emailLoginRef = useRef<HTMLInputElement>(null);
  const passwordLoginRef = useRef<HTMLInputElement>(null);
  const { isKeyboardVisible } = useIOSKeyboard();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const loginForm = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const registerForm = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema), defaultValues: { fullName: '', email: '', password: '', cpf: '', acceptAllTerms: false } });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await loginMutation.mutateAsync({ email: data.email, password: data.password });
      localStorage.setItem('loginSource', 'hcc');
  await haptic.success();
    } catch (e: any) {
      const msg = e?.message || 'Erro ao fazer login';
      setLoginError(msg);
      toast({ title: 'Erro no login', description: msg, variant: 'destructive' });
  await haptic.error();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsRegistering(true);
    setRegisterError(null);
    try {
      await registerMutation.mutateAsync({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: 'patient',
        cpf: data.cpf,
        acceptTerms: data.acceptAllTerms,
        acceptPrivacy: data.acceptAllTerms,
        acceptRecording: data.acceptAllTerms
      } as any);
      localStorage.setItem('loginSource', 'hcc');
  await haptic.success();
    } catch (e: any) {
      const msg = e?.message || 'Erro ao cadastrar';
      setRegisterError(msg);
      toast({ title: 'Erro no cadastro', description: msg, variant: 'destructive' });
  await haptic.error();
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a4d63] via-[#0d6f5f] to-[#19a37d] relative flex flex-col">
      {/* fundo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0a4d63]/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#19a37d]/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col max-w-xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="pb-6 text-center">
          <div className="flex items-center justify-center gap-4">
            <img src="/hcc-logo.png" alt="Hospital de Caridade de Crissiumal" className="h-16 w-auto drop-shadow-md" />
            <div className="h-12 w-px bg-white/30"></div>
            <img src="/images/logo.png" alt="CN Vidas" className="h-12 w-auto drop-shadow" />
          </div>
          <p className="text-center text-xs text-white/80 mt-4 font-light tracking-wide">
            Portal exclusivo para pacientes do Hospital de Caridade de Crissiumal
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v: any) => { setActiveTab(v); setLoginError(null); setRegisterError(null); }} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 p-0.5 bg-white/15 backdrop-blur rounded-lg shadow">
            <TabsTrigger value="login" className="rounded-md py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-[#0d6f5f] data-[state=active]:shadow">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="rounded-md py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-[#0d6f5f] data-[state=active]:shadow">
              Cadastro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="flex-1 mt-4">
            <div className="relative p-5 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#19a37d]/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#0a4d63]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="relative z-10">
                <h1 className="text-lg font-bold text-[#0a4d63] text-center">Bem-vindo de volta</h1>
                <p className="text-[#0a4d63]/70 mt-0.5 text-xs font-light text-center">Acesse sua conta para continuar</p>
                {loginError && (
                  <Alert className="mt-3 mb-2 border-red-200 bg-red-50">
                    <AlertDescription className="text-xs text-red-700">{loginError}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3 mt-3">
                  <div>
                    <label className="text-[#0a4d63] text-xs font-medium mb-1.5 block">E-mail</label>
                    <input {...loginForm.register('email')} placeholder="seu@email.com" className={cn('w-full rounded-md border bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19a37d]')} ref={emailLoginRef} />
                    {loginForm.formState.errors.email && <p className="text-xs text-red-600 mt-1">{loginForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="text-[#0a4d63] text-xs font-medium mb-1.5 block">Senha</label>
                    <input type="password" {...loginForm.register('password')} ref={passwordLoginRef} className="w-full rounded-md border bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19a37d]" />
                    {loginForm.formState.errors.password && <p className="text-xs text-red-600 mt-1">{loginForm.formState.errors.password.message}</p>}
                  </div>
                  <button disabled={isLoggingIn} className="w-full py-2 rounded-md text-sm font-medium bg-gradient-to-r from-[#0a4d63] via-[#0d6f5f] to-[#19a37d] text-white shadow hover:opacity-95 transition disabled:opacity-50">{isLoggingIn ? 'Entrando...' : 'Entrar'}</button>
                </form>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="register" className="flex-1 mt-4 overflow-y-auto">
            <div className="relative p-5 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#19a37d]/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#0a4d63]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="relative z-10">
                <h2 className="text-lg font-bold text-[#0a4d63] text-center">Crie sua conta</h2>
                <p className="text-[#0a4d63]/70 mt-0.5 text-xs font-light text-center">Acesso exclusivo para pacientes HCC</p>
                {registerError && (
                  <Alert className="mt-3 mb-2 border-red-200 bg-red-50">
                    <AlertDescription className="text-xs text-red-700">{registerError}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3 mt-3">
                  <div>
                    <label className="text-[#0a4d63] text-xs font-medium mb-1.5 block">Nome completo</label>
                    <input {...registerForm.register('fullName')} className="w-full rounded-md border bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19a37d]" />
                    {registerForm.formState.errors.fullName && <p className="text-xs text-red-600 mt-1">{registerForm.formState.errors.fullName.message}</p>}
                  </div>
                  <div>
                    <label className="text-[#0a4d63] text-xs font-medium mb-1.5 block">E-mail</label>
                    <input {...registerForm.register('email')} className="w-full rounded-md border bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19a37d]" />
                    {registerForm.formState.errors.email && <p className="text-xs text-red-600 mt-1">{registerForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="text-[#0a4d63] text-xs font-medium mb-1.5 block">Senha</label>
                    <input type="password" {...registerForm.register('password')} className="w-full rounded-md border bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19a37d]" />
                    {registerForm.formState.errors.password && <p className="text-xs text-red-600 mt-1">{registerForm.formState.errors.password.message}</p>}
                  </div>
                  <div>
                    <label className="text-[#0a4d63] text-xs font-medium mb-1.5 block">CPF (opcional)</label>
                    <input {...registerForm.register('cpf')} className="w-full rounded-md border bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#19a37d]" />
                  </div>
                  <div className="flex items-start gap-2">
                    <input type="checkbox" {...registerForm.register('acceptAllTerms')} className="mt-1" />
                    <span className="text-[11px] leading-snug text-[#0a4d63]/80">Aceito os termos de uso, política de privacidade e autorização de gravação.</span>
                  </div>
                  {registerForm.formState.errors.acceptAllTerms && <p className="text-xs text-red-600 -mt-1">{registerForm.formState.errors.acceptAllTerms.message}</p>}
                  <button disabled={isRegistering} className="w-full py-2 rounded-md text-sm font-medium bg-gradient-to-r from-[#0a4d63] via-[#0d6f5f] to-[#19a37d] text-white shadow hover:opacity-95 transition disabled:opacity-50">{isRegistering ? 'Criando conta...' : 'Criar conta'}</button>
                </form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <p className="text-[10px] text-white/60 mt-6 text-center">© {new Date().getFullYear()} CN Vidas • HCC</p>
      </div>
    </div>
  );
};

export default HCCAuthPage;
