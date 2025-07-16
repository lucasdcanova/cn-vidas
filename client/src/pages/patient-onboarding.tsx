import React, { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, CreditCard, User, Users, AlertTriangle, Star, Crown, Heart, Shield, Zap, CheckCircle, CheckCircle2, Sparkles, Info, Phone, Calendar, MapPin, ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getSubscriptionPlans, getUserSubscription, updateUserSubscription } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import CheckoutModal from "@/components/checkout/checkout-modal-fix";
import cnvidasLogo from "@/assets/cnvidas-logo-transparent.png";
import { getPlanName } from "@/components/shared/plan-indicator";
import { motion, AnimatePresence } from "framer-motion";
import { IOSScrollView } from '@/components/shared/IOSScrollView';
import { isIOS } from '@/utils/platform';
import { StatusBar } from '@capacitor/status-bar';
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

const PatientOnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<HTMLDivElement>(null);
  
  // Estado para controlar as etapas do onboarding
  const [step, setStep] = useState(1);
  const [showFamilyPlans, setShowFamilyPlans] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{id: number, name: string, price: string} | null>(null);
  const [selectedPlanData, setSelectedPlanData] = useState<SubscriptionPlan | null>(null);
  const [showActivationAnimation, setShowActivationAnimation] = useState(false);
  const [activationStatus, setActivationStatus] = useState<'checking' | 'activating' | 'activated'>('checking');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [personalData, setPersonalData] = useState({
    phone: user?.phone || '',
    birthDate: user?.birthDate || '',
    cpf: user?.cpf || '',
    gender: user?.gender || ''
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
      setLocation('/dashboard');
      return;
    }
    
    // Se já tem assinatura ativa, redirecionar para o dashboard
    if (userSubscription && userSubscription.status === 'active') {
      toast({
        title: "Você já possui um plano ativo",
        description: "Redirecionando para o dashboard...",
      });
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1000);
    }
  }, [user, userSubscription, setLocation, toast]);

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

  const handlePlanPurchased = () => {
    // Plano pago foi comprado com sucesso, avançar para próxima etapa
    setStep(2);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTop = 0;
    }
  };

  // Função para validar dados pessoais
  const validatePersonalData = () => {
    if (!personalData.phone || !personalData.birthDate || !personalData.gender) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Função para completar o onboarding
  const handleCompleteOnboarding = async () => {
    try {
      setIsSubmitting(true);
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
      
      // Atualizar dados do usuário
      const profileResponse = await apiRequest("PUT", "/api/users/profile", {
        phone: personalData.phone,
        birthDate: personalData.birthDate,
        cpf: personalData.cpf,
        gender: personalData.gender,
        ...addressData,
        address: addressData.street,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para agrupar e filtrar os planos
  const getFilteredAndGroupedPlans = () => {
    if (!plans) return [];
    
    const planGroups: Record<string, SubscriptionPlan[]> = {};
    
    plans.forEach((plan: SubscriptionPlan) => {
      const baseType = plan.name.replace('_family', '');
      if (!planGroups[baseType]) {
        planGroups[baseType] = [];
      }
      planGroups[baseType].push(plan);
    });
    
    const result: SubscriptionPlan[] = [];
    Object.entries(planGroups).forEach(([type, planGroup]) => {
      if (planGroup.length > 0) {
        const plan = planGroup.find(p => (p.name.includes('_family')) === showFamilyPlans) || planGroup[0];
        result.push(plan);
      }
    });
    
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

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-center text-muted-foreground">Carregando...</p>
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
                      Cadastro concluído!
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
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <IOSScrollView ref={scrollViewRef} className="flex flex-col min-h-screen bg-gray-50">
        {/* Header animado */}
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
          <div className="max-w-4xl mx-auto">
            {/* Etapa 1: Escolha do Plano */}
            {step === 1 && (
              <>
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
              </>
            )}
            
            {/* Etapa 2: Informações Pessoais */}
            {step === 2 && (
              <Card className="backdrop-blur-sm bg-white/90 shadow-lg animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>
                    Complete seus dados para personalizar sua experiência
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(11) 99999-9999"
                          className="pl-10"
                          value={personalData.phone}
                          onChange={(e) => setPersonalData({...personalData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Data de Nascimento</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="birthDate"
                          type="date"
                          className="pl-10"
                          value={personalData.birthDate}
                          onChange={(e) => setPersonalData({...personalData, birthDate: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gênero</Label>
                      <Select
                        value={personalData.gender}
                        onValueChange={(value) => setPersonalData({...personalData, gender: value})}
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                          <SelectItem value="prefer_not_say">Prefiro não dizer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                  <Button
                    onClick={() => {
                      if (validatePersonalData()) {
                        setStep(3);
                        if (scrollViewRef.current) {
                          scrollViewRef.current.scrollTop = 0;
                        }
                      }
                    }}
                    className="gap-2"
                  >
                    Próximo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {/* Etapa 3: Endereço */}
            {step === 3 && (
              <Card className="backdrop-blur-sm bg-white/90 shadow-lg animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Endereço
                  </CardTitle>
                  <CardDescription>
                    Informe seu endereço para entregas e emergências
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AddressForm
                    defaultValues={addressData}
                    onChange={(data) => {
                      console.log('Endereço atualizado:', data);
                      setAddressData(data);
                    }}
                    showSubmitButton={false}
                    standAlone={false}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="gap-2"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleCompleteOnboarding}
                    className="gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        Concluir Cadastro
                        <CheckCircle className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            {/* Bottom padding for iOS */}
            <div className="h-8 md:h-12"></div>
          </div>
        </main>

        {/* Modal de Checkout */}
        {selectedPlan && (
          <CheckoutModal
            isOpen={checkoutOpen}
            onClose={() => {
              setCheckoutOpen(false);
              setSelectedPlan(null);
            }}
            planId={selectedPlan.id}
            planName={selectedPlan.name}
            planPrice={selectedPlan.price}
            onSuccess={handlePlanPurchased}
          />
        )}
      </IOSScrollView>
    </>
  );
};

export default PatientOnboardingPage;