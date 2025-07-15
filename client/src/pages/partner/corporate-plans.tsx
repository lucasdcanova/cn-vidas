import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import logoImg from "@/assets/cnvidas-logo-transparent.png";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Building2, Users, AlertCircle, CreditCard, ChevronRight, BadgePercent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import CheckoutModal from "@/components/checkout/checkout-modal";
import { isNativeApp } from "@/utils/platform";
import { apiRequest } from "@/lib/queryClient";

interface CorporatePlanTier {
  id: number;
  minEmployees: number;
  maxEmployees: number | null;
  pricePerEmployee: number;
  tierLabel: string;
}

interface CorporatePlan {
  planType: string;
  displayName: string;
  tiers: CorporatePlanTier[];
}

interface CorporateSubscription {
  id: number;
  planType: string;
  employeeTier: string;
  monthlyPricePerEmployee: string;
  billingPeriod: string;
  discountPercentage: string;
  status: string;
  currentBillingDate: string;
  nextBillingDate: string;
}

const CorporatePlansPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Estados para seleção
  const [selectedPlanType, setSelectedPlanType] = useState<string>("basic_corp");
  const [selectedEmployeeCount, setSelectedEmployeeCount] = useState<number>(10);
  const [billingPeriod, setBillingPeriod] = useState<string>("monthly");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{id: number, name: string, price: string} | null>(null);

  // Buscar planos corporativos disponíveis
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/corporate/plans"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/corporate/plans');
      if (!response.ok) throw new Error('Falha ao carregar planos');
      return response.json();
    }
  });

  // Buscar assinatura corporativa atual
  const { data: currentSubscription, isLoading: subscriptionLoading, refetch: refetchSubscription } = useQuery({
    queryKey: ["/api/corporate/subscription/current"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/corporate/subscription/current');
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Falha ao carregar assinatura');
      }
      return response.json();
    },
    staleTime: 0,
    cacheTime: 0,
  });

  // Função para calcular o preço com base nas seleções
  const calculatePrice = () => {
    if (!plans || !selectedPlanType) return 0;
    
    const plan = plans.find((p: CorporatePlan) => p.planType === selectedPlanType);
    if (!plan) return 0;
    
    const tier = plan.tiers.find((t: CorporatePlanTier) => {
      if (t.maxEmployees === null) {
        return selectedEmployeeCount >= t.minEmployees;
      }
      return selectedEmployeeCount >= t.minEmployees && selectedEmployeeCount <= t.maxEmployees;
    });
    
    if (!tier) return 0;
    
    let basePrice = tier.pricePerEmployee * selectedEmployeeCount;
    
    // Aplicar desconto baseado no período
    let discount = 0;
    if (billingPeriod === 'semiannual') discount = 5;
    if (billingPeriod === 'annual') discount = 8;
    
    return basePrice - (basePrice * discount / 100);
  };

  // Função para obter o tier de funcionários
  const getEmployeeTier = (count: number) => {
    if (count <= 50) return '5-50';
    if (count <= 200) return '51-200';
    return '201+';
  };

  // Função para obter as características do plano
  const getPlanFeatures = (planType: string) => {
    switch (planType) {
      case 'basic_corp':
        return [
          'Consultas ilimitadas',
          'R$ 300/dia de seguro internação',
          '30% desconto em especialistas',
          'Atendimento de emergência',
          'Prontuário eletrônico',
          'Relatórios mensais de uso'
        ];
      case 'premium_corp':
        return [
          'Consultas ilimitadas',
          'R$ 300/dia de seguro internação',
          '50% desconto em especialistas',
          'Atendimento de emergência 24h',
          'Prontuário eletrônico completo',
          'Relatórios detalhados',
          'Suporte prioritário',
          'Logo personalizado'
        ];
      case 'ultra_corp':
        return [
          'Consultas ilimitadas premium',
          'R$ 500/dia de seguro internação',
          '70% desconto em especialistas',
          'Atendimento VIP 24h',
          'Prontuário eletrônico avançado',
          'Relatórios personalizados',
          'Suporte dedicado',
          'White-label completo',
          'Dashboard personalizado'
        ];
      default:
        return [];
    }
  };

  // Função para obter as cores do plano
  const getPlanColorClass = (planType: string) => {
    switch (planType) {
      case 'basic_corp':
        return 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-300';
      case 'premium_corp':
        return 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300';
      case 'ultra_corp':
        return 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 hover:border-violet-300';
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getPlanHeaderClass = (planType: string) => {
    switch (planType) {
      case 'basic_corp':
        return 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white';
      case 'premium_corp':
        return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
      case 'ultra_corp':
        return 'bg-gradient-to-r from-violet-500 to-purple-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  // Estado de carregamento
  if (plansLoading || subscriptionLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando informações...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isIOS = isNativeApp();
  const finalPrice = calculatePrice();

  return (
    <DashboardLayout title="Planos Corporativos">
      <div className="max-w-7xl mx-auto">
        {/* Banner informativo */}
        <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              <Building2 className="h-5 w-5" />
              <span>Transforme sua empresa com</span>
              <img 
                src={logoImg} 
                alt="CNVidas" 
                className="h-7 inline-block"
              />
              <span>Corporativo</span>
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Ofereça benefícios de saúde completos para seus colaboradores com planos personalizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Preços por volume</p>
                  <p className="text-sm text-muted-foreground">Quanto mais colaboradores, menor o custo por vida</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Gestão simplificada</p>
                  <p className="text-sm text-muted-foreground">Convide e gerencie colaboradores facilmente</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Relatórios detalhados</p>
                  <p className="text-sm text-muted-foreground">Acompanhe o uso e economize com saúde</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Configurador de plano */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configure seu plano corporativo</CardTitle>
            <CardDescription>
              Personalize o plano de acordo com as necessidades da sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção do número de colaboradores */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                Quantos colaboradores sua empresa possui?
              </Label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="500"
                  value={selectedEmployeeCount}
                  onChange={(e) => setSelectedEmployeeCount(parseInt(e.target.value))}
                  className="flex-1"
                />
                <div className="text-center min-w-[100px]">
                  <p className="text-2xl font-bold">{selectedEmployeeCount}</p>
                  <p className="text-sm text-muted-foreground">colaboradores</p>
                </div>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>5 vidas</span>
                <span>500+ vidas</span>
              </div>
            </div>

            {/* Seleção do período de cobrança */}
            <div>
              <Label className="text-base font-medium mb-3 block">
                Período de cobrança
              </Label>
              <RadioGroup value={billingPeriod} onValueChange={setBillingPeriod}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="relative flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <div>
                        <p className="font-medium">Mensal</p>
                        <p className="text-sm text-muted-foreground">Sem desconto</p>
                      </div>
                    </div>
                  </label>
                  <label className="relative flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="semiannual" id="semiannual" />
                      <div>
                        <p className="font-medium">Semestral</p>
                        <p className="text-sm text-green-600 font-medium">5% desconto</p>
                      </div>
                    </div>
                    <Badge className="absolute top-2 right-2 bg-green-100 text-green-700">
                      Economize 5%
                    </Badge>
                  </label>
                  <label className="relative flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="annual" id="annual" />
                      <div>
                        <p className="font-medium">Anual</p>
                        <p className="text-sm text-green-600 font-medium">8% desconto</p>
                      </div>
                    </div>
                    <Badge className="absolute top-2 right-2 bg-green-100 text-green-700">
                      Maior economia
                    </Badge>
                  </label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Grid de planos */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6">Escolha o plano ideal para sua empresa</h2>
          <div className={`grid ${isIOS ? 'gap-5' : 'gap-4 md:gap-6'} grid-cols-1 md:grid-cols-3`}>
            {plans && plans.map((plan: CorporatePlan) => {
              const isCurrentPlan = currentSubscription?.planType === plan.planType;
              const features = getPlanFeatures(plan.planType);
              const tier = plan.tiers.find((t: CorporatePlanTier) => {
                if (t.maxEmployees === null) {
                  return selectedEmployeeCount >= t.minEmployees;
                }
                return selectedEmployeeCount >= t.minEmployees && selectedEmployeeCount <= t.maxEmployees;
              });
              
              const monthlyPricePerEmployee = tier ? tier.pricePerEmployee : 0;
              let discount = 0;
              if (billingPeriod === 'semiannual') discount = 5;
              if (billingPeriod === 'annual') discount = 8;
              
              const discountedPrice = monthlyPricePerEmployee - (monthlyPricePerEmployee * discount / 100);
              const totalMonthlyPrice = discountedPrice * selectedEmployeeCount;
              
              return (
                <Card 
                  key={plan.planType} 
                  className={`relative overflow-hidden transition-all hover:shadow-lg border-2 ${
                    isCurrentPlan ? 'ring-2 ring-primary' : ''
                  } ${
                    selectedPlanType === plan.planType ? 'ring-2 ring-blue-500' : ''
                  } ${getPlanColorClass(plan.planType)}`}
                  onClick={() => setSelectedPlanType(plan.planType)}
                >
                  {isCurrentPlan && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-1 text-xs md:text-sm font-medium rounded-bl-lg z-10">
                      Plano Atual
                    </div>
                  )}
                  
                  <CardHeader className={`${getPlanHeaderClass(plan.planType)} ${isIOS ? 'p-5' : 'p-4 md:p-6'}`}>
                    <CardTitle className={`flex items-center justify-between ${isIOS ? 'text-[17px]' : 'text-base md:text-lg'}`}>
                      <span>{plan.displayName}</span>
                      <Building2 className={`${isIOS ? 'h-4 w-4' : 'h-4 w-4 md:h-5 md:w-5'} opacity-80`} />
                    </CardTitle>
                    <CardDescription className="text-white/90 mt-2">
                      <div>
                        <span className={`${isIOS ? 'text-[16px]' : 'text-base'} font-medium text-white`}>
                          R$ {discountedPrice.toFixed(2)}
                        </span>
                        <span className={`${isIOS ? 'text-[12px]' : 'text-sm'}`}>/colaborador/mês</span>
                      </div>
                      <div className="mt-1">
                        <span className={`${isIOS ? 'text-[20px]' : 'text-xl'} font-bold text-white`}>
                          Total: R$ {totalMonthlyPrice.toFixed(2)}
                        </span>
                        <span className={`${isIOS ? 'text-[12px]' : 'text-sm'}`}>/mês</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className={`${isIOS ? 'p-5' : 'p-4 md:p-6'}`}>
                    <ul className={`${isIOS ? 'space-y-4' : 'space-y-3'}`}>
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className={`${isIOS ? 'text-[13px] leading-[1.6]' : 'text-xs md:text-sm'} text-gray-700`}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter className={`${isIOS ? 'p-5 pt-3' : 'p-4 md:p-6 pt-2'}`}>
                    <Button 
                      className={`w-full ${isIOS ? 'text-[15px] h-11' : 'text-sm md:text-base'} ${
                        selectedPlanType === plan.planType ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      variant={selectedPlanType === plan.planType ? "default" : "outline"}
                    >
                      {selectedPlanType === plan.planType ? "Selecionado" : "Selecionar"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Resumo e botão de contratação */}
        <Card className="sticky bottom-4 border-2 shadow-lg bg-white/95 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground">Plano selecionado</p>
                <p className="text-xl font-bold">
                  {plans?.find((p: CorporatePlan) => p.planType === selectedPlanType)?.displayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedEmployeeCount} colaboradores • {getEmployeeTier(selectedEmployeeCount)} vidas • 
                  {billingPeriod === 'monthly' ? ' Mensal' : billingPeriod === 'semiannual' ? ' Semestral' : ' Anual'}
                </p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-sm text-muted-foreground">Total mensal</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {finalPrice.toFixed(2)}
                </p>
                {billingPeriod !== 'monthly' && (
                  <p className="text-sm text-green-600">
                    Economizando {billingPeriod === 'semiannual' ? '5%' : '8%'}
                  </p>
                )}
              </div>
              <Button 
                size="lg" 
                className="w-full md:w-auto"
                onClick={() => {
                  setSelectedPlan({
                    id: 0, // Será usado apenas para o modal
                    name: plans?.find((p: CorporatePlan) => p.planType === selectedPlanType)?.displayName || '',
                    price: `R$ ${finalPrice.toFixed(2).replace('.', ',')}`
                  });
                  setCheckoutOpen(true);
                }}
              >
                Contratar Plano Corporativo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de checkout */}
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
          isCorporate={true}
          corporateData={{
            planType: selectedPlanType,
            employeeCount: selectedEmployeeCount,
            billingPeriod: billingPeriod
          }}
          onSuccess={() => {
            setCheckoutOpen(false);
            setSelectedPlan(null);
            refetchSubscription();
            toast({
              title: "Sucesso!",
              description: "Plano corporativo contratado com sucesso. Você já pode convidar seus colaboradores.",
            });
            // Redirecionar para a página de colaboradores
            setLocation('/partner/collaborators');
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default CorporatePlansPage;