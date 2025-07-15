import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  Users, 
  Calendar, 
  TrendingUp,
  Download,
  FileText,
  DollarSign,
  Activity,
  UserCheck,
  Clock,
  Target,
  BarChart3,
  ChevronLeft
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';

interface ReportData {
  summary: {
    totalPartners: number;
    activePartners: number;
    totalEmployees: number;
    totalAppointments: number;
    monthlyRevenue: number;
    growthRate: number;
  };
  monthlyTrends: Array<{
    month: string;
    partners: number;
    employees: number;
    appointments: number;
    revenue: number;
  }>;
  planDistribution: Array<{
    plan: string;
    count: number;
    percentage: number;
  }>;
  topPartners: Array<{
    id: number;
    businessName: string;
    employeeCount: number;
    appointmentCount: number;
    monthlyRevenue: number;
  }>;
  employeeTierDistribution: Array<{
    tier: string;
    count: number;
  }>;
}

export default function AdminPartnerReportsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [period, setPeriod] = useState("6months");
  const [reportType, setReportType] = useState("overview");

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/partners/reports", period, reportType],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        type: reportType
      });
      
      const response = await apiRequest('GET', `/api/admin/partners/reports?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar relatórios');
      return response.json();
    }
  });

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await apiRequest('GET', `/api/admin/partners/reports/export?format=${format}&period=${period}`);
      if (!response.ok) throw new Error('Falha ao exportar relatório');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-parceiros-${format}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Relatório exportado",
        description: `O relatório foi exportado em formato ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar o relatório.",
        variant: "destructive"
      });
    }
  };

  // Cores para gráficos
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const data = reportData as ReportData;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin/partners')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Relatórios de Parceiros Corporativos
              </h1>
              <p className="text-muted-foreground">
                Análise detalhada do programa de parceiros
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => exportReport('csv')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={() => exportReport('pdf')} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Último mês</SelectItem>
                  <SelectItem value="3months">Últimos 3 meses</SelectItem>
                  <SelectItem value="6months">Últimos 6 meses</SelectItem>
                  <SelectItem value="12months">Último ano</SelectItem>
                  <SelectItem value="all">Todo período</SelectItem>
                </SelectContent>
              </Select>

              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Visão Geral</SelectItem>
                  <SelectItem value="financial">Financeiro</SelectItem>
                  <SelectItem value="usage">Utilização</SelectItem>
                  <SelectItem value="growth">Crescimento</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => refetch()} variant="outline">
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Parceiros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.summary.totalPartners || 0}</div>
              <p className="text-xs text-muted-foreground">
                Empresas cadastradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Parceiros Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data?.summary.activePartners || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Com assinatura ativa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Vidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.summary.totalEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">
                Colaboradores atendidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Consultas Realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.summary.totalAppointments || 0}</div>
              <p className="text-xs text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(data?.summary.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Média do período
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Crescimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {data?.summary.growthRate > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : null}
                {data?.summary.growthRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Comparado ao período anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tendências Mensais */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
              <CardDescription>
                Crescimento de parceiros e colaboradores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => format(new Date(value), 'MMM/yy', { locale: ptBR })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMMM yyyy', { locale: ptBR })}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="partners" 
                    stroke="#3b82f6" 
                    name="Parceiros"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="employees" 
                    stroke="#10b981" 
                    name="Colaboradores"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição de Planos */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Planos</CardTitle>
              <CardDescription>
                Parceiros por tipo de plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.planDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ plan, percentage }) => `${plan} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data?.planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Utilização de Consultas */}
          <Card>
            <CardHeader>
              <CardTitle>Consultas por Mês</CardTitle>
              <CardDescription>
                Volume de consultas realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => format(new Date(value), 'MMM/yy', { locale: ptBR })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMMM yyyy', { locale: ptBR })}
                  />
                  <Bar dataKey="appointments" fill="#f59e0b" name="Consultas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Receita Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Receita Recorrente</CardTitle>
              <CardDescription>
                Evolução da receita mensal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => format(new Date(value), 'MMM/yy', { locale: ptBR })}
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMMM yyyy', { locale: ptBR })}
                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8b5cf6" 
                    name="Receita"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Parceiros */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Parceiros</CardTitle>
            <CardDescription>
              Maiores parceiros por número de colaboradores e utilização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topPartners.map((partner, index) => (
                <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-muted-foreground">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{partner.businessName}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {partner.employeeCount} colaboradores
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {partner.appointmentCount} consultas
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      R$ {partner.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">por mês</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Faixa de Colaboradores */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Faixa de Colaboradores</CardTitle>
            <CardDescription>
              Parceiros agrupados por tamanho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.employeeTierDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Parceiros" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}