import React, { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, CheckCircle, AlertCircle, Users, CreditCard, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface InvitationData {
  id: number;
  partnerName: string;
  planType: string;
  email: string;
  fullName?: string;
  status: string;
  expiresAt: string;
}

export default function CorporateInvitePage() {
  const [, params] = useRoute("/corporate-invite/:token");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (params?.token) {
      validateInvitation(params.token);
    }
  }, [params?.token]);

  const validateInvitation = async (token: string) => {
    try {
      const response = await apiRequest('GET', `/api/corporate/invitations/validate/${token}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Convite inválido');
      }
      
      const data = await response.json();
      setInvitation(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!params?.token || !invitation) return;
    
    setAccepting(true);
    
    try {
      // Se o usuário não está logado, redirecionar para login/cadastro
      if (!user) {
        // Salvar token no localStorage para processar após login
        localStorage.setItem('corporate_invitation_token', params.token);
        localStorage.setItem('corporate_invitation_email', invitation.email);
        
        toast.info('Por favor, faça login ou crie uma conta para aceitar o convite');
        navigate('/register');
        return;
      }
      
      // Se está logado, aceitar o convite
      const response = await apiRequest('POST', `/api/corporate/invitations/accept/${params.token}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao aceitar convite');
      }
      
      toast.success('Convite aceito com sucesso! Você agora tem acesso ao plano corporativo.');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAccepting(false);
    }
  };

  const getPlanFeatures = (planType: string) => {
    switch (planType) {
      case 'basic_corp':
        return [
          'Consultas médicas ilimitadas',
          'R$ 300/dia de seguro internação',
          '30% desconto em especialistas',
          'Atendimento de emergência',
          'Prontuário eletrônico'
        ];
      case 'premium_corp':
        return [
          'Consultas médicas ilimitadas',
          'R$ 300/dia de seguro internação',
          '50% desconto em especialistas',
          'Atendimento de emergência 24h',
          'Prontuário eletrônico completo',
          'Suporte prioritário'
        ];
      case 'ultra_corp':
        return [
          'Consultas médicas premium ilimitadas',
          'R$ 500/dia de seguro internação',
          '70% desconto em especialistas',
          'Atendimento VIP 24h',
          'Prontuário eletrônico avançado',
          'Suporte dedicado'
        ];
      default:
        return [];
    }
  };

  const getPlanDisplayName = (planType: string) => {
    const names = {
      'basic_corp': 'Básico Corporativo',
      'premium_corp': 'Premium Corporativo',
      'ultra_corp': 'Ultra Corporativo'
    };
    return names[planType as keyof typeof names] || planType;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Validando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Convite Inválido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => navigate('/')}
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const features = getPlanFeatures(invitation.planType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bem-vindo ao CNVidas Corporativo
          </h1>
          <p className="text-xl text-gray-600">
            Você foi convidado para fazer parte do plano de saúde corporativo
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Building2 className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">{invitation.partnerName}</CardTitle>
            <CardDescription>
              convidou você para acessar o plano {getPlanDisplayName(invitation.planType)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isExpired ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Convite Expirado</AlertTitle>
                <AlertDescription>
                  Este convite expirou. Por favor, solicite um novo convite ao RH da sua empresa.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert className="mb-6">
                  <Users className="h-4 w-4" />
                  <AlertTitle>Convite para: {invitation.email}</AlertTitle>
                  <AlertDescription>
                    {invitation.fullName && `Nome: ${invitation.fullName}`}
                  </AlertDescription>
                </Alert>

                <div className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Benefícios incluídos no seu plano:
                  </h3>
                  <ul className="space-y-2">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold">Sem custo para você!</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Todos os custos do plano são cobertos pela sua empresa. 
                    Você não precisa se preocupar com mensalidades.
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={acceptInvitation}
                  disabled={accepting}
                >
                  {accepting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aceitar Convite e Ativar Plano
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Ao aceitar este convite, você concorda com os termos de uso do CNVidas.</p>
        </div>
      </div>
    </div>
  );
}