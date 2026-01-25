import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { RouteComponentProps } from "wouter";
import { CNVidasLoader } from "@/components/ui/cnvidas-loader";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType<RouteComponentProps>;
  allowedRoles?: string[];
};

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [needsSubscription, setNeedsSubscription] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [showSlowLoading, setShowSlowLoading] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isLoading || checkingSubscription) {
      // Se carregar por mais de 8 segundos, mostrar opções
      timer = setTimeout(() => setShowSlowLoading(true), 8000);
    } else {
      setShowSlowLoading(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, checkingSubscription]);

  // Verificar se o caminho atual já é first-subscription para evitar loop
  const isFirstSubscriptionPath = path === "/first-subscription";
  const isSubscriptionSuccess = path === "/subscription-success";

  // DESABILITADO: Verificação de assinatura movida para o dashboard para evitar conflitos
  useEffect(() => {
    // Sempre permitir acesso - o dashboard gerenciará os redirecionamentos de assinatura
    setNeedsSubscription(false);
  }, [user]);

  if (isLoading || checkingSubscription) {
    if (showSlowLoading) {
      return (
        <Route path={path}>
          <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
            <div className="w-16 h-16 mb-4 text-blue-500 animate-spin rounded-full border-4 border-current border-t-transparent" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Carregando...</h2>
            <p className="text-slate-600 mb-6 max-w-sm">
              O aplicativo está demorando mais que o esperado para responder.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium active:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="w-full py-3 px-4 bg-white text-red-600 border border-red-200 rounded-xl font-medium active:bg-red-50 transition-colors"
              >
                Reiniciar App (Limpar Cache)
              </button>
            </div>
          </div>
        </Route>
      );
    }

    return (
      <Route path={path}>
        <CNVidasLoader fullScreen text="Verificando acesso..." />
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Route path={path}>
        <Redirect to="/dashboard" />
      </Route>
    );
  }

  // DESABILITADO: Redirecionamento movido para o dashboard para evitar loops
  // if (user.role === "patient" && needsSubscription && !isFirstSubscriptionPath && !isSubscriptionSuccess) {
  //   return (
  //     <Route path={path}>
  //       <Redirect to="/first-subscription" />
  //     </Route>
  //   );
  // }

  return <Route path={path} component={Component} />;
}
