import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  DollarSign,
  Star,
  Activity,
  Clock,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Shield,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DoctorEditModal from "@/components/admin/doctor-edit-modal";
import DoctorCreateModal from "@/components/admin/doctor-create-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { User, Doctor } from "@/shared/types";

interface DoctorWithUser extends Doctor {
  user?: User;
  email?: string;
  phone?: string;
  fullName?: string;
  profileImage?: string;
}

const AdminDoctors: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all doctors
  const { data: doctors = [], isLoading } = useQuery<DoctorWithUser[]>({
    queryKey: ["/api/admin/doctors"],
    queryFn: async () => {
      // First get all users with doctor role
      const usersResponse = await fetch("/api/admin/users", {
        credentials: "include"
      });
      if (!usersResponse.ok) throw new Error("Failed to fetch users");
      const users = await usersResponse.json();
      
      // Filter doctors
      const doctorUsers = users.filter((u: User) => u.role === "doctor");
      
      // Get doctor profiles for each doctor user
      const doctorsWithProfiles = await Promise.all(
        doctorUsers.map(async (user: User) => {
          try {
            const doctorResponse = await fetch(`/api/doctors/user/${user.id}`, {
              credentials: "include"
            });
            if (doctorResponse.ok) {
              const doctorProfile = await doctorResponse.json();
              return {
                ...doctorProfile,
                user,
                email: user.email,
                phone: user.phone,
                fullName: user.fullName,
                profileImage: user.profileImage
              };
            }
          } catch (error) {
            console.error(`Error fetching doctor profile for user ${user.id}:`, error);
          }
          // Return basic doctor info if profile fetch fails
          return {
            id: 0,
            userId: user.id,
            name: user.fullName,
            email: user.email,
            phone: user.phone,
            profileImage: user.profileImage,
            user,
            availableForEmergency: false,
            onboardingCompleted: false
          };
        })
      );
      
      return doctorsWithProfiles;
    }
  });

  // Delete doctor mutation
  const deleteDoctorMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete doctor");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/doctors"] });
      toast({
        title: "Médico removido",
        description: "O médico foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover médico",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter doctors based on search and tab
  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = 
      doctor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "emergency") return matchesSearch && doctor.availableForEmergency;
    if (activeTab === "verified") return matchesSearch && doctor.onboardingCompleted;
    if (activeTab === "pending") return matchesSearch && !doctor.onboardingCompleted;
    
    return matchesSearch;
  });

  const handleEditDoctor = (doctor: DoctorWithUser) => {
    setSelectedDoctor(doctor);
    setIsEditModalOpen(true);
  };

  const handleDeleteDoctor = (doctor: DoctorWithUser) => {
    if (confirm(`Tem certeza que deseja remover o médico ${doctor.fullName}?`)) {
      deleteDoctorMutation.mutate(doctor.userId);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "MD";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  return (
    <AdminLayout title="Gerenciar Médicos">
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, email, especialidade ou CRM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Adicionar Médico
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Médicos</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{doctors.length}</div>
              <p className="text-xs text-muted-foreground">Médicos cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plantão de Emergência</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {doctors.filter(d => d.availableForEmergency).length}
              </div>
              <p className="text-xs text-muted-foreground">Disponíveis agora</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perfis Verificados</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {doctors.filter(d => d.onboardingCompleted).length}
              </div>
              <p className="text-xs text-muted-foreground">Onboarding completo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {doctors.filter(d => !d.onboardingCompleted).length}
              </div>
              <p className="text-xs text-muted-foreground">Aguardando verificação</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for filtering */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="emergency">Emergência</TabsTrigger>
            <TabsTrigger value="verified">Verificados</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-32 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDoctors.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhum médico encontrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {searchTerm 
                      ? "Tente ajustar sua busca" 
                      : "Clique em 'Adicionar Médico' para começar"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor) => (
                  <Card key={doctor.userId} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={doctor.profileImage} />
                            <AvatarFallback>{getInitials(doctor.fullName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg">{doctor.fullName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {doctor.specialization || "Especialidade não definida"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Status badges */}
                      <div className="flex flex-wrap gap-2">
                        {doctor.availableForEmergency && (
                          <Badge variant="default" className="gap-1">
                            <Activity className="h-3 w-3" />
                            Emergência
                          </Badge>
                        )}
                        {doctor.onboardingCompleted ? (
                          <Badge variant="secondary" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Pendente
                          </Badge>
                        )}
                      </div>

                      {/* Contact info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{doctor.email}</span>
                        </div>
                        {doctor.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{doctor.phone}</span>
                          </div>
                        )}
                        {doctor.licenseNumber && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Shield className="h-3 w-3" />
                            <span>CRM: {doctor.licenseNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Consultation fee */}
                      {doctor.consultationFee !== undefined && doctor.consultationFee > 0 && (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium">Valor da consulta</span>
                          <span className="font-semibold">{formatCurrency(doctor.consultationFee)}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditDoctor(doctor)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDeleteDoctor(doctor)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Modal */}
      {selectedDoctor && (
        <DoctorEditModal
          doctor={selectedDoctor}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDoctor(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/doctors"] });
            setIsEditModalOpen(false);
            setSelectedDoctor(null);
          }}
        />
      )}

      {/* Create Modal */}
      <DoctorCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/doctors"] });
          setIsCreateModalOpen(false);
        }}
      />
    </AdminLayout>
  );
};

export default AdminDoctors;