import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import AdminLayout from '@/components/layouts/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UserCheck, TrendingUp, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PlanStat {
  plan: string;
  count: number;
}

interface UserDetail {
  id: number;
  name: string;
  email: string;
  plan: string;
  status: string;
  createdAt: string;
}

interface SellerStat {
  sellerName: string;
  totalPlans: number;
  activePlans: number;
  cancelledPlans: number;
  inactivePlans: number;
  plansByType: PlanStat[];
  users: UserDetail[];
}

const planLabels: Record<string, string> = {
  'free': 'Gratuito',
  'basic': 'Básico',
  'premium': 'Premium',
  'ultra': 'Ultra',
  'basic_family': 'Básico Família',
  'premium_family': 'Premium Família',
  'ultra_family': 'Ultra Família',
};

const planColors: Record<string, string> = {
  'free': 'bg-gray-100 text-gray-800 border-gray-300',
  'basic': 'bg-blue-100 text-blue-800 border-blue-300',
  'premium': 'bg-purple-100 text-purple-800 border-purple-300',
  'ultra': 'bg-teal-100 text-teal-800 border-teal-300',
  'basic_family': 'bg-blue-100 text-blue-800 border-blue-300',
  'premium_family': 'bg-purple-100 text-purple-800 border-purple-300',
  'ultra_family': 'bg-teal-100 text-teal-800 border-teal-300',
};

const SellerStats: React.FC = () => {
  const [selectedSeller, setSelectedSeller] = useState<SellerStat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: sellers, isLoading } = useQuery<SellerStat[]>({
    queryKey: ['/api/admin/sellers'],
    queryFn: () => apiRequest('GET', '/api/admin/sellers').then(res => res.json()),
  });

  const handleSellerClick = (seller: SellerStat) => {
    setSelectedSeller(seller);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Estatísticas de Vendedores">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // Calcular total de vendas
  const totalSales = sellers?.reduce((total, seller) => total + seller.totalPlans, 0) || 0;

  // Calcular total por plano
  const planTotals: Record<string, number> = {};
  sellers?.forEach(seller => {
    seller.plansByType.forEach(plan => {
      planTotals[plan.plan] = (planTotals[plan.plan] || 0) + plan.count;
    });
  });

  return (
    <AdminLayout title="Estatísticas de Vendedores">
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendedores</CardTitle>
            <CardDescription>Vendedores ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <UserCheck className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-2xl font-bold">{sellers?.length || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <CardDescription>Assinaturas vendidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-2xl font-bold">{totalSales}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plano Mais Vendido</CardTitle>
            <CardDescription>Plano com mais assinaturas</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.entries(planTotals).length > 0 && (
              <div className="flex items-center">
                <Badge 
                  className={planColors[Object.entries(planTotals).sort((a, b) => b[1] - a[1])[0][0]]}
                >
                  {planLabels[Object.entries(planTotals).sort((a, b) => b[1] - a[1])[0][0]]}
                </Badge>
                <span className="ml-2 text-xl font-bold">
                  {Object.entries(planTotals).sort((a, b) => b[1] - a[1])[0][1]}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho dos Vendedores</CardTitle>
          <CardDescription>
            Lista de vendedores e suas vendas por tipo de plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
              <TabsTrigger value="table">Tabela</TabsTrigger>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="table">
              <Table>
                <TableCaption>Lista de vendedores e número de planos vendidos (Clique no nome para ver detalhes)</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-center">Ativos</TableHead>
                    <TableHead className="text-center">Cancelados</TableHead>
                    <TableHead className="text-center">Inativos</TableHead>
                    <TableHead>Distribuição por Plano</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellers?.map((seller) => {
                    return (
                      <TableRow key={seller.sellerName}>
                        <TableCell className="font-medium">
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium text-left"
                            onClick={() => handleSellerClick(seller)}
                          >
                            {seller.sellerName}
                          </Button>
                        </TableCell>
                        <TableCell className="font-bold">{seller.totalPlans}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-600 font-medium">{seller.activePlans}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-red-600 font-medium">{seller.cancelledPlans}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <MinusCircle className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600 font-medium">{seller.inactivePlans}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {seller.plansByType.map((plan) => (
                              <Badge 
                                key={plan.plan} 
                                variant="outline"
                                className={`text-xs ${planColors[plan.plan]}`}
                              >
                                {planLabels[plan.plan]}: {plan.count}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="details">
              <div className="space-y-6">
                {sellers?.map((seller) => (
                  <Card 
                    key={seller.sellerName} 
                    className="border-l-4 border-l-primary cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleSellerClick(seller)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle>{seller.sellerName}</CardTitle>
                      <CardDescription>
                        Total de planos vendidos: {seller.totalPlans}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Ativos</p>
                          <p className="text-lg font-bold text-green-600">{seller.activePlans}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Cancelados</p>
                          <p className="text-lg font-bold text-red-600">{seller.cancelledPlans}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Inativos</p>
                          <p className="text-lg font-bold text-gray-600">{seller.inactivePlans}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {seller.plansByType.map((plan) => (
                          <Badge 
                            key={plan.plan} 
                            className={planColors[plan.plan]}
                          >
                            {planLabels[plan.plan]}: {plan.count}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Clique para ver detalhes dos clientes
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {sellers?.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    Nenhum vendedor registrado ainda.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal para exibir usuários do vendedor */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clientes de {selectedSeller?.sellerName}</DialogTitle>
            <DialogDescription>
              Lista completa de titulares dos planos vendidos
            </DialogDescription>
          </DialogHeader>
          
          {selectedSeller && (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{selectedSeller.activePlans}</p>
                      <p className="text-sm text-muted-foreground">Ativos</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-600">{selectedSeller.cancelledPlans}</p>
                      <p className="text-sm text-muted-foreground">Cancelados</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <MinusCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-600">{selectedSeller.inactivePlans}</p>
                      <p className="text-sm text-muted-foreground">Inativos</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de usuários */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSeller.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={planColors[user.plan]}>
                          {planLabels[user.plan] || user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.status === 'active' && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                        {user.status === 'cancelled' && (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancelado
                          </Badge>
                        )}
                        {user.status !== 'active' && user.status !== 'cancelled' && (
                          <Badge className="bg-gray-100 text-gray-800">
                            <MinusCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default SellerStats;