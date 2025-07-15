import React, { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { getCurrentPartner, getPartnerServicesByPartnerId } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  Heart,
  AlertCircle,
  Building,
  UserCheck,
  UserX,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Award,
  Target,
  Briefcase,
  CheckCircle,
  XCircle,
  Timer,
  Stethoscope,
  MapPin,
  ChevronRight,
  Zap,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

// Interfaces para os dados
interface CollaboratorAnalytics {
  totalCollaborators: number;
  activeCollaborators: number;
  inactiveCollaborators: number;
  pendingInvites: number;
  collaboratorsByDepartment: { department: string; count: number }[];
  collaboratorActivity: { date: string; logins: number; consultations: number }[];
  healthMetrics: {
    totalConsultations: number;
    emergencyConsultations: number;
    scheduledConsultations: number;
    averageConsultationDuration: number;
    satisfactionRate: number;
  };
  attestations: {
    total: number;
    thisMonth: number;
    averageDuration: number;
    byType: { type: string; count: number; percentage: number }[];
  };
  financialMetrics: {
    totalSaved: number;
    averageSavingsPerConsultation: number;
    subscriptionUtilization: number;
  };
}

// Componente de métrica animada
const AnimatedMetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = "primary",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  color?: string;
}) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden"
    >
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <motion.h3
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-xl sm:text-3xl font-bold"
                >
                  {value}
                </motion.h3>
                {trend && (
                  <Badge
                    variant={trend === "up" ? "success" : "destructive"}
                    className="flex items-center gap-1"
                  >
                    {trend === "up" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {trendValue}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div
              className={cn(
                "p-3 rounded-lg",
                colorClasses[color as keyof typeof colorClasses]
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          </div>
          
          {/* Decorative gradient line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.2 }}
            className={cn(
              "absolute bottom-0 left-0 h-1",
              color === "primary" && "bg-gradient-to-r from-primary/60 to-primary",
              color === "success" && "bg-gradient-to-r from-green-400 to-green-600",
              color === "warning" && "bg-gradient-to-r from-yellow-400 to-yellow-600",
              color === "danger" && "bg-gradient-to-r from-red-400 to-red-600",
              color === "info" && "bg-gradient-to-r from-blue-400 to-blue-600"
            )}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente principal do dashboard
export const PartnerDashboardEnhanced: React.FC = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // Queries para buscar dados
  const { data: partnerInfo } = useQuery({
    queryKey: ["/api/partners/me"],
    queryFn: getCurrentPartner,
    enabled: !!user?.id,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/partners/analytics", selectedPeriod],
    queryFn: async () => {
      const res = await fetch(`/api/partners/analytics?period=${selectedPeriod}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!res.ok) {
        throw new Error("Erro ao buscar analytics");
      }
      
      return res.json() as Promise<CollaboratorAnalytics>;
    },
    enabled: !!user?.id,
  });

  // Cores para os gráficos
  const chartColors = {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#06b6d4",
  };

  const pieColors = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.success,
    chartColors.warning,
    chartColors.danger,
  ];

  return (
    <div className="space-y-6">
      {/* Header com saudação animada */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg sm:rounded-xl p-4 sm:p-8 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <Badge variant="secondary" className="font-normal">
              Dashboard Corporativo
            </Badge>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold mb-2">
            Olá, {user?.fullName}! 👋
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Acompanhe o desempenho e a saúde da sua equipe com insights em tempo real.
            Gerencie colaboradores, monitore indicadores de RH e otimize os benefícios de saúde.
          </p>
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Link href="/partner/collaborators">
              <Button className="group w-full sm:w-auto">
                <Users className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                Gerenciar Colaboradores
              </Button>
            </Link>
            <Link href="/partner/services">
              <Button variant="outline" className="group w-full sm:w-auto">
                <Briefcase className="mr-2 h-4 w-4" />
                Serviços
                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Decoração de fundo */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
          <div className="w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
      </motion.div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedMetricCard
          title="Total de Colaboradores"
          value={analytics?.totalCollaborators || 0}
          subtitle={`${analytics?.activeCollaborators || 0} ativos`}
          icon={Users}
          color="primary"
        />
        <AnimatedMetricCard
          title="Consultas Realizadas"
          value={analytics?.healthMetrics.totalConsultations || 0}
          subtitle="Últimos 30 dias"
          icon={Stethoscope}
          color="success"
        />
        <AnimatedMetricCard
          title="Atestados Emitidos"
          value={analytics?.attestations.thisMonth || 0}
          subtitle={analytics?.attestations.averageDuration ? 
            `Média de ${analytics.attestations.averageDuration} dias` : 
            "Dados em processamento"
          }
          icon={FileText}
          color="warning"
        />
        <AnimatedMetricCard
          title="Economia Gerada"
          value={`R$ ${((analytics?.financialMetrics.totalSaved || 0) / 100).toLocaleString('pt-BR')}`}
          subtitle="vs. consultas particulares"
          icon={DollarSign}
          color="info"
        />
      </div>

      {/* Tabs com conteúdo detalhado */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="overflow-x-auto pb-2">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl min-w-[300px]">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
              Saúde
            </TabsTrigger>
            <TabsTrigger value="hr" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">RH Insights</span>
              <span className="sm:hidden">RH</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Financeiro</span>
              <span className="sm:hidden">Fin.</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Atividade dos Colaboradores */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg">Consultas Realizadas</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Histórico de consultas nos últimos 30 dias
                      </CardDescription>
                    </div>
                    <Activity className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <AreaChart data={analytics?.collaboratorActivity || []}>
                      <defs>
                        <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorConsultations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={chartColors.success} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        className="text-xs"
                        tick={{ fill: "#888" }}
                      />
                      <YAxis className="text-xs" tick={{ fill: "#888" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      {/* TODO: Descomentar quando implementarmos tracking de logins
                      <Area
                        type="monotone"
                        dataKey="logins"
                        stroke={chartColors.primary}
                        fillOpacity={1}
                        fill="url(#colorLogins)"
                        name="Logins"
                      />
                      */}
                      <Area
                        type="monotone"
                        dataKey="consultations"
                        stroke={chartColors.success}
                        fillOpacity={1}
                        fill="url(#colorConsultations)"
                        name="Consultas"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Colaboradores por Departamento */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg">Distribuição por Departamento</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Colaboradores ativos por setor
                      </CardDescription>
                    </div>
                    <Building className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics?.collaboratorsByDepartment || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ department, count, percent }) => (
                          `${department}: ${count} (${(percent * 100).toFixed(0)}%)`
                        )}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(analytics?.collaboratorsByDepartment || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Lista de departamentos */}
                  <div className="mt-4 space-y-2">
                    {analytics?.collaboratorsByDepartment.map((dept, index) => (
                      <div key={dept.department} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: pieColors[index % pieColors.length] }}
                          />
                          <span className="text-sm">{dept.department}</span>
                        </div>
                        <span className="text-sm font-medium">{dept.count} pessoas</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Status dos Colaboradores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Status dos Colaboradores</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Visão detalhada do status atual da equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="text-xs sm:text-sm font-medium">Ativos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg sm:text-2xl font-bold">
                        {analytics?.activeCollaborators || 0}
                      </span>
                      <Badge variant="success" className="text-xs">
                        {((analytics?.activeCollaborators || 0) / (analytics?.totalCollaborators || 1) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress
                      value={(analytics?.activeCollaborators || 0) / (analytics?.totalCollaborators || 1) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-red-600" />
                      <span className="text-xs sm:text-sm font-medium">Inativos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg sm:text-2xl font-bold">
                        {analytics?.inactiveCollaborators || 0}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        {((analytics?.inactiveCollaborators || 0) / (analytics?.totalCollaborators || 1) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress
                      value={(analytics?.inactiveCollaborators || 0) / (analytics?.totalCollaborators || 1) * 100}
                      className="h-2 [&>div]:bg-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-xs sm:text-sm font-medium">Convites Pendentes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg sm:text-2xl font-bold">
                        {analytics?.pendingInvites || 0}
                      </span>
                    </div>
                    <Progress
                      value={(analytics?.pendingInvites || 0) / (analytics?.totalCollaborators || 1) * 100}
                      className="h-2 [&>div]:bg-yellow-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-xs sm:text-sm font-medium">Taxa de Adesão</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg sm:text-2xl font-bold">
                        {(((analytics?.activeCollaborators || 0) / (analytics?.totalCollaborators || 1)) * 100).toFixed(0)}%
                      </span>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <Progress
                      value={(analytics?.activeCollaborators || 0) / (analytics?.totalCollaborators || 1) * 100}
                      className="h-2 [&>div]:bg-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Tab: Saúde */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tipos de Consulta */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Tipos de Consulta</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Distribuição entre consultas agendadas e emergências
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="10%"
                      outerRadius="80%"
                      data={[
                        {
                          name: "Emergências",
                          value: analytics?.healthMetrics.emergencyConsultations || 0,
                          fill: chartColors.danger,
                        },
                        {
                          name: "Agendadas",
                          value: analytics?.healthMetrics.scheduledConsultations || 0,
                          fill: chartColors.success,
                        },
                      ]}
                    >
                      <RadialBar dataKey="value" cornerRadius={10} />
                      <Tooltip />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  
                  <div className="flex justify-center gap-4 sm:gap-8 mt-4">
                    <div className="text-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm">Agendadas</span>
                      </div>
                      <p className="text-lg sm:text-2xl font-bold mt-1">
                        {analytics?.healthMetrics.scheduledConsultations || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm">Emergências</span>
                      </div>
                      <p className="text-lg sm:text-2xl font-bold mt-1">
                        {analytics?.healthMetrics.emergencyConsultations || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Métricas de Saúde */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Indicadores de Saúde</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Principais métricas de utilização e satisfação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Timer className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                      <div>
                        <p className="text-xs sm:text-sm font-medium">Tempo Médio de Consulta</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          Duração média das consultas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg sm:text-2xl font-bold">
                        {analytics?.healthMetrics.averageConsultationDuration ? 
                          `${analytics.healthMetrics.averageConsultationDuration} min` : 
                          "Em breve"
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Award className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                      <div>
                        <p className="text-xs sm:text-sm font-medium">Taxa de Satisfação</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          Avaliação média das consultas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg sm:text-2xl font-bold">
                        {analytics?.healthMetrics.satisfactionRate || 0}%
                      </p>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Zap
                            key={star}
                            className={cn(
                              "h-4 w-4",
                              star <= Math.round((analytics?.healthMetrics.satisfactionRate || 0) / 20)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                      <div>
                        <p className="text-xs sm:text-sm font-medium">Taxa de Utilização</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          Colaboradores que usaram o benefício
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg sm:text-2xl font-bold">
                        {analytics?.financialMetrics.subscriptionUtilization || 0}%
                      </p>
                      <Progress
                        value={analytics?.financialMetrics.subscriptionUtilization || 0}
                        className="w-20 h-2 mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Atestados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Análise de Atestados</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Distribuição e tipos de atestados emitidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                  <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xl sm:text-3xl font-bold">{analytics?.attestations.total || 0}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total de Atestados</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xl sm:text-3xl font-bold">{analytics?.attestations.thisMonth || 0}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Este Mês</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xl sm:text-3xl font-bold">
                      {analytics?.attestations.averageDuration || "-"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Dias em Média</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.attestations.byType || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="type" className="text-xs" tick={{ fill: "#888" }} />
                    <YAxis className="text-xs" tick={{ fill: "#888" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill={chartColors.primary} radius={[8, 8, 0, 0]}>
                      {(analytics?.attestations.byType || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Tab: RH Insights */}
        <TabsContent value="hr" className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Insights para RH</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Informações estratégicas para gestão de pessoas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Absenteísmo */}
                  <div className="space-y-4">
                    <h4 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                      Análise de Absenteísmo
                    </h4>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-orange-800">
                        Análise de absenteísmo disponível em breve. 
                        Estamos coletando dados para fornecer insights precisos.
                      </p>
                    </div>
                  </div>

                  {/* Produtividade */}
                  <div className="space-y-4">
                    <h4 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      Impacto na Produtividade
                    </h4>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-green-800">
                        Métricas de produtividade em desenvolvimento. 
                        Em breve você poderá acompanhar o impacto positivo na produtividade.
                      </p>
                    </div>
                  </div>

                  {/* Bem-estar */}
                  <div className="space-y-4">
                    <h4 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                      Indicadores de Bem-estar
                    </h4>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-red-800">
                        Indicadores de bem-estar serão calculados com base nas avaliações das consultas.
                        Taxa de satisfação atual: {analytics?.healthMetrics.satisfactionRate?.toFixed(1) || 0}%
                      </p>
                    </div>
                  </div>

                  {/* Retenção */}
                  <div className="space-y-4">
                    <h4 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      Impacto na Retenção
                    </h4>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-blue-800">
                        Análise de retenção em desenvolvimento. 
                        Acompanhe como o benefício CN Vidas impacta na retenção de talentos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recomendações */}
                <div className="mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Recomendações Baseadas em Dados
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-xs sm:text-sm">
                        Implementar campanha de conscientização no departamento de Vendas para reduzir absenteísmo
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-xs sm:text-sm">
                        Promover consultas preventivas para reduzir emergências em 15%
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-xs sm:text-sm">
                        Criar programa de reconhecimento para colaboradores com alta adesão ao benefício
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Tab: Financeiro */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ROI do Benefício */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">ROI do Benefício</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Retorno sobre investimento em saúde
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 sm:p-6 bg-green-50 rounded-lg">
                      <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl sm:text-4xl font-bold text-green-700">
                        {analytics?.financialMetrics.totalSaved && analytics?.totalCollaborators ? 
                          `${(analytics.financialMetrics.totalSaved / (analytics.totalCollaborators * 360)).toFixed(1)}x` : 
                          "Calculando..."
                        }
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Retorno estimado para cada R$ 1 investido
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-xs sm:text-sm">Investimento Mensal</span>
                        <span className="font-medium">
                          R$ {((analytics?.totalCollaborators || 0) * 360).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-xs sm:text-sm">Economia Gerada</span>
                        <span className="font-medium text-green-600">
                          R$ {(analytics?.financialMetrics.totalSaved || 0).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-xs sm:text-sm">Economia Líquida</span>
                        <span className="font-bold text-green-700">
                          R$ {((analytics?.financialMetrics.totalSaved || 0) - ((analytics?.totalCollaborators || 0) * 360)).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Comparativo de Custos */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Comparativo de Custos</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    CN Vidas vs. Mercado tradicional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          tipo: "Consulta Particular",
                          valor: 350,
                        },
                        {
                          tipo: "Plano de Saúde",
                          valor: 280,
                        },
                        {
                          tipo: "CN Vidas",
                          valor: 90,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="tipo" className="text-xs" tick={{ fill: "#888" }} />
                      <YAxis className="text-xs" tick={{ fill: "#888" }} />
                      <Tooltip
                        formatter={(value: any) => `R$ ${value}`}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                        <Cell fill={chartColors.danger} />
                        <Cell fill={chartColors.warning} />
                        <Cell fill={chartColors.success} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-4 p-3 sm:p-4 bg-green-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-green-800">
                      <strong>Economia média de 74%</strong> em relação a consultas particulares
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Projeção de Economia */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Projeção de Economia Anual</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Estimativa baseada no uso atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={(() => {
                      const monthlyAverage = (analytics?.financialMetrics.totalSaved || 0) / 30; // Média diária * 30
                      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                      return months.map((mes, index) => ({
                        mes,
                        economia: Math.round(monthlyAverage * (index + 1))
                      }));
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" tick={{ fill: "#888" }} />
                    <YAxis className="text-xs" tick={{ fill: "#888" }} />
                    <Tooltip
                      formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="economia"
                      stroke={chartColors.success}
                      strokeWidth={3}
                      dot={{ fill: chartColors.success, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">
                      R$ {((analytics?.financialMetrics.totalSaved || 0) * 12).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Economia Projetada Anual</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <Target className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">
                      R$ {analytics?.financialMetrics.averageSavingsPerConsultation || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Economia por Consulta</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                    <Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">
                      {analytics?.financialMetrics.subscriptionUtilization || 0}%
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Taxa de Utilização</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg sm:rounded-xl p-4 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-2xl font-bold mb-2">
              Maximize o Potencial do seu Time
            </h3>
            <p className="text-sm sm:text-base text-white/90 max-w-2xl">
              Aumente a utilização do benefício e melhore os indicadores de saúde da sua equipe.
              Nossa equipe de sucesso está pronta para ajudar.
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto"
            >
              Agendar Consultoria
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PartnerDashboardEnhanced;