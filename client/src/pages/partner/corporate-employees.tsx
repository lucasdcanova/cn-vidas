import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  UserPlus, 
  Users, 
  Mail, 
  Calendar, 
  Building2, 
  Trash,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  ChevronRight,
  FileText,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";

interface Employee {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  phone?: string;
  addedAt: string;
  lastActiveAt?: string;
  status: string;
}

interface PendingInvite {
  id: number;
  email: string;
  fullName?: string;
  invitedAt: string;
  expiresAt: string;
}

interface EmployeeData {
  employees: Employee[];
  pendingInvites: PendingInvite[];
  activeCount: number;
  totalCount: number;
}

interface CorporateSubscription {
  id: number;
  planType: string;
  employeeTier: string;
  status: string;
  currentBillingDate: string;
  nextBillingDate: string;
}

export default function CorporateEmployees() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [subscription, setSubscription] = useState<CorporateSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    email: "",
    fullName: ""
  });

  useEffect(() => {
    if (user?.role !== 'partner') {
      navigate('/');
      return;
    }
    
    fetchEmployees();
    fetchSubscription();
  }, [user, navigate]);

  const fetchEmployees = async () => {
    try {
      const response = await apiRequest('GET', '/api/corporate/employees');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar colaboradores');
      }
      
      const data = await response.json();
      setEmployeeData(data);
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.message || 'Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await apiRequest('GET', '/api/corporate/subscription/current');
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error);
    }
  };

  const handleInvite = async () => {
    try {
      const response = await apiRequest('POST', '/api/corporate/employees/invite', formData);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar convite');
      }
      
      toast.success('Convite enviado com sucesso!');
      setShowInviteDialog(false);
      setFormData({ email: "", fullName: "" });
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar convite');
    }
  };

  const handleRemove = async (employeeId: number) => {
    if (!confirm('Tem certeza que deseja remover este colaborador? O plano dele continuará ativo até o final do período já pago.')) {
      return;
    }
    
    try {
      const response = await apiRequest('DELETE', `/api/corporate/employees/${employeeId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao remover colaborador');
      }
      
      toast.success('Colaborador removido com sucesso!');
      fetchEmployees();
    } catch (error) {
      toast.error('Erro ao remover colaborador');
    }
  };

  const downloadReport = async (format: 'json' | 'csv') => {
    try {
      const response = await apiRequest('GET', `/api/corporate/reports/usage/${reportMonth}?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Erro ao gerar relatório');
      }
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${reportMonth}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${reportMonth}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      toast.success('Relatório baixado com sucesso!');
    } catch (error) {
      toast.error('Erro ao baixar relatório');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Ativo', icon: CheckCircle, variant: 'success' },
      pending: { label: 'Convite Pendente', icon: Clock, variant: 'warning' },
      removed: { label: 'Removido', icon: AlertCircle, variant: 'secondary' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.active;
    const Icon = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant as any}>
        <Icon className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const hasSubscription = !!subscription;
  const canInviteMore = hasSubscription;

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Colaboradores Corporativos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os colaboradores da sua empresa com plano corporativo
          </p>
        </div>

        {/* Alerta se não tem assinatura corporativa */}
        {!hasSubscription && (
          <Alert className="mb-6">
            <Building2 className="h-4 w-4" />
            <AlertTitle>Plano Corporativo Necessário</AlertTitle>
            <AlertDescription>
              Para convidar colaboradores, você precisa contratar um plano corporativo.
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2"
                onClick={() => navigate('/partner/corporate-plans')}
              >
                Ver planos corporativos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Card de informações do plano */}
        {subscription && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Plano Atual</p>
                  <p className="text-lg font-semibold">{getPlanDisplayName(subscription.planType)}</p>
                  <p className="text-sm text-muted-foreground">{subscription.employeeTier} vidas</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Colaboradores Ativos</p>
                  <p className="text-2xl font-bold">{employeeData?.activeCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Total com convites: {employeeData?.totalCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próxima Cobrança</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(subscription.nextBillingDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                  <Badge variant="success">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Assinatura Ativa
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões de ação */}
        <div className="mb-6 flex gap-4">
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button disabled={!canInviteMore}>
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Colaborador</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colaborador@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    placeholder="João Silva (opcional)"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
                
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Um email será enviado para o colaborador com instruções para acessar o plano de saúde corporativo.
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleInvite}>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Convite
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!hasSubscription}>
                <FileText className="h-4 w-4 mr-2" />
                Relatórios de Uso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Baixar Relatório de Uso</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="month">Mês do Relatório</Label>
                  <Input
                    id="month"
                    type="month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    max={new Date().toISOString().slice(0, 7)}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => downloadReport('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar CSV
                  </Button>
                  <Button onClick={() => downloadReport('json')}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar JSON
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabela de colaboradores ativos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Colaboradores Ativos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Adicionado em</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!employeeData?.employees || employeeData.employees.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum colaborador ativo
                    </TableCell>
                  </TableRow>
                ) : (
                  employeeData.employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="font-medium">{employee.fullName}</div>
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(employee.addedAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {employee.lastActiveAt ? (
                          format(new Date(employee.lastActiveAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        ) : (
                          <span className="text-muted-foreground">Nunca acessou</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(employee.id)}
                          title="Remover colaborador"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabela de convites pendentes */}
        {employeeData?.pendingInvites && employeeData.pendingInvites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Convites Pendentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeData.pendingInvites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell>{invite.fullName || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(invite.invitedAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invite.expiresAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{getStatusBadge('pending')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}