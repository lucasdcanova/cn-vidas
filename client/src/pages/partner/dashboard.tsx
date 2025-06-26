import React, { useEffect } from 'react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Building2, Package, BarChart3, Settings, Plus, AlertCircle } from 'lucide-react';
import { httpRequest } from '@/lib/http-client';

const PartnerDashboard: React.FC = () => {
  const [, navigate] = useLocation();
  
  // Teste de debug ao carregar
  useEffect(() => {
    // Testar rota de teste
    httpRequest('/api/partners/test')
      .then(data => console.log('✅ Rota /test funcionando:', data))
      .catch(err => console.error('❌ Erro em /test:', err));
      
    // Testar rota de debug-auth
    httpRequest('/api/partners/debug-auth')
      .then(data => console.log('✅ Rota /debug-auth:', data))
      .catch(err => console.error('❌ Erro em /debug-auth:', err));
  }, []);

  return (
    <DashboardLayout title="Dashboard do Parceiro">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel do Parceiro</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie seus serviços e acompanhe suas métricas
            </p>
          </div>
          <Button 
            onClick={() => navigate('/partner/services/new')}
            className="mt-4 sm:mt-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Serviços Ativos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Total de serviços cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Visualizações
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Contatos
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Conversão
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                Contatos para vendas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Gerencie seus serviços e informações
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => navigate('/partner/services')}
            >
              <Package className="mr-2 h-4 w-4" />
              Gerenciar Serviços
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => navigate('/partner/profile')}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Editar Perfil
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => navigate('/partner/analytics')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Ver Relatórios
            </Button>
          </CardContent>
        </Card>

        {/* Alert Card */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Perfil Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Seu perfil está aguardando aprovação. Enquanto isso, você pode cadastrar seus serviços,
              mas eles só ficarão visíveis após a aprovação do seu cadastro.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnerDashboard;