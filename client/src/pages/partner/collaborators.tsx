import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  UserPlus, 
  Users, 
  Mail, 
  Calendar, 
  Building, 
  Shield,
  Edit,
  Trash,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface Collaborator {
  id: number;
  userId: number;
  role: 'admin' | 'manager' | 'collaborator';
  department: string | null;
  status: 'pending' | 'active' | 'inactive';
  invitationSentAt: string | null;
  invitationAcceptedAt: string | null;
  canManageServices: boolean;
  canViewAnalytics: boolean;
  canManageCollaborators: boolean;
  canAccessBilling: boolean;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    phone: string | null;
    profileImage: string | null;
  };
}

interface SubscriptionInfo {
  plan: {
    planName: string;
    planType: string;
    maxCollaborators: number | null;
  };
  activeCollaborators: number;
  isFreePlan: boolean;
}

export default function PartnerCollaborators() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  
  console.log('🔍 [PartnerCollaborators] Componente renderizando, user:', user);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    department: "",
    role: "collaborator" as const,
    permissions: {
      canManageServices: false,
      canViewAnalytics: false,
      canManageCollaborators: false,
      canAccessBilling: false
    }
  });

  useEffect(() => {
    if (user?.role !== 'partner') {
      navigate('/');
      return;
    }
    
    fetchCollaborators();
    fetchSubscriptionInfo();
  }, [user, navigate]);

  const fetchCollaborators = async () => {
    try {
      console.log('🔍 [Collaborators] Fazendo requisição para /api/partners/collaborators');
      const token = localStorage.getItem('token');
      console.log('🔍 [Collaborators] Token presente?', !!token);
      
      const response = await fetch('/api/partners/collaborators', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 [Collaborators] Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [Collaborators] Erro na resposta:', errorData);
        throw new Error(errorData.error || 'Erro ao buscar colaboradores');
      }
      
      const data = await response.json();
      console.log('✅ [Collaborators] Dados recebidos:', data);
      setCollaborators(data);
    } catch (error: any) {
      console.error('❌ [Collaborators] Erro completo:', error);
      toast.error(error.message || 'Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch('/api/partners/subscription/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Erro ao buscar informações da assinatura');
      
      const data = await response.json();
      setSubscriptionInfo(data);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleInvite = async () => {
    try {
      const response = await fetch('/api/partners/collaborators/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar convite');
      }
      
      toast.success('Convite enviado com sucesso!');
      setShowInviteDialog(false);
      setFormData({
        email: "",
        fullName: "",
        department: "",
        role: "collaborator",
        permissions: {
          canManageServices: false,
          canViewAnalytics: false,
          canManageCollaborators: false,
          canAccessBilling: false
        }
      });
      fetchCollaborators();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar convite');
    }
  };

  const handleUpdate = async (collaborator: Collaborator) => {
    try {
      const response = await fetch(`/api/partners/collaborators/${collaborator.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          role: collaborator.role,
          department: collaborator.department,
          permissions: {
            canManageServices: collaborator.canManageServices,
            canViewAnalytics: collaborator.canViewAnalytics,
            canManageCollaborators: collaborator.canManageCollaborators,
            canAccessBilling: collaborator.canAccessBilling
          }
        })
      });
      
      if (!response.ok) throw new Error('Erro ao atualizar colaborador');
      
      toast.success('Colaborador atualizado com sucesso!');
      setEditingCollaborator(null);
      fetchCollaborators();
    } catch (error) {
      toast.error('Erro ao atualizar colaborador');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este colaborador?')) return;
    
    try {
      const response = await fetch(`/api/partners/collaborators/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Erro ao remover colaborador');
      
      toast.success('Colaborador removido com sucesso!');
      fetchCollaborators();
    } catch (error) {
      toast.error('Erro ao remover colaborador');
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMap = {
      admin: { label: 'Administrador', variant: 'destructive' },
      manager: { label: 'Gerente', variant: 'default' },
      collaborator: { label: 'Colaborador', variant: 'secondary' }
    };
    
    const roleInfo = roleMap[role as keyof typeof roleMap] || roleMap.collaborator;
    
    return (
      <Badge variant={roleInfo.variant as any}>
        <Shield className="h-3 w-3 mr-1" />
        {roleInfo.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Ativo', icon: CheckCircle, variant: 'success' },
      pending: { label: 'Convite Pendente', icon: Clock, variant: 'warning' },
      inactive: { label: 'Inativo', icon: AlertCircle, variant: 'secondary' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.inactive;
    const Icon = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant as any}>
        <Icon className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
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

  const canInviteMore = !subscriptionInfo?.plan.maxCollaborators || 
    (subscriptionInfo.activeCollaborators < subscriptionInfo.plan.maxCollaborators);
  
  try {

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Colaboradores
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os colaboradores da sua empresa
          </p>
        </div>

      {/* Card de informações do plano */}
      {subscriptionInfo && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plano Atual</p>
                <p className="text-lg font-semibold">{subscriptionInfo.plan.planName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Colaboradores</p>
                <p className="text-2xl font-bold">
                  {subscriptionInfo.activeCollaborators}
                  {subscriptionInfo.plan.maxCollaborators && (
                    <span className="text-sm text-muted-foreground">
                      /{subscriptionInfo.plan.maxCollaborators}
                    </span>
                  )}
                </p>
              </div>
              {!canInviteMore && (
                <Badge variant="warning">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Limite atingido
                </Badge>
              )}
            </div>
            {!canInviteMore && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Você atingiu o limite de colaboradores do seu plano. 
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-yellow-800 underline"
                    onClick={() => navigate('/partner/subscription')}
                  >
                    Faça upgrade para adicionar mais colaboradores
                  </Button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botão de adicionar colaborador */}
      <div className="mb-6">
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button disabled={!canInviteMore}>
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Convidar Colaborador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    placeholder="João Silva"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    placeholder="Vendas, RH, etc."
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Função</Label>
                  <Select 
                    value={formData.role}
                    onValueChange={(value: any) => setFormData({...formData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collaborator">Colaborador</SelectItem>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Permissões</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manage-services" className="font-normal cursor-pointer">
                      Gerenciar Serviços
                    </Label>
                    <Switch
                      id="manage-services"
                      checked={formData.permissions.canManageServices}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData, 
                          permissions: {...formData.permissions, canManageServices: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="view-analytics" className="font-normal cursor-pointer">
                      Visualizar Relatórios
                    </Label>
                    <Switch
                      id="view-analytics"
                      checked={formData.permissions.canViewAnalytics}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData, 
                          permissions: {...formData.permissions, canViewAnalytics: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manage-collaborators" className="font-normal cursor-pointer">
                      Gerenciar Colaboradores
                    </Label>
                    <Switch
                      id="manage-collaborators"
                      checked={formData.permissions.canManageCollaborators}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData, 
                          permissions: {...formData.permissions, canManageCollaborators: checked}
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="access-billing" className="font-normal cursor-pointer">
                      Acessar Faturamento
                    </Label>
                    <Switch
                      id="access-billing"
                      checked={formData.permissions.canAccessBilling}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData, 
                          permissions: {...formData.permissions, canAccessBilling: checked}
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              
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
      </div>

      {/* Tabela de colaboradores */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data do Convite</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaborators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum colaborador cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                collaborators.map((collaborator) => (
                  <TableRow key={collaborator.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {collaborator.user.profileImage ? (
                          <img 
                            src={collaborator.user.profileImage} 
                            alt={collaborator.user.fullName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {collaborator.user.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{collaborator.user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{collaborator.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {collaborator.department ? (
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {collaborator.department}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getRoleBadge(collaborator.role)}</TableCell>
                    <TableCell>{getStatusBadge(collaborator.status)}</TableCell>
                    <TableCell>
                      {collaborator.invitationSentAt ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(collaborator.invitationSentAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {collaborator.canManageServices && (
                          <Badge variant="outline" className="text-xs">Serviços</Badge>
                        )}
                        {collaborator.canViewAnalytics && (
                          <Badge variant="outline" className="text-xs">Relatórios</Badge>
                        )}
                        {collaborator.canManageCollaborators && (
                          <Badge variant="outline" className="text-xs">Colaboradores</Badge>
                        )}
                        {collaborator.canAccessBilling && (
                          <Badge variant="outline" className="text-xs">Faturamento</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCollaborator(collaborator)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(collaborator.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      {editingCollaborator && (
        <Dialog open={!!editingCollaborator} onOpenChange={() => setEditingCollaborator(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Colaborador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Colaborador</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {editingCollaborator.user.fullName} ({editingCollaborator.user.email})
                </p>
              </div>
              
              <div>
                <Label htmlFor="edit-department">Departamento</Label>
                <Input
                  id="edit-department"
                  value={editingCollaborator.department || ''}
                  onChange={(e) => setEditingCollaborator({
                    ...editingCollaborator,
                    department: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-role">Função</Label>
                <Select 
                  value={editingCollaborator.role}
                  onValueChange={(value: any) => setEditingCollaborator({
                    ...editingCollaborator,
                    role: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collaborator">Colaborador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Permissões</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-manage-services" className="font-normal cursor-pointer">
                      Gerenciar Serviços
                    </Label>
                    <Switch
                      id="edit-manage-services"
                      checked={editingCollaborator.canManageServices}
                      onCheckedChange={(checked) => 
                        setEditingCollaborator({
                          ...editingCollaborator,
                          canManageServices: checked
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-view-analytics" className="font-normal cursor-pointer">
                      Visualizar Relatórios
                    </Label>
                    <Switch
                      id="edit-view-analytics"
                      checked={editingCollaborator.canViewAnalytics}
                      onCheckedChange={(checked) => 
                        setEditingCollaborator({
                          ...editingCollaborator,
                          canViewAnalytics: checked
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-manage-collaborators" className="font-normal cursor-pointer">
                      Gerenciar Colaboradores
                    </Label>
                    <Switch
                      id="edit-manage-collaborators"
                      checked={editingCollaborator.canManageCollaborators}
                      onCheckedChange={(checked) => 
                        setEditingCollaborator({
                          ...editingCollaborator,
                          canManageCollaborators: checked
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-access-billing" className="font-normal cursor-pointer">
                      Acessar Faturamento
                    </Label>
                    <Switch
                      id="edit-access-billing"
                      checked={editingCollaborator.canAccessBilling}
                      onCheckedChange={(checked) => 
                        setEditingCollaborator({
                          ...editingCollaborator,
                          canAccessBilling: checked
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingCollaborator(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => handleUpdate(editingCollaborator)}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </DashboardLayout>
  );
  } catch (error) {
    console.error('❌ [PartnerCollaborators] Erro ao renderizar:', error);
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Erro ao carregar página</h2>
            <p className="text-red-600 mt-2">Ocorreu um erro ao carregar a página de colaboradores.</p>
            <p className="text-sm text-red-500 mt-1">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
}