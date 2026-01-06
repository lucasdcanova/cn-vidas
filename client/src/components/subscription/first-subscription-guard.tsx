import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getUserSubscription } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import PatientOnboarding from "@/pages/patient-onboarding";
import { CNVidasLoader } from "@/components/ui/cnvidas-loader";

export default function FirstSubscriptionGuard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [canAccess, setCanAccess] = useState<boolean | null>(null);

  // Buscar assinatura atual do usuário
  const { data: userSubscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["/api/subscription/current"],
    queryFn: getUserSubscription,
    enabled: !!user?.id,
  });

  useEffect(() => {
    // Se ainda está carregando, aguardar
    if (subscriptionLoading) {
      return;
    }

    // Se o usuário não é paciente, redirecionar
    if (user && user.role !== 'patient') {
      setCanAccess(false);
      setLocation('/dashboard');
      return;
    }

    // Verificar se tem assinatura ativa de qualquer forma
    // (pela query OU pelos campos do usuário)
    const hasActiveFromQuery = userSubscription && userSubscription.status === 'active';
    const hasActiveFromUser = user?.subscriptionStatus === 'active' ||
      (user?.subscriptionPlan && user.subscriptionPlan !== 'free');

    if (hasActiveFromQuery || hasActiveFromUser) {
      console.log("🚫 FirstSubscriptionGuard - Bloqueando acesso: usuário já tem plano ativo", {
        hasActiveFromQuery,
        hasActiveFromUser,
        subscriptionPlan: user?.subscriptionPlan,
        subscriptionStatus: user?.subscriptionStatus
      });
      setCanAccess(false);
      setLocation('/dashboard');
      return;
    }

    // Permitir acesso apenas se não tem assinatura ativa
    setCanAccess(true);
  }, [user, userSubscription, subscriptionLoading, setLocation]);

  // Mostrar loading enquanto verifica
  if (canAccess === null || subscriptionLoading) {
    return (
      <CNVidasLoader fullScreen text="Verificando assinatura..." />
    );
  }

  // Se não pode acessar, já foi redirecionado
  if (!canAccess) {
    return null;
  }

  // Se pode acessar, renderizar a página
  return <PatientOnboarding />;
}