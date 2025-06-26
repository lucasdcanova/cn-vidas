import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, CreditCard, User, Users, AlertCircle, Receipt, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import Breadcrumb from "@/components/ui/breadcrumb";
import { getSubscriptionPlans, getUserSubscription, getUserProfile } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import CheckoutModal from "@/components/checkout/checkout-modal";
import { getPlanName } from "@/components/shared/plan-indicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isNativeApp } from "@/utils/platform";
import { apiRequest } from "@/lib/queryClient";
import PaymentMethods from "@/components/payment/payment-methods";
import TransactionHistory from "@/components/payment/transaction-history";

// Definição do tipo de plano de assinatura
interface SubscriptionPlan {
  id: number;
  name: "free" | "basic" | "premium" | "basic_family" | "premium_family" | "ultra" | "ultra_family";
  displayName: string;
  price: number;
  emergencyConsultations: string;
  specialistDiscount: number;
  insuranceCoverage: boolean;
  features: string[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserSubscription {
  id: number;
  userId: number;
  planId: number;
  status: string;
  startDate: string;
  endDate: string;
  cancelAtPeriodEnd?: boolean;
  plan?: SubscriptionPlan;
}

const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showFamilyPlans, setShowFamilyPlans] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{id: number, name: string, price: string} | null>(null);
  const [activeTab, setActiveTab] = useState("plans");

