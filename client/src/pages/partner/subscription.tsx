import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CreditCard, 
  Users, 
  Building2, 
  TrendingUp, 
  Shield,
  Check,
  Star,
  AlertCircle,
  Zap,
  BarChart3,
  Headphones,
  Code,
  Calendar,
  Receipt, 
  DollarSign, 
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface Plan {
  id: number;
  planName: string;
  planType: string;
  monthlyPrice: string;
  maxCollaborators: number | null;
  features: any;
  commissionRate: string;
  prioritySupport: boolean;
  customBranding: boolean;
  analyticsAccess: boolean;
  apiAccess: boolean;
}

interface CurrentSubscription {
  subscription: {
    id: number;
    status: string;
    startDate: string;
    nextBillingDate: string | null;
  } | null;
  plan: Plan;
  activeCollaborators: number;
  isFreePlan: boolean;
}

interface BillingHistory {
  id: number;
  amount: string;
  paymentStatus: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
}

function CheckoutForm({ plan, onSuccess }: { plan: Plan; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    try {
      // Criar método de pagamento
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (createError) {
        throw new Error(createError.message);
      }

      // Enviar para o backend
      const response = await fetch('/api/partners/subscription/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethodId: paymentMethod.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      toast.success('Assinatura realizada com sucesso!');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div className="flex gap-2">
        <Button type="submit" disabled={!stripe || loading} className="flex-1">
          {loading ? 'Processando...' : `Assinar ${plan.planName}`}
        </Button>
      </div>
    </form>
  );
}

export default function PartnerSubscription() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeTab, setActiveTab] = useState("plans");

  useEffect(() => {
    if (user?.role !== 'partner') {
      setLocation('/');
      return;
    }
    
    fetchData();
  }, [user, setLocation]);

  const fetchData = async () => {
    try {
      // Buscar planos
      const plansResponse = await fetch('/api/partners/subscription/plans');
      const plansData = await plansResponse.json();
      setPlans(plansData);

      // Buscar assinatura atual
      const subResponse = await fetch('/api/partners/subscription/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const subData = await subResponse.json();
      setCurrentSubscription(subData);

      // Buscar histórico
      const historyResponse = await fetch('/api/partners/subscription/billing-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const historyData = await historyResponse.json();
      setBillingHistory(historyData);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    if (plan.planType === 'free') {
      // Plano gratuito não precisa de pagamento
      handleSubscribe(plan);
    } else {
      setSelectedPlan(plan);
      setShowCheckout(true);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    try {
      const response = await fetch('/api/partners/subscription/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId: plan.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao mudar plano');
      }

      toast.success('Plano alterado com sucesso!');
      fetchData();
      setShowCheckout(false);
      setSelectedPlan(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você voltará para o plano gratuito.')) {
      return;
    }

    try {
      const response = await fetch('/api/partners/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar assinatura');
      }

      toast.success('Assinatura cancelada com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao cancelar assinatura');
    }
  };

  const getPlanIcon = (planType: string) => {
    const icons = {
      free: Users,
      basic: Building2,
      premium: Star,
      ultra: Zap
    };
    return icons[planType as keyof typeof icons] || Users;
  };

  const getPlanColor = (planType: string) => {
    const colors = {
      free: 'text-gray-600',
      basic: 'text-blue-600',
      premium: 'text-purple-600',
      ultra: 'text-orange-600'
    };
    return colors[planType as keyof typeof colors] || 'text-gray-600';
  };

  const getPlanDisplayName = (planType: string): string => {
    const names = {
      free: 'Gratuito',
      basic: 'Básico',
      premium: 'Premium',
      ultra: 'Ultra'
    };
    return names[planType as keyof typeof names] || planType;
  };

  // Estado de carregamento
  if (loading) {
    return (
      <DashboardLayout title="Gerenciar Planos">
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
      <DashboardLayout title="Gerenciar Planos">
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os planos de assinatura.
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  // Conteúdo dos planos
  const PlansContent = () => (
    <>
      {/* Assinatura Atual */}
      {currentSubscription && currentSubscription.subscription && (
        <Card className={`mb-8 mt-4 overflow-hidden border-2 shadow-lg ${(() => {
          const planType = currentSubscription.plan?.planType;
          if (planType === 'premium') return 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200';
          if (planType === 'basic') return 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200';
          if (planType === 'ultra') return 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200';
          return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200';
        })()}`}>
          <CardHeader className={`p-4 md:p-6 ${(() => {
            const planType = currentSubscription.plan?.planType;
            if (planType === 'premium') return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
            if (planType === 'basic') return 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white';
            if (planType === 'ultra') return 'bg-gradient-to-r from-violet-500 to-purple-600 text-white';
            return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
          })()}`}>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center text-white">
                <CreditCard className="mr-2 h-5 w-5" />
                Sua assinatura atual
              </CardTitle>
              <Badge className="bg-white/20 text-white border-white/30">
                {currentSubscription.subscription.status === "active" ? "Ativa" : 
                 currentSubscription.subscription.status === "trial" ? "Em teste" : 
                 currentSubscription.subscription.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {currentSubscription.plan && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold">
                      {currentSubscription.plan.planName}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {currentSubscription.plan.maxCollaborators 
                        ? `Até ${currentSubscription.plan.maxCollaborators} colaboradores`
                        : "Colaboradores ilimitados"}
                    </p>
                    <div className="mt-4 space-y-2">
                      {currentSubscription.plan.features && Object.entries(currentSubscription.plan.features).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">
                            {key === 'servicesLimit' && `${value} serviços ativos`}
                            {key === 'monthlyBookings' && `${value} agendamentos/mês`}
                          </span>
                        </div>
                      ))}
                      {currentSubscription.plan.prioritySupport && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">Suporte prioritário</span>
                        </div>
                      )}
                      {currentSubscription.plan.analyticsAccess && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">Análises avançadas</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-2xl md:text-3xl font-bold">
                      R$ {parseFloat(currentSubscription.plan.monthlyPrice).toFixed(2)}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">/mês</p>
                    {currentSubscription.subscription.nextBillingDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Próximo pagamento: {format(new Date(currentSubscription.subscription.nextBillingDate), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Planos Disponíveis */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">Planos disponíveis</h2>
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {plans
            .sort((a, b) => {
              // Colocar plano gratuito por último
              if (a.planType === 'free') return 1;
              if (b.planType === 'free') return -1;
              // Manter ordem original para outros planos
              return 0;
            })
            .map((plan) => {
            const Icon = getPlanIcon(plan.planType);
            const isCurrentPlan = currentSubscription?.plan?.id === plan.id;
            const isDowngrade = currentSubscription?.plan && 
                              parseFloat(currentSubscription.plan.monthlyPrice) > parseFloat(plan.monthlyPrice);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all hover:shadow-lg border-2 ${
                  isCurrentPlan ? 'ring-2 ring-primary' : ''
                } ${(() => {
                  if (plan.planType === 'premium') return 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300';
                  if (plan.planType === 'basic') return 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-300';
                  if (plan.planType === 'ultra') return 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 hover:border-violet-300';
                  return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200';
                })()}`}
              >
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-1 text-xs md:text-sm font-medium rounded-bl-lg z-10">
                    Plano Atual
                  </div>
                )}
                
                <CardHeader className={`${(() => {
                  if (plan.planType === 'premium') return 'bg-gradient-to-r from-amber-400 to-orange-500 text-white';
                  if (plan.planType === 'basic') return 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white';
                  if (plan.planType === 'ultra') return 'bg-gradient-to-r from-violet-500 to-purple-600 text-white';
                  return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
                })()}`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">{plan.planName}</CardTitle>
                    <Icon className="h-5 w-5 text-white/80" />
                  </div>
                  <CardDescription className="text-white/90 mt-2">
                    <span className="text-2xl font-bold text-white">
                      {plan.planType === 'free' ? 'Grátis' : `R$ ${parseFloat(plan.monthlyPrice).toFixed(2)}`}
                    </span>
                    {plan.planType !== 'free' && <span className="text-sm">/mês</span>}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Recursos inclusos:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{plan.maxCollaborators ? `Até ${plan.maxCollaborators} colaboradores` : 'Colaboradores ilimitados'}</span>
                      </li>
                      {plan.features?.servicesLimit && (
                        <li className="flex items-start gap-3">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{plan.features.servicesLimit ? `Até ${plan.features.servicesLimit} serviços` : 'Serviços ilimitados'}</span>
                        </li>
                      )}
                      {plan.prioritySupport && (
                        <li className="flex items-start gap-3">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">Suporte prioritário</span>
                        </li>
                      )}
                      {plan.customBranding && (
                        <li className="flex items-start gap-3">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">Marca personalizada</span>
                        </li>
                      )}
                      {plan.analyticsAccess && (
                        <li className="flex items-start gap-3">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">Relatórios avançados</span>
                        </li>
                      )}
                      {plan.apiAccess && (
                        <li className="flex items-start gap-3">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">Acesso à API</span>
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <Button 
                    className="w-full mt-4"
                    variant={isCurrentPlan ? "secondary" : "default"}
                    disabled={isCurrentPlan}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isCurrentPlan 
                      ? 'Plano Atual' 
                      : plan.planType === 'free' 
                        ? 'Usar plano gratuito'
                        : isDowngrade 
                          ? 'Fazer downgrade' 
                          : 'Fazer upgrade'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

    </>
  );

  // Conteúdo de pagamentos
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
                {currentSubscription?.plan ? getPlanDisplayName(currentSubscription.plan.planType) : "Sem Plano"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${
                  currentSubscription?.subscription?.status === 'active' 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                }`} />
                <p className={`text-lg font-semibold ${
                  currentSubscription?.subscription?.status === 'active' 
                    ? 'text-green-600' 
                    : 'text-gray-600'
                }`}>
                  {currentSubscription?.subscription?.status === 'active' ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Cobranças */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Histórico de Cobranças</CardTitle>
          <CardDescription>
            Visualize todas as suas transações e faturas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billingHistory.length > 0 ? (
            <div className="space-y-2">
              {billingHistory.map((billing) => (
                <div key={billing.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      billing.paymentStatus === 'paid' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <DollarSign className={`h-4 w-4 ${
                        billing.paymentStatus === 'paid' ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">R$ {parseFloat(billing.amount).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(billing.periodStart), "dd 'de' MMMM", { locale: ptBR })} - 
                        {format(new Date(billing.periodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={billing.paymentStatus === 'paid' ? 'success' : 'secondary'}>
                    {billing.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma cobrança registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <DashboardLayout title="Gerenciar Planos">
      <div className="max-w-7xl mx-auto">
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

        {/* Modal de Checkout */}
        {showCheckout && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Finalizar Assinatura</CardTitle>
              <CardDescription>
                Assinando o plano {selectedPlan.planName} por R$ {selectedPlan.monthlyPrice}/mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise}>
                <CheckoutForm 
                  plan={selectedPlan} 
                  onSuccess={() => {
                    setShowCheckout(false);
                    setSelectedPlan(null);
                    fetchData();
                  }}
                />
              </Elements>
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => {
                  setShowCheckout(false);
                  setSelectedPlan(null);
                }}
              >
                Cancelar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}