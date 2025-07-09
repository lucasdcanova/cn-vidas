import React from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import PaymentMethods from "@/components/payment/payment-methods";
import TransactionHistory from "@/components/payment/transaction-history";
import { CreditCard, DollarSign } from "lucide-react";

const PaymentsPage: React.FC = () => {
  const { user } = useAuth();


  // Buscar métodos de pagamento
  const paymentMethodsQuery = useQuery({
    queryKey: ['/api/subscription/payment-methods'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/subscription/payment-methods');
      if (!response.ok) {
        throw new Error('Falha ao buscar métodos de pagamento');
      }
      return response.json();
    },
    enabled: !!user
  });

  const paymentMethodsData = paymentMethodsQuery.data;

  // Buscar histórico de transações
  const transactionHistoryQuery = useQuery({
    queryKey: ['/api/payment-history'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/payment-history');
      if (!response.ok) {
        throw new Error('Falha ao buscar histórico de pagamentos');
      }
      return response.json();
    },
    enabled: !!user
  });

  const transactionData = transactionHistoryQuery.data;
  
  // Debug: Log transaction data
  React.useEffect(() => {
    if (transactionData) {
      console.log('💰 Transaction History Data:', transactionData);
    }
  }, [transactionData]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Pagamentos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus métodos de pagamento e histórico de transações
          </p>
        </div>


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
              summary={transactionData?.summary}
              loading={transactionHistoryQuery.isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PaymentsPage;