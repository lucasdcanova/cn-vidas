import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

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
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (user?.role !== 'partner') {
      navigate('/');
      return;
    }
    
    fetchData();
  }, [user, navigate]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Assinatura e Faturamento
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seu plano e histórico de pagamentos
        </p>
      </div>

      {/* Assinatura Atual */}
      {currentSubscription && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Plano Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentSubscription.plan && (
                  <>
                    <div className={`p-3 rounded-lg bg-primary/10 ${getPlanColor(currentSubscription.plan.planType)}`}>
                      {(() => {
                        const Icon = getPlanIcon(currentSubscription.plan.planType);
                        return <Icon className="h-8 w-8" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{currentSubscription.plan.planName}</h3>
                      <p className="text-muted-foreground">
                        {currentSubscription.isFreePlan ? 'Gratuito' : `R$ ${currentSubscription.plan.monthlyPrice}/mês`}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {currentSubscription.activeCollaborators} colaboradores ativos
                        </Badge>
                        {currentSubscription.plan.maxCollaborators && (
                          <Badge variant="secondary">
                            Limite: {currentSubscription.plan.maxCollaborators}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {currentSubscription.subscription && !currentSubscription.isFreePlan && (
                <div className="text-right">
                  {currentSubscription.subscription.nextBillingDate && (
                    <p className="text-sm text-muted-foreground">
                      Próxima cobrança: {format(new Date(currentSubscription.subscription.nextBillingDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleCancelSubscription}
                  >
                    Cancelar Assinatura
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planos Disponíveis */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.planType);
            const isCurrentPlan = currentSubscription?.plan?.id === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {isCurrentPlan && (
                  <Badge className="absolute top-2 right-2" variant="default">
                    Plano Atual
                  </Badge>
                )}
                
                <CardHeader>
                  <div className={`p-2 rounded-lg bg-primary/10 w-fit ${getPlanColor(plan.planType)}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4">{plan.planName}</CardTitle>
                  <CardDescription>
                    {plan.planType === 'free' ? 'Gratuito' : `R$ ${plan.monthlyPrice}/mês`}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Recursos inclusos:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        {plan.maxCollaborators ? `Até ${plan.maxCollaborators} colaboradores` : 'Colaboradores ilimitados'}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Comissão de {plan.commissionRate}%
                      </li>
                      {plan.features?.servicesLimit && (
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          {plan.features.servicesLimit ? `Até ${plan.features.servicesLimit} serviços` : 'Serviços ilimitados'}
                        </li>
                      )}
                      {plan.prioritySupport && (
                        <li className="flex items-center gap-2">
                          <Headphones className="h-4 w-4 text-green-600" />
                          Suporte prioritário
                        </li>
                      )}
                      {plan.customBranding && (
                        <li className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-600" />
                          Marca personalizada
                        </li>
                      )}
                      {plan.analyticsAccess && (
                        <li className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-green-600" />
                          Relatórios avançados
                        </li>
                      )}
                      {plan.apiAccess && (
                        <li className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-green-600" />
                          Acesso à API
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <Button 
                    className="w-full"
                    variant={isCurrentPlan ? "secondary" : "default"}
                    disabled={isCurrentPlan}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isCurrentPlan ? 'Plano Atual' : 'Selecionar Plano'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Histórico de Cobranças */}
      {billingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Cobranças</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {billingHistory.map((billing) => (
                <div key={billing.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">R$ {billing.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        Período: {format(new Date(billing.periodStart), 'dd/MM', { locale: ptBR })} - 
                        {format(new Date(billing.periodEnd), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={billing.paymentStatus === 'paid' ? 'success' : 'secondary'}>
                    {billing.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
  );
}