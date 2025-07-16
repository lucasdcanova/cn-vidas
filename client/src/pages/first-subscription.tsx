import React, { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, CreditCard, User, Users, AlertTriangle, Star, Crown, Heart, Shield, Zap, CheckCircle, CheckCircle2, Sparkles, Info, Phone, Calendar, MapPin, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getSubscriptionPlans, getUserSubscription, updateUserSubscription } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import CheckoutModal from "@/components/checkout/checkout-modal-fix";
import cnvidasLogo from "@/assets/cnvidas-logo-transparent.png";
import { getPlanName } from "@/components/shared/plan-indicator";
import { motion, AnimatePresence } from "framer-motion";
import { IOSScrollView } from '@/components/shared/IOSScrollView';
import { isIOS } from '@/utils/platform';
import { StatusBar } from '@capacitor/status-bar';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddressForm } from "@/components/forms/address-form";

// Definição do tipo de plano de assinatura
interface SubscriptionPlan {
  id: number;
  name: "free" | "basic" | "premium" | "basic_family" | "premium_family" | "ultra" | "ultra_family";
  displayName?: string;
  description?: string;
  price: number;
  features: string[];
  emergencyConsultations: string;
  specialistDiscount: number;
  insuranceCoverage: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserSubscription {
  id: number;
  userId: number;
  planId: number;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan?: SubscriptionPlan;
}

const FirstSubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showFamilyPlans, setShowFamilyPlans] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{id: number, name: string, price: string} | null>(null);
  const [hasAttemptedLeave, setHasAttemptedLeave] = useState(false);
  const [showActivationAnimation, setShowActivationAnimation] = useState(false);
  const [activationStatus, setActivationStatus] = useState<'checking' | 'activating' | 'activated'>('checking');
  const scrollViewRef = useRef<HTMLDivElement>(null);
  
  // Estado para controlar as etapas do onboarding
  const [step, setStep] = useState(1);
  const [selectedPlanData, setSelectedPlanData] = useState<SubscriptionPlan | null>(null);
  const [personalData, setPersonalData] = useState({
    phone: '',
    birthDate: '',
    cpf: '',
    gender: ''
  });
  const [addressData, setAddressData] = useState({
    zipcode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  console.log("🔍 FirstSubscriptionPage - Location atual:", location);
  console.log("🔧 TESTE: FirstSubscriptionPage carregada às", new Date().toLocaleTimeString());
  
  // Configure status bar for iOS
  useEffect(() => {
    if (isIOS()) {
      StatusBar.setBackgroundColor({ color: '#ffffff' });
      StatusBar.setStyle({ style: 'DARK' });
    }
    
    return () => {
      if (isIOS()) {
        StatusBar.setBackgroundColor({ color: '#ffffff' });
      }
    };
  }, []);

  // Buscar planos de assinatura disponíveis
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription/plans"],
    queryFn: getSubscriptionPlans,
  });

  // Buscar assinatura atual do usuário
  const { data: userSubscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/subscription/current"],
    queryFn: getUserSubscription,
    enabled: !!user?.id,
  });

  // Verificar se o usuário tem perfil de paciente e se já tem plano ativo
  useEffect(() => {
    if (user && user.role !== 'patient') {
      // Se não for paciente, redirecionar para o dashboard
      setLocation('/dashboard');
      return;
    }
    
    // Se já tem assinatura ativa, redirecionar para o dashboard
    if (userSubscription && userSubscription.status === 'active') {
      console.log("🔄 FirstSubscription - Usuário já tem plano ativo, redirecionando para dashboard");
      toast({
        title: "Você já possui um plano ativo",
        description: "Redirecionando para o dashboard...",
      });
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1000);
    }
  }, [user, userSubscription, setLocation, toast]);

  // REMOVIDO: Redirecionamento automático que estava causando loop infinito
  // O dashboard é quem deve gerenciar os redirecionamentos de assinatura

  // Remover o impedimento que bloqueia o usuário de sair da página
  // Isso estava causando problemas no redirecionamento para o dashboard
  useEffect(() => {
    console.log("Status da assinatura:", userSubscription?.status);
    // Não adicionar nenhum bloqueio de navegação
  }, [userSubscription]);

  const isLoading = plansLoading || subscriptionLoading;

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    console.log("🔧 Selecionando plano:", plan.name);
    
    // Salvar o plano selecionado
    setSelectedPlanData(plan);
    
    // Se for o plano gratuito, avançar para a próxima etapa
    if (plan.name === 'free') {
      setStep(2);
      // Scroll para o topo
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTop = 0;
      }
      return;
    }
    
    // Para planos pagos, usar o modal de checkout
    toast({
      title: "Preparando checkout...",
      description: "O formulário de pagamento será exibido em instantes.",
    });
    
    setSelectedPlan({
      id: plan.id, 
      name: plan.displayName || plan.name,
      price: `R$ ${(plan.price / 100).toFixed(2)}`
    });
    setCheckoutOpen(true);
  };
  
  // Função para agrupar e filtrar os planos com base na seleção (individual/familiar)
  const getFilteredAndGroupedPlans = () => {
    if (!plans) return [];
    
    // Primeiro, vamos agrupar os planos por tipo (básico, premium, ultra)
    const planGroups: Record<string, SubscriptionPlan[]> = {};
    
    plans.forEach((plan: SubscriptionPlan) => {
      // Extrair o tipo base do plano (remover _family se existir)
      const baseType = plan.name.replace('_family', '');
      if (!planGroups[baseType]) {
        planGroups[baseType] = [];
      }
      planGroups[baseType].push(plan);
    });
    
    // Para cada grupo, selecionar o plano individual ou familiar com base no toggle
    const result: SubscriptionPlan[] = [];
    Object.entries(planGroups).forEach(([type, planGroup]) => {
      if (planGroup.length > 0) {
        const plan = planGroup.find(p => (p.name.includes('_family')) === showFamilyPlans) || planGroup[0];
        result.push(plan);
      }
    });
    
    // Definir a ordem personalizada dos planos: básico, premium, ultra e gratuito por último
    const planOrder = {
      'basic': 1,
      'premium': 2,
      'ultra': 3,
      'free': 4
    };
    
    return result.sort((a, b) => {
      const baseTypeA = a.name.replace('_family', '');
      const baseTypeB = b.name.replace('_family', '');
      
      return (planOrder[baseTypeA as keyof typeof planOrder] || 99) - 
             (planOrder[baseTypeB as keyof typeof planOrder] || 99);
    });
  };

  // Função para fechar o modal de checkout
  const handleCloseCheckout = () => {
    setCheckoutOpen(false);
    setSelectedPlan(null);
  };

  const handlePlanSelected = () => {
    // O plano foi selecionado com sucesso - avançar para próxima etapa
    console.log("✅ Plano pago selecionado, avançando para etapa 2...");
    setStep(2);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTop = 0;
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const response = await apiRequest('POST', '/api/subscription/check-pending-payment', {});
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'active') {
          // Pagamento confirmado!
          setActivationStatus('activated');
          
          // Invalidar queries para atualizar dados
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/check"] });
          await queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
          
          // Definir flag para evitar redirecionamento do dashboard
          sessionStorage.setItem('subscription-just-activated', 'true');
          
          // Aguardar para mostrar animação completa
          setTimeout(() => {
            window.location.replace('/dashboard');
          }, 3000);
        } else {
          // Continuar verificando
          setTimeout(() => checkPaymentStatus(), 2000);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      // Tentar novamente
      setTimeout(() => checkPaymentStatus(), 3000);
    }
  };

  // Função para completar o onboarding
  const handleCompleteOnboarding = async () => {
    try {
      console.log("🔄 Completando onboarding...");
      
      // Se for plano gratuito, ativar o plano
      if (selectedPlanData?.name === 'free') {
        const response = await apiRequest("POST", "/api/subscription/activate-free", {});
        
        if (response.ok) {
          const data = await response.json();
          console.log("✅ Plano gratuito ativado com sucesso!", data);
          
          if (data.subscription) {
            queryClient.setQueryData(["/api/subscription/current"], data.subscription);
            await queryClient.invalidateQueries({ queryKey: ["/api/auth/check"] });
            await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          }
        }
      }
      
      // Atualizar dados do usuário (telefone, data de nascimento, etc)
      const profileResponse = await apiRequest("PUT", "/api/users/profile", {
        phone: personalData.phone,
        birthDate: personalData.birthDate,
        cpf: personalData.cpf,
        gender: personalData.gender,
        ...addressData,
        address: addressData.street, // Mapear street para address
      });
      
      if (!profileResponse.ok) {
        throw new Error("Falha ao atualizar perfil");
      }
      
      toast({
        title: "Bem-vindo ao CN Vidas!",
        description: "Seu cadastro foi concluído com sucesso.",
      });
      
      sessionStorage.setItem('subscription-just-activated', 'true');
      
      // Mostrar animação de ativação
      setShowActivationAnimation(true);
      setActivationStatus('activated');
      
      setTimeout(() => {
        window.location.replace("/dashboard");
      }, 3000);
      
    } catch (error) {
      console.error("❌ Erro ao completar onboarding:", error);
      toast({
        title: "Erro",
        description: "Não foi possível completar o cadastro. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Função para lidar com tentativa de sair sem selecionar um plano
  const handleTryLeave = () => {
    setHasAttemptedLeave(true);
    toast({
      title: "Atenção",
      description: "Por favor, selecione um plano antes de continuar.",
      variant: "destructive",
    });
    
    setTimeout(() => setHasAttemptedLeave(false), 3000);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-center text-muted-foreground">Carregando planos disponíveis...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Animação de Ativação */}
      <AnimatePresence>
        {showActivationAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <Card className="p-8 md:p-12 max-w-md mx-auto backdrop-blur-sm bg-white/95 shadow-2xl">
                <div className="text-center space-y-6">
                  {/* Logo animado */}
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="flex justify-center mb-8"
                  >
                    <img 
                      src={cnvidasLogo} 
                      alt="CN Vidas" 
                      className="h-24 w-auto"
                    />
                  </motion.div>

                  {/* Status de ativação */}
                  {activationStatus !== 'activated' ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="inline-block"
                      >
                        <Loader2 className="h-16 w-16 text-primary" />
                      </motion.div>

                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                          Ativando seu plano
                        </h2>
                        <p className="text-gray-600">
                          Estamos confirmando seu pagamento e preparando tudo para você...
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Sucesso */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 20,
                        }}
                        className="relative"
                      >
                        <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                      >
                        <h2 className="text-2xl font-bold text-gray-900">
                          Plano ativado com sucesso!
                        </h2>
                        <p className="text-gray-600">
                          Bem-vindo ao CN Vidas! Você agora tem acesso a todos os benefícios do seu plano.
                        </p>
                        
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                          className="text-sm text-gray-500 pt-2"
                        >
                          Redirecionando para o dashboard...
                        </motion.p>
                      </motion.div>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conteúdo original da página */}
      <IOSScrollView ref={scrollViewRef} className="flex flex-col min-h-screen bg-gray-50">
        {/* Header animado similar aos outros onboardings */}
        <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 px-4 py-8 animate-fadeInSimple">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <img 
                src={cnvidasLogo} 
                alt="CN Vidas" 
                className="h-16 md:h-20 w-auto"
              />
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'} rounded-full flex items-center justify-center text-sm font-semibold`}>
                  1
                </div>
                <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                <div className={`w-8 h-8 ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'} rounded-full flex items-center justify-center text-sm font-semibold`}>
                  2
                </div>
                <div className={`w-16 h-1 ${step >= 3 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                <div className={`w-8 h-8 ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'} rounded-full flex items-center justify-center text-sm font-semibold`}>
                  3
                </div>
              </div>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-2">
              {step === 1 ? 'Escolha seu Plano' : step === 2 ? 'Informações Pessoais' : 'Endereço'}
            </h1>
            <p className="text-center text-gray-600">
              {step === 1 ? 'Selecione o melhor plano para suas necessidades' : 
               step === 2 ? 'Complete seus dados pessoais' : 
               'Informe seu endereço completo'}
            </p>
          </div>
        </div>
        
        <main className="flex-1 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Card informativo sobre planos */}
          <Card className="mb-6 backdrop-blur-sm bg-white/90 shadow-lg animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Por que escolher o CN Vidas?</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Acesso imediato a consultas médicas, telemedicina 24/7, rede credenciada e muito mais.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {hasAttemptedLeave && (
            <div className="mb-6 bg-destructive/10 border border-destructive p-4 rounded-lg flex items-center gap-3 animate-slide-up">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-destructive font-medium">É necessário selecionar um plano para continuar.</p>
            </div>
          )}
          
          {/* Toggle para planos individuais/familiares */}
          <Card className="mb-8 sticky top-0 z-10 backdrop-blur-sm bg-white/95 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <Label htmlFor="family-toggle" className={!showFamilyPlans ? "font-semibold text-base text-primary" : "text-base text-gray-600"}>Individual</Label>
                </div>
                <Switch 
                  id="family-toggle" 
                  checked={showFamilyPlans} 
                  onCheckedChange={setShowFamilyPlans} 
                  className="data-[state=checked]:bg-primary"
                />
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <Label htmlFor="family-toggle" className={showFamilyPlans ? "font-semibold text-base text-primary" : "text-base text-gray-600"}>Familiar</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de planos - scroll horizontal no mobile */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {plans && getFilteredAndGroupedPlans()
              .map((plan: SubscriptionPlan) => (
              <Card 
                key={plan.id} 
                className={`overflow-hidden transform transition-all duration-300 hover:shadow-xl animate-slide-up ${
                  plan.name === 'ultra' || plan.name === 'ultra_family' 
                    ? 'md:hover:-translate-y-2 border-violet-400 shadow-lg shadow-violet-300 relative ring-2 ring-violet-400/70 md:scale-105' : 
                  plan.name === 'premium' || plan.name === 'premium_family' 
                    ? 'md:hover:-translate-y-1 border-amber-300' :
                  plan.name === 'basic' || plan.name === 'basic_family' 
                    ? 'md:hover:-translate-y-1 border-emerald-300' :
                  plan.name === 'free'
                    ? 'md:hover:-translate-y-1 border-gray-300 bg-gray-50' : ''
                }`}
                style={{
                  animationDelay: `${plans?.indexOf(plan) * 100}ms`
                }}
              >
                <CardHeader className={`${
                  plan.name === 'ultra' || plan.name === 'ultra_family'
                    ? 'bg-purple-600 text-white' 
                  : plan.name === 'premium' || plan.name === 'premium_family'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' 
                  : plan.name === 'basic' || plan.name === 'basic_family'
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' 
                  : plan.name === 'free'
                    ? 'bg-gray-100 text-gray-800'
                  : ''
                }`}>
                  <CardTitle className={
                    plan.name === 'ultra' || plan.name === 'premium' || plan.name === 'basic' ||
                    plan.name === 'ultra_family' || plan.name === 'premium_family' || plan.name === 'basic_family'
                      ? 'text-white flex items-center text-2xl' 
                      : 'flex items-center text-2xl'
                  }>
                    {plan.displayName || getPlanName(plan.name as any)}
                  </CardTitle>
                  <CardDescription className={
                    plan.name === 'ultra' || plan.name === 'premium' || plan.name === 'basic' ||
                    plan.name === 'ultra_family' || plan.name === 'premium_family' || plan.name === 'basic_family'
                      ? 'text-white/90' 
                      : ''
                  }>
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="mb-6 text-center">
                    <span className="text-2xl md:text-3xl font-bold block">
                      {plan.price ? `R$ ${(plan.price / 100).toFixed(2)}` : "Gratuito"}
                    </span>
                    {plan.price > 0 && <span className="text-sm text-muted-foreground">/mês</span>}
                  </div>

                  <ul className="space-y-2 md:space-y-3 my-4 md:my-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 md:h-5 md:w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                        <span className="text-sm md:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className={`w-full ${
                      plan.name === 'ultra' || plan.name === 'ultra_family'
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : ''
                    }`} 
                    onClick={() => handleSelectPlan(plan)}
                  >
                    Escolher Este Plano
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          


          {/* Informação adicional */}
          <Card className="mt-8 backdrop-blur-sm bg-white/90 shadow-md animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Info className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Informação Importante</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Você deve selecionar um plano para continuar usando a plataforma CN Vidas. Este é um passo obrigatório 
                    para novos usuários pacientes.
                  </p>
                  <p className="text-sm text-gray-600">
                    Dúvidas? Entre em contato: <a href="mailto:suporte@cnvidas.com.br" className="text-primary hover:underline font-medium">suporte@cnvidas.com.br</a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Bottom padding for iOS */}
          <div className="h-8 md:h-12"></div>
        </div>
      </main>

      {/* Modal de Checkout */}
      {selectedPlan && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={handleCloseCheckout}
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          planPrice={selectedPlan.price}
          onSuccess={handlePlanSelected}
        />
      )}
    </IOSScrollView>
    </>
  );
};

export default FirstSubscriptionPage;