  // Buscar planos de assinatura disponíveis
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/subscription/plans"],
    // Usando queryFn padrão que tem melhor tratamento de erros
  });

  // Buscar assinatura atual do usuário
  const { data: userSubscription, isLoading: subscriptionLoading, refetch: refetchSubscription, error: subscriptionError } = useQuery({
    queryKey: ["/api/subscription/current"],
    // Usando queryFn padrão que tem melhor tratamento de erros
    enabled: !!user?.id,
    // **CORREÇÃO: Configurações para evitar cache desatualizado**
    staleTime: 0, // Sempre considera os dados como 'stale' (desatualizados)
    cacheTime: 0, // Sem cache - sempre buscar dados frescos
    refetchOnWindowFocus: true, // Recarregar quando a janela ganha foco
    refetchOnMount: 'always', // Sempre recarregar ao montar o componente
    refetchInterval: false, // Não recarregar automaticamente
    retry: 1, // Tentar apenas uma vez em caso de erro
  });

  // Buscar dados do perfil (apenas para iOS)
  const { data: profileData } = useQuery({
    queryKey: ['/api/users/profile'],
    queryFn: getUserProfile,
    enabled: !!user && isNativeApp()
  });

  // Buscar métodos de pagamento (apenas para iOS)
  const paymentMethodsQuery = useQuery({
    queryKey: ['/api/subscription/payment-methods'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subscription/payment-methods');
      if (!response.ok) {
        throw new Error('Falha ao buscar métodos de pagamento');
      }
      return response.json();
    },
    enabled: !!user && isNativeApp()
  });

  const paymentMethodsData = paymentMethodsQuery.data;

  // Buscar histórico de transações (apenas para iOS)
  const transactionHistoryQuery = useQuery({
    queryKey: ['/api/payment-history'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/payment-history');
      if (!response.ok) {
        throw new Error('Falha ao buscar histórico de pagamentos');
      }
      return response.json();
    },
    enabled: !!user && isNativeApp()
  });

  const transactionData = transactionHistoryQuery.data;

  // Forçar refetch quando o componente monta ou quando o usuário muda
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Forçando refetch da assinatura atual...');
      refetchSubscription();
    }
  }, [user?.id, refetchSubscription]);

  // Helper para extrair dados da assinatura corretamente
  const getSubscriptionData = (data: any) => {
    // A API retorna os dados em data.subscription
    if (data?.subscription) {
      return data.subscription;
    }
    // Fallback para caso os dados venham diretamente
    return data;
  };

  // Extrair dados da assinatura atual
  const currentSubscription = userSubscription ? getSubscriptionData(userSubscription) : null;

  // Debug: Log subscription data
  useEffect(() => {
    if (userSubscription) {
      console.log('📊 Dados da assinatura recebidos (raw):', userSubscription);
      console.log('📊 Dados da assinatura processados:', {
        subscription: currentSubscription,
        planName: currentSubscription?.plan?.name,
        planDisplayName: currentSubscription?.plan?.displayName,
        status: currentSubscription?.status
      });
    }
  }, [userSubscription, currentSubscription]);

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

  // Estado de erro
  if (!plans || plans.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os planos de assinatura. 
              {subscriptionError && (
                <span className="block mt-2 text-sm text-muted-foreground">
                  Erro: {subscriptionError instanceof Error ? subscriptionError.message : 'Erro desconhecido'}
                </span>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  window.location.reload();
                }}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  // Função para fechar o modal de checkout
  const handleCloseCheckout = () => {
    setCheckoutOpen(false);
    setSelectedPlan(null);
  };

  // Conteúdo dos planos
  const PlansContent = () => (
    <>
      {/* Informações da assinatura atual */}
      {currentSubscription && currentSubscription.status !== "inactive" && (
        <Card className="mb-8 mt-4 overflow-hidden border-2 border-primary shadow-lg">
          <CardHeader className={`
            ${(() => {
              const subscription = userSubscription.subscription || userSubscription;
              const planName = subscription.plan?.name;
              if (planName === 'premium' || planName === 'premium_family') return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
              if (planName === 'basic' || planName === 'basic_family') return 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white';
              if (planName === 'ultra' || planName === 'ultra_family') return 'bg-gradient-to-r from-violet-500 to-purple-600 text-white';
              return 'bg-gradient-to-r from-gray-100 to-gray-200';
            })()}
          `}>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Sua assinatura atual
              </CardTitle>
              <Badge className="bg-white/20 text-white border-white/30">
                {currentSubscription.status === "active" ? "Ativa" : 
                 currentSubscription.status === "trialing" ? "Em teste" : 
                 currentSubscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {currentSubscription.plan && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {getPlanName(currentSubscription.plan.name)}
                    </h3>
                    <p className="text-muted-foreground">
                      {currentSubscription.plan.features.join(" • ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">
                      R$ {(currentSubscription.plan.price / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">/mês</p>
                  </div>
                </div>
                
                {currentSubscription.cancelAtPeriodEnd && (
                  <Alert variant="warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Cancelamento pendente</AlertTitle>
                    <AlertDescription>
                      Sua assinatura será cancelada em {new Date(currentSubscription.endDate).toLocaleDateString('pt-BR')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filtro de tipo de plano */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Planos disponíveis</h2>
        <div className="flex items-center space-x-2">
          <Switch
            id="family-plans"
            checked={showFamilyPlans}
            onCheckedChange={setShowFamilyPlans}
          />
          <Label htmlFor="family-plans" className="cursor-pointer">
            Mostrar planos familiares
          </Label>
        </div>
      </div>

      {/* Grid de planos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans
          .filter(plan => {
            const isFamilyPlan = plan.name.includes("family");
            return showFamilyPlans ? isFamilyPlan : !isFamilyPlan;
          })
          .map((plan) => {
            const isCurrentPlan = currentSubscription?.plan?.id === plan.id;
            const isDowngrade = currentSubscription?.plan && 
                              currentSubscription.plan.price > plan.price;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  isCurrentPlan ? 'ring-2 ring-primary' : ''
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm font-medium rounded-bl-lg">
                    Plano Atual
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{getPlanName(plan.name)}</span>
                    {plan.name.includes("family") && (
                      <Users className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold">
                      R$ {(plan.price / 100).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  {isCurrentPlan ? (
                    <Button 
                      className="w-full" 
                      disabled
                      variant="secondary"
                    >
                      Plano Atual
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        setSelectedPlan({
                          id: plan.id,
                          name: plan.name,
                          price: (plan.price / 100).toFixed(2)
                        });
                        setCheckoutOpen(true);
                      }}
                      variant={isDowngrade ? "outline" : "default"}
                    >
                      {isDowngrade ? "Fazer Downgrade" : "Assinar Plano"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
      </div>
    </>
  );

  // Conteúdo de pagamentos (apenas iOS)
  const PaymentsContent = () => (
    <div className="space-y-6">
      {/* Card de Informações de Assinatura */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <CardTitle>Informações de Assinatura</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
              <p className="text-2xl font-bold">
                {profileData?.subscriptionPlan 
                  ? profileData.subscriptionPlan.replace(/_/g, ' ').toUpperCase() 
                  : "Sem Plano"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${
                  profileData?.subscriptionStatus === 'active' 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                }`} />
                <p className={`text-lg font-semibold ${
                  profileData?.subscriptionStatus === 'active' 
                    ? 'text-green-600' 
                    : 'text-gray-600'
                }`}>
                  {profileData?.subscriptionStatus === 'active' ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Métodos de Pagamento */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Métodos de Pagamento</h2>
          </div>
        </div>
        <p className="text-muted-foreground mb-6">
          Gerencie seus métodos de pagamento para assinaturas e consultas
        </p>
        
        <PaymentMethods 
          paymentMethods={paymentMethodsData?.paymentMethods || []}
          onUpdate={() => {
            paymentMethodsQuery.refetch();
          }}
        />
      </div>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>
            Visualize todas as suas transações de assinaturas e consultas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionHistory 
            transactions={transactionData?.transactions || []}
            isLoading={transactionHistoryQuery.isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
  
  return (
    <DashboardLayout title="Gerenciar Planos">
      <div className="max-w-7xl mx-auto">
        {/* Mostrar tabs apenas no iOS */}
        {isNativeApp() ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="plans">Planos</TabsTrigger>
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="plans" className="mt-6">
              <PlansContent />
            </TabsContent>
            
            <TabsContent value="payments" className="mt-6">
              <PaymentsContent />
            </TabsContent>
          </Tabs>
        ) : (
          <PlansContent />
        )}
      </div>

      {/* Modal de checkout */}
      {selectedPlan && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={handleCloseCheckout}
          selectedPlan={selectedPlan}
          onSuccess={() => {
            handleCloseCheckout();
            refetchSubscription();
            toast({
              title: "Sucesso!",
              description: "Sua assinatura foi atualizada com sucesso.",
            });
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default SubscriptionPage;