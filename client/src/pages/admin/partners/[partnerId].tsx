import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import AdminLayout from "@/components/layouts/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Users, 
  Calendar, 
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  TrendingUp,
  UserX,
  Send,
  X,
  Check,
  Clock,
  Edit,
  Save,
  AlertCircle,
  ChevronLeft,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminPartnerDetailsPage() {
  const { partnerId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [editingSubscription, setEditingSubscription] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState({
    planType: '',
    employeeTier: '',
    billingPeriod: '',
    discountPercentage: '0',
    status: 'active'
  });

  const { data: partnerData, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/partners", partnerId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/partners/${partnerId}`);
      if (!response.ok) throw new Error('Falha ao carregar dados do parceiro');
      return response.json();
    }
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (data: typeof subscriptionData) => {
      const response = await apiRequest('PUT', `/api/admin/partners/${partnerId}/subscription`, data);
      if (!response.ok) throw new Error('Falha ao atualizar assinatura');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assinatura atualizada",
        description: "A assinatura foi atualizada com sucesso.",
      });
      setEditingSubscription(false);
      refetch();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a assinatura.",
        variant: "destructive"
      });
    }
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      const response = await apiRequest('POST', `/api/admin/partners/${partnerId}/invites/${inviteId}/resend`);
      if (!response.ok) throw new Error('Falha ao reenviar convite');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Convite reenviado",
        description: "O convite foi reenviado com sucesso.",
      });
      refetch();
    }
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/partners/${partnerId}/invites/${inviteId}`);
      if (!response.ok) throw new Error('Falha ao cancelar convite');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Convite cancelado",
        description: "O convite foi cancelado com sucesso.",
      });
      refetch();
    }
  });

  const removeEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/partners/${partnerId}/employees/${employeeId}`);
      if (!response.ok) throw new Error('Falha ao remover colaborador');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Colaborador removido",
        description: "O colaborador foi removido com sucesso.",
      });
      refetch();
    }
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!partnerData) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Parceiro não encontrado</p>
        </div>
      </AdminLayout>
    );
  }

  const { partner, user, subscription, employees, invites, appointmentStats } = partnerData;

  // Preparar dados para gráficos
  const appointmentsByMonth = appointmentStats.reduce((acc: any[], stat: any) => {
    const month = format(new Date(stat.month), 'MMM/yy', { locale: ptBR });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.total += parseInt(stat.count);
    } else {
      acc.push({ month, total: parseInt(stat.count) });
    }
    return acc;
  }, []);

  const getInviteStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      'pending': { color: 'bg-yellow-100 text-yellow-700', label: 'Pendente' },
      'accepted': { color: 'bg-green-100 text-green-700', label: 'Aceito' },
      'cancelled': { color: 'bg-red-100 text-red-700', label: 'Cancelado' }
    };
    
    const { color, label } = config[status] || config['pending'];
    return <Badge className={color}>{label}</Badge>;
  };

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
                <Building2 className="h-6 w-6" />
                {partner.businessName}
              </h1>
              <p className="text-muted-foreground">
                CNPJ: {partner.cnpj}
              </p>
            </div>
          </div>
          <Button onClick={() => setLocation(`/admin/partners/${partnerId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Parceiro
          </Button>
        </div>

        {/* Informações gerais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Responsável</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{user.fullName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Contato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {partner.contactEmail}
                </p>
                <p className="text-sm flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {partner.contactPhone}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{employees.length}</p>
              <p className="text-sm text-muted-foreground">
                {invites.filter((i: any) => i.status === 'pending').length} convites pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={
                partner.status === 'active' ? 'bg-green-100 text-green-700' :
                partner.status === 'suspended' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }>
                {partner.status === 'active' ? 'Ativo' :
                 partner.status === 'suspended' ? 'Suspenso' : 'Inativo'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Desde {format(new Date(partner.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de conteúdo */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="subscription">Assinatura</TabsTrigger>
            <TabsTrigger value="employees">Colaboradores</TabsTrigger>
            <TabsTrigger value="invites">Convites</TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Uso</CardTitle>
                <CardDescription>
                  Consultas realizadas pelos colaboradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointmentsByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={appointmentsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Consultas"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma consulta realizada ainda
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Endereço */}
            {(partner.street || partner.city) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Endereço</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p>{partner.street}{partner.number ? `, ${partner.number}` : ''}</p>
                      {partner.complement && <p>{partner.complement}</p>}
                      <p>{partner.neighborhood} - {partner.city}/{partner.state}</p>
                      <p>CEP: {partner.zipcode}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Assinatura */}
          <TabsContent value="subscription" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Plano Corporativo</CardTitle>
                    <CardDescription>
                      Detalhes da assinatura atual
                    </CardDescription>
                  </div>
                  {!editingSubscription && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSubscriptionData({
                          planType: subscription?.planType || '',
                          employeeTier: subscription?.employeeTier || '',
                          billingPeriod: subscription?.billingPeriod || 'monthly',
                          discountPercentage: subscription?.discountPercentage || '0',
                          status: subscription?.status || 'active'
                        });
                        setEditingSubscription(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingSubscription ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Plano</Label>
                      <Select
                        value={subscriptionData.planType}
                        onValueChange={(value) => setSubscriptionData({...subscriptionData, planType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free_corp">Gratuito</SelectItem>
                          <SelectItem value="basic_corp">Básico</SelectItem>
                          <SelectItem value="premium_corp">Premium</SelectItem>
                          <SelectItem value="ultra_corp">Ultra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Faixa de Colaboradores</Label>
                      <Select
                        value={subscriptionData.employeeTier}
                        onValueChange={(value) => setSubscriptionData({...subscriptionData, employeeTier: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a faixa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5-50">5-50 colaboradores</SelectItem>
                          <SelectItem value="51-200">51-200 colaboradores</SelectItem>
                          <SelectItem value="201+">201+ colaboradores</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Período de Cobrança</Label>
                      <Select
                        value={subscriptionData.billingPeriod}
                        onValueChange={(value) => setSubscriptionData({...subscriptionData, billingPeriod: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="semiannual">Semestral (5% desc.)</SelectItem>
                          <SelectItem value="annual">Anual (8% desc.)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Desconto Adicional (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={subscriptionData.discountPercentage}
                        onChange={(e) => setSubscriptionData({...subscriptionData, discountPercentage: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label>Status</Label>
                      <Select
                        value={subscriptionData.status}
                        onValueChange={(value) => setSubscriptionData({...subscriptionData, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="suspended">Suspenso</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateSubscriptionMutation.mutate(subscriptionData)}
                        disabled={updateSubscriptionMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingSubscription(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : subscription ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Plano</p>
                        <p className="font-medium">
                          {subscription.planType === 'free_corp' ? 'Gratuito' :
                           subscription.planType === 'basic_corp' ? 'Básico' :
                           subscription.planType === 'premium_corp' ? 'Premium' : 'Ultra'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={
                          subscription.status === 'active' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {subscription.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Faixa de Colaboradores</p>
                        <p className="font-medium">{subscription.employeeTier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Período</p>
                        <p className="font-medium">
                          {subscription.billingPeriod === 'monthly' ? 'Mensal' :
                           subscription.billingPeriod === 'semiannual' ? 'Semestral' : 'Anual'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Desconto</p>
                        <p className="font-medium">{subscription.discountPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor por Colaborador</p>
                        <p className="font-medium">R$ {subscription.monthlyPricePerEmployee}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                          <p className="font-medium">
                            {format(new Date(subscription.nextBillingDate), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor estimado</p>
                          <p className="font-medium text-lg">
                            R$ {(parseFloat(subscription.monthlyPricePerEmployee) * employees.length).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma assinatura ativa</p>
                    <Button 
                      className="mt-4"
                      onClick={() => setEditingSubscription(true)}
                    >
                      Criar Assinatura
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Colaboradores */}
          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Colaboradores Ativos</CardTitle>
                <CardDescription>
                  Total de {employees.length} colaboradores registrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Consultas</TableHead>
                        <TableHead>Adicionado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum colaborador cadastrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        employees.map((emp: any) => (
                          <TableRow key={emp.employee.id}>
                            <TableCell className="font-medium">{emp.user.fullName}</TableCell>
                            <TableCell>{emp.user.email}</TableCell>
                            <TableCell>{emp.employee.department || '-'}</TableCell>
                            <TableCell>{emp.stats.appointmentCount}</TableCell>
                            <TableCell>
                              {format(new Date(emp.employee.createdAt), "dd/MM/yyyy", { locale: ptBR })}
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
                                    onClick={() => setLocation(`/admin/users/${emp.user.id}`)}
                                  >
                                    Ver perfil
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => removeEmployeeMutation.mutate(emp.employee.id)}
                                    className="text-red-600"
                                  >
                                    <UserX className="h-4 w-4 mr-2" />
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Convites */}
          <TabsContent value="invites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Convites Enviados</CardTitle>
                <CardDescription>
                  Gerenciar convites para colaboradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enviado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invites.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum convite enviado
                          </TableCell>
                        </TableRow>
                      ) : (
                        invites.map((invite: any) => (
                          <TableRow key={invite.id}>
                            <TableCell>{invite.email}</TableCell>
                            <TableCell>{invite.fullName || '-'}</TableCell>
                            <TableCell>
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {invite.inviteCode}
                              </code>
                            </TableCell>
                            <TableCell>{getInviteStatusBadge(invite.status)}</TableCell>
                            <TableCell>
                              {format(new Date(invite.sentAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-right">
                              {invite.status === 'pending' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => resendInviteMutation.mutate(invite.id)}
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Reenviar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => cancelInviteMutation.mutate(invite.id)}
                                      className="text-red-600"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Cancelar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}