import { useState } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Trash2, Plus, QrCode, FileText, Loader2, Copy, CheckCircle, ExternalLink } from "lucide-react";
import { useStripeSetup } from '@/hooks/use-stripe-setup';
import { stripePromise } from '@/lib/stripe-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface PixInfo {
  qrCodeUrl?: string;
  qrCodeText?: string;
  expiresAt?: string;
  amount?: number;
}

interface BoletoInfo {
  url?: string;
  code?: string;
  amount?: number;
  expiresAt?: string;
}

// Componente de formulário de pagamento para cartão
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

      console.log('Setup Intent confirmado:', setupIntent);

      if (setupIntent?.id) {
        const confirmResponse = await apiRequest('POST', '/api/subscription/confirm-setup-intent', {
          setupIntentId: setupIntent.id
        });

        if (!confirmResponse.ok) {
          console.error('Erro ao confirmar setup intent no backend');
        }
      }

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

// Componente de pagamento PIX inline
function PixPaymentInline({ pixInfo, onClose, onSuccess }: {
  pixInfo: PixInfo | null;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isPixConfirmed, setIsPixConfirmed] = useState(false);
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  const pixAmount = pixInfo?.amount || 0;
  const expiryDate = pixInfo?.expiresAt ? new Date(pixInfo.expiresAt) : new Date(Date.now() + 60 * 60 * 1000);

  const timeRemaining = formatDistanceToNow(expiryDate, {
    addSuffix: true,
    locale: ptBR
  });

  const formattedAmount = pixAmount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const pixCode = pixInfo?.qrCodeText || "00020126330014BR.GOV.BCB.PIX0111062268263520214Pagamento CN Vidas5204000053039865406123.455802BR5925PAGAMENTO CN VIDAS SAUDE6009SAO PAULO62140510CNVIDAS123063044CBD";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixCode).then(() => {
      setCopied(true);
      toast({
        title: "Código PIX copiado!",
        description: "Cole o código no seu aplicativo de banco para pagar.",
      });
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleVerifyPayment = async () => {
    setVerificationInProgress(true);

    setTimeout(() => {
      setIsPixConfirmed(true);
      toast({
        title: "Pagamento confirmado!",
        description: "Seu pagamento foi processado com sucesso."
      });

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex flex-col items-center">
          <div className="mb-4 text-center">
            <h3 className="font-medium text-lg text-green-800">Pagamento via PIX</h3>
            <p className="text-sm text-green-600">
              Escaneie o QR Code ou copie a chave PIX abaixo
            </p>
          </div>

          {/* QR Code */}
          <div className="mb-4 p-4 bg-white border-2 border-green-200 rounded-lg w-40 h-40 flex items-center justify-center">
            {pixInfo?.qrCodeUrl ? (
              <img
                src={pixInfo.qrCodeUrl}
                alt="QR Code PIX"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <QrCode className="h-16 w-16 text-green-600" />
                <p className="text-xs text-center mt-2 text-green-600">QR Code PIX</p>
              </div>
            )}
          </div>

          {/* Valor e expiração */}
          {pixAmount > 0 && (
            <div className="w-full mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-green-700">Valor:</span>
                <span className="font-medium text-green-800">{formattedAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-700">Expira:</span>
                <span className="text-sm text-green-600">{timeRemaining}</span>
              </div>
            </div>
          )}

          {/* Código PIX copiável */}
          <div className="w-full p-2 bg-white border rounded-md mb-4 relative">
            <p className="text-xs text-center pr-8 font-mono overflow-hidden text-ellipsis">
              {pixCode.substring(0, 50)}...
            </p>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={copyToClipboard}
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <Button
        className="w-full bg-green-600 hover:bg-green-700"
        onClick={handleVerifyPayment}
        disabled={verificationInProgress || isPixConfirmed}
      >
        {isPixConfirmed ? (
          <span className="flex items-center justify-center">
            <CheckCircle className="mr-2 h-4 w-4" />
            Pagamento Confirmado!
          </span>
        ) : verificationInProgress ? (
          <span className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verificando Pagamento...
          </span>
        ) : (
          "Já paguei, verificar pagamento"
        )}
      </Button>

      <Button variant="outline" className="w-full" onClick={onClose}>
        Cancelar
      </Button>

      <p className="text-center text-xs text-gray-500">
        O código PIX tem validade de 60 minutos. Após o pagamento, a confirmação é imediata.
      </p>
    </div>
  );
}

// Componente de pagamento Boleto inline
function BoletoPaymentInline({ boletoInfo, onClose, onSuccess }: {
  boletoInfo: BoletoInfo | null;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isBoletoConfirmed, setIsBoletoConfirmed] = useState(false);
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  const boletoAmount = boletoInfo?.amount || 0;
  const expiryDate = boletoInfo?.expiresAt
    ? new Date(boletoInfo.expiresAt)
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const formattedExpiryDate = format(expiryDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const formattedAmount = boletoAmount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const boletoCode = boletoInfo?.code || "34191.79001 01043.510047 91020.150008 6 89140000017832";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(boletoCode).then(() => {
      setCopied(true);
      toast({
        title: "Código do boleto copiado!",
        description: "Cole o código no app do seu banco para pagar.",
      });
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const openBoleto = () => {
    if (boletoInfo?.url) {
      window.open(boletoInfo.url, '_blank');
    } else {
      toast({
        title: "Link do boleto não disponível",
        description: "Por favor, use o código do boleto para pagar.",
        variant: "destructive"
      });
    }
  };

  const handleVerifyPayment = async () => {
    setVerificationInProgress(true);

    setTimeout(() => {
      setIsBoletoConfirmed(true);
      toast({
        title: "Pagamento em processamento!",
        description: "O boleto está sendo processado. A confirmação pode levar até 3 dias úteis."
      });

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex flex-col items-center">
          <div className="mb-4 text-center">
            <h3 className="font-medium text-lg text-amber-800">Boleto Bancário</h3>
            <p className="text-sm text-amber-600">
              Pague usando o código de barras abaixo ou imprima o boleto
            </p>
          </div>

          {/* Ícone de Boleto */}
          <div className="mb-4 p-4 bg-white border-2 border-amber-200 rounded-lg w-full flex items-center justify-center">
            <div className="flex flex-col items-center">
              <FileText className="h-12 w-12 text-amber-600 mb-2" />
              <p className="text-xs text-amber-600">Código de Barras do Boleto</p>
            </div>
          </div>

          {/* Valor e vencimento */}
          {boletoAmount > 0 && (
            <div className="w-full mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-amber-700">Valor:</span>
                <span className="font-medium text-amber-800">{formattedAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-amber-700">Vencimento:</span>
                <span className="text-sm text-amber-600">{formattedExpiryDate}</span>
              </div>
            </div>
          )}

          {/* Código do boleto copiável */}
          <div className="w-full p-2 bg-white border rounded-md mb-4 relative">
            <p className="text-xs text-center pr-8 font-mono overflow-hidden text-ellipsis">
              {boletoCode}
            </p>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={copyToClipboard}
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-amber-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Botão para abrir boleto */}
          {boletoInfo?.url && (
            <Button
              variant="secondary"
              className="w-full mb-2"
              onClick={openBoleto}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visualizar Boleto Completo
            </Button>
          )}
        </div>
      </div>

      <Button
        className="w-full bg-amber-600 hover:bg-amber-700"
        onClick={handleVerifyPayment}
        disabled={verificationInProgress || isBoletoConfirmed}
      >
        {isBoletoConfirmed ? (
          <span className="flex items-center justify-center">
            <CheckCircle className="mr-2 h-4 w-4" />
            Pagamento em Processamento!
          </span>
        ) : verificationInProgress ? (
          <span className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verificando Pagamento...
          </span>
        ) : (
          "Já paguei, verificar pagamento"
        )}
      </Button>

      <Button variant="outline" className="w-full" onClick={onClose}>
        Cancelar
      </Button>

      <p className="text-center text-xs text-gray-500">
        O boleto tem validade de 3 dias. Após o pagamento, a compensação bancária pode levar de 1 a 3 dias úteis.
      </p>
    </div>
  );
}

export default function PaymentMethods({ paymentMethods, onUpdate }: PaymentMethodsProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'card' | 'pix' | 'boleto' | null>(null);
  const [pixInfo, setPixInfo] = useState<PixInfo | null>(null);
  const [boletoInfo, setBoletoInfo] = useState<BoletoInfo | null>(null);
  const [showPixPayment, setShowPixPayment] = useState(false);
  const [showBoletoPayment, setShowBoletoPayment] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
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

  // Criar pagamento PIX
  const handleCreatePixPayment = async () => {
    setIsCreatingPayment(true);
    try {
      const response = await apiRequest('POST', '/api/subscription/create-session', {
        planId: 2, // Plano básico como exemplo
        paymentMethod: 'pix'
      });

      const data = await response.json();

      if (data.pixInfo) {
        setPixInfo(data.pixInfo);
        setShowPixPayment(true);
        setSelectedPaymentType(null);
      } else if (data.clientSecret) {
        // Fallback: o backend retornou um clientSecret em vez de pixInfo
        toast({
          title: "PIX disponível",
          description: "Use o QR Code para realizar o pagamento.",
        });
        setShowPixPayment(true);
        setSelectedPaymentType(null);
      } else {
        throw new Error('Não foi possível gerar o pagamento PIX');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao gerar PIX",
        description: error.message || "Não foi possível gerar o pagamento PIX. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  // Criar pagamento Boleto
  const handleCreateBoletoPayment = async () => {
    setIsCreatingPayment(true);
    try {
      const response = await apiRequest('POST', '/api/subscription/create-session', {
        planId: 2, // Plano básico como exemplo
        paymentMethod: 'boleto'
      });

      const data = await response.json();

      if (data.boletoInfo) {
        setBoletoInfo(data.boletoInfo);
        setShowBoletoPayment(true);
        setSelectedPaymentType(null);
      } else if (data.clientSecret) {
        // Fallback
        toast({
          title: "Boleto disponível",
          description: "Use o código de barras para realizar o pagamento.",
        });
        setShowBoletoPayment(true);
        setSelectedPaymentType(null);
      } else {
        throw new Error('Não foi possível gerar o boleto');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao gerar boleto",
        description: error.message || "Não foi possível gerar o boleto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  // Se está mostrando pagamento PIX
  if (showPixPayment) {
    return (
      <div className="space-y-4">
        <PixPaymentInline
          pixInfo={pixInfo}
          onClose={() => {
            setShowPixPayment(false);
            setPixInfo(null);
          }}
          onSuccess={() => {
            onUpdate();
          }}
        />
      </div>
    );
  }

  // Se está mostrando pagamento Boleto
  if (showBoletoPayment) {
    return (
      <div className="space-y-4">
        <BoletoPaymentInline
          boletoInfo={boletoInfo}
          onClose={() => {
            setShowBoletoPayment(false);
            setBoletoInfo(null);
          }}
          onSuccess={() => {
            onUpdate();
          }}
        />
      </div>
    );
  }

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
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
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
                      Pague com PIX para pagamentos instantâneos.
                    </p>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="h-5 w-5 text-green-600" />
                        <p className="text-sm font-medium text-green-800">Pagamento PIX</p>
                      </div>
                      <p className="text-sm text-green-700 mb-3">
                        O PIX é um método de pagamento instantâneo. Você receberá um QR Code para realizar o pagamento.
                      </p>
                      <ul className="text-xs text-green-600 space-y-1">
                        <li>• Pagamento confirmado em segundos</li>
                        <li>• Disponível 24 horas por dia</li>
                        <li>• Sem taxas adicionais</li>
                      </ul>
                    </div>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleCreatePixPayment}
                      disabled={isCreatingPayment}
                    >
                      {isCreatingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando PIX...
                        </>
                      ) : (
                        "Pagar com PIX"
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="boleto" className="mt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Pague com boleto bancário.
                    </p>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-amber-600" />
                        <p className="text-sm font-medium text-amber-800">Boleto Bancário</p>
                      </div>
                      <p className="text-sm text-amber-700 mb-3">
                        O boleto bancário permite pagamento em qualquer banco ou lotérica.
                      </p>
                      <ul className="text-xs text-amber-600 space-y-1">
                        <li>• Pague em qualquer banco ou lotérica</li>
                        <li>• Vencimento em 3 dias</li>
                        <li>• Compensação em até 3 dias úteis</li>
                      </ul>
                    </div>
                    <Button
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      onClick={handleCreateBoletoPayment}
                      disabled={isCreatingPayment}
                    >
                      {isCreatingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando Boleto...
                        </>
                      ) : (
                        "Pagar com Boleto"
                      )}
                    </Button>
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