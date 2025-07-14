import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Trash2, Plus, QrCode, FileText } from "lucide-react";
import { useStripeSetup } from '@/hooks/use-stripe-setup';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  pix?: {
    key: string;
    key_type: string;
  };
  boleto?: {
    tax_id: string;
  };
  billing_details: {
    name: string;
    email: string;
  };
}

interface PaymentMethodsProps {
  paymentMethods: PaymentMethod[];
  onUpdate: () => void;
}

function PaymentForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments`,
        },
        redirect: 'if_required'
      });

      if (error) {
        throw error;
      }

      // Aguardar um pouco para garantir que o webhook processou o evento
      console.log('Setup Intent confirmado:', setupIntent);
      
      if (setupIntent?.id) {
        // Confirmar no backend que o setup intent foi processado
        const confirmResponse = await apiRequest('POST', '/api/subscription/confirm-setup-intent', {
          setupIntentId: setupIntent.id
        });
        
        if (!confirmResponse.ok) {
          console.error('Erro ao confirmar setup intent no backend');
        }
      }
      
      // Dar tempo adicional para garantir processamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Método de pagamento adicionado",
        description: "Seu novo método de pagamento foi adicionado com sucesso.",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar o método de pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <PaymentElement />
      <div className="mt-4 flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Adicionando..." : "Adicionar"}
        </Button>
      </div>
    </div>
  );
}

export default function PaymentMethods({ paymentMethods, onUpdate }: PaymentMethodsProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'card' | 'pix' | 'boleto' | null>(null);
  const { toast } = useToast();
  const { StripeSetupProvider, isLoading: isSetupLoading, clientSecret } = useStripeSetup({
    onError: (error) => {
      console.error('Erro no setup do Stripe:', error);
      setSetupError(error.message);
      toast({
        title: "Erro ao carregar formulário de pagamento",
        description: error.message || "Não foi possível carregar o formulário de pagamento. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  });

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/subscription/update-payment-method', {
        paymentMethodId
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar método de pagamento');
      }

      toast({
        title: "Método de pagamento atualizado",
        description: "O método de pagamento padrão foi atualizado com sucesso.",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o método de pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (paymentMethodId: string) => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('DELETE', `/api/subscription/payment-methods/${paymentMethodId}`);

      if (!response.ok) {
        throw new Error('Falha ao remover método de pagamento');
      }

      toast({
        title: "Método de pagamento removido",
        description: "O método de pagamento foi removido com sucesso.",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o método de pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {paymentMethods.length === 0 && !isAddingNew && (
        <div className="text-center py-8 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-2">Nenhum método de pagamento cadastrado</p>
          <p className="text-sm">Adicione um cartão ou método de pagamento para facilitar suas transações</p>
        </div>
      )}
      
      {paymentMethods.map((method) => (
        <div
          key={method.id}
          className="flex items-center justify-between p-4 border rounded-lg bg-card"
        >
          <div className="flex items-center space-x-4">
            {method.type === 'card' && <CreditCard className="h-6 w-6 text-muted-foreground" />}
            {method.type === 'pix' && <QrCode className="h-6 w-6 text-green-600" />}
            {method.type === 'boleto' && <FileText className="h-6 w-6 text-gray-600" />}
            <div>
              <p className="font-medium">
                {method.card ? (
                  <>
                    {method.card.brand.toUpperCase()} terminando em {method.card.last4}
                  </>
                ) : method.type === 'pix' ? (
                  <>
                    PIX - {method.pix?.key_type === 'cpf' ? 'CPF' : method.pix?.key_type === 'email' ? 'E-mail' : method.pix?.key_type === 'phone' ? 'Telefone' : 'Chave'}: {method.pix?.key}
                  </>
                ) : method.type === 'boleto' ? (
                  <>
                    Boleto - CPF: {method.boleto?.tax_id}
                  </>
                ) : (
                  method.type.toUpperCase()
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {method.billing_details.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetDefault(method.id)}
              disabled={isLoading}
            >
              Definir como padrão
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(method.id)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      {isAddingNew ? (
        isSetupLoading ? (
          <div className="p-4 border rounded-lg bg-card">
            <div className="text-center text-muted-foreground">
              Carregando Stripe...
            </div>
          </div>
        ) : clientSecret ? (
          <StripeSetupProvider>
            <PaymentForm
              onCancel={() => setIsAddingNew(false)}
              onSuccess={() => {
                setIsAddingNew(false);
                onUpdate();
              }}
            />
          </StripeSetupProvider>
        ) : (
          <div className="p-4 border rounded-lg bg-card text-center text-muted-foreground">
            Erro ao carregar formulário de pagamento
          </div>
        )
      ) : (
        <>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSelectedPaymentType('card')}
            disabled={isLoading || isSetupLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar novo método de pagamento
          </Button>

          {/* Modal para seleção do tipo de pagamento */}
          <Dialog open={!!selectedPaymentType} onOpenChange={(open) => !open && setSelectedPaymentType(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Método de Pagamento</DialogTitle>
                <DialogDescription>
                  Escolha o tipo de método de pagamento que deseja adicionar
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="card" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="card">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Cartão
                  </TabsTrigger>
                  <TabsTrigger value="pix">
                    <QrCode className="h-4 w-4 mr-2" />
                    PIX
                  </TabsTrigger>
                  <TabsTrigger value="boleto">
                    <FileText className="h-4 w-4 mr-2" />
                    Boleto
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="card" className="mt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Adicione um cartão de crédito ou débito para pagamentos recorrentes.
                    </p>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        setSelectedPaymentType(null);
                        setIsAddingNew(true);
                      }}
                    >
                      Continuar com Cartão
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="pix" className="mt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Configure sua chave PIX para receber pagamentos instantâneos.
                    </p>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        ⚠️ Em breve! Estamos trabalhando para adicionar suporte a PIX como método de pagamento salvo.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="boleto" className="mt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Configure boleto bancário para pagamentos únicos.
                    </p>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700">
                        ⚠️ Em breve! Estamos trabalhando para adicionar suporte a boleto como método de pagamento.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
} 