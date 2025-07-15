import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Building2, 
  Users, 
  Calendar, 
  MoreVertical, 
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileText,
  Eye,
  Edit,
  Ban,
  Power
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PartnerWithStats {
  id: number;
  userId: number;
  businessName: string;
  cnpj: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
  subscription: {
    planType: string;
    status: string;
    employeeTier: string;
    billingPeriod: string;
  } | null;
  stats: {
    employeeCount: number;
    pendingInvites: number;
    monthlyAppointments: number;
  };
}

export default function AdminPartnersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/partners", page, searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter })
      });
      
      const response = await apiRequest('GET', `/api/admin/partners?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar parceiros');
      return response.json();
    }
  });

  const handleStatusChange = async (partnerId: number, newStatus: string) => {
    try {
      const response = await apiRequest('PATCH', `/api/admin/partners/${partnerId}/status`, {
        status: newStatus
      });

      if (!response.ok) throw new Error('Falha ao alterar status');

      toast({
        title: "Status atualizado",
        description: `Parceiro ${newStatus === 'active' ? 'ativado' : newStatus === 'suspended' ? 'suspenso' : 'desativado'} com sucesso.`,
      });

      refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do parceiro.",
        variant: "destructive"
      });
    }
  };

  const getPlanBadge = (planType: string | undefined) => {
    if (!planType) return null;
    
    const planColors: Record<string, string> = {
      'free_corp': 'bg-gray-100 text-gray-700',
      'basic_corp': 'bg-emerald-100 text-emerald-700',
      'premium_corp': 'bg-amber-100 text-amber-700',
      'ultra_corp': 'bg-violet-100 text-violet-700'
    };

    const planNames: Record<string, string> = {
      'free_corp': 'Gratuito',
      'basic_corp': 'Básico',
      'premium_corp': 'Premium',
      'ultra_corp': 'Ultra'
    };

    return (
      <Badge className={planColors[planType] || 'bg-gray-100 text-gray-700'}>
        {planNames[planType] || planType}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'active': { color: 'bg-green-100 text-green-700', label: 'Ativo' },
      'inactive': { color: 'bg-gray-100 text-gray-700', label: 'Inativo' },
      'suspended': { color: 'bg-red-100 text-red-700', label: 'Suspenso' }
    };

    const config = statusConfig[status] || statusConfig['inactive'];
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Gestão de Parceiros Corporativos
          </h1>
          <p className="text-muted-foreground">
            Gerencie todos os parceiros e suas assinaturas corporativas
          </p>
        </div>

        {/* Estatísticas gerais */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Parceiros</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.pagination.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Empresas cadastradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parceiros Ativos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.partners.filter((p: PartnerWithStats) => p.status === 'active').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Com assinatura ativa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.partners.reduce((acc: number, p: PartnerWithStats) => 
                  acc + p.stats.employeeCount, 0
                ) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Vidas atendidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultas do Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.partners.reduce((acc: number, p: PartnerWithStats) => 
                  acc + p.stats.monthlyAppointments, 0
                ) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Realizadas este mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Parceiros</CardTitle>
            <CardDescription>
              Lista completa de empresas parceiras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="suspended">Suspensos</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setLocation('/admin/partners/reports')}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Relatórios
              </Button>
            </div>

            {/* Tabela de parceiros */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-center">Colaboradores</TableHead>
                    <TableHead className="text-center">Consultas/Mês</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : data?.partners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum parceiro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.partners.map((partner: PartnerWithStats) => (
                      <TableRow key={partner.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{partner.businessName}</p>
                            <p className="text-sm text-muted-foreground">{partner.cnpj}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{partner.user.fullName}</p>
                            <p className="text-xs text-muted-foreground">{partner.contactEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {partner.subscription ? (
                            <div className="space-y-1">
                              {getPlanBadge(partner.subscription.planType)}
                              <p className="text-xs text-muted-foreground">
                                {partner.subscription.billingPeriod === 'monthly' ? 'Mensal' :
                                 partner.subscription.billingPeriod === 'semiannual' ? 'Semestral' : 'Anual'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Sem plano</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div>
                            <p className="font-medium">{partner.stats.employeeCount}</p>
                            {partner.stats.pendingInvites > 0 && (
                              <p className="text-xs text-amber-600">
                                +{partner.stats.pendingInvites} pendentes
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {partner.stats.monthlyAppointments}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(partner.status)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(partner.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setLocation(`/admin/partners/${partner.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setLocation(`/admin/partners/${partner.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {partner.status === 'active' ? (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(partner.id, 'inactive')}
                                  >
                                    <Power className="h-4 w-4 mr-2" />
                                    Desativar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(partner.id, 'suspended')}
                                    className="text-red-600"
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Suspender
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(partner.id, 'active')}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Ativar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {data?.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, data.pagination.total)} de {data.pagination.total} parceiros
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pagination.totalPages}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}