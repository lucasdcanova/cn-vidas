import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileFormField from "@/components/profile/ProfileFormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { 
  getUserProfile,
  updateUserProfile,
  getCurrentPartner,
  getDoctorByUserId,
  updatePartner,
  updateDoctor
} from "@/lib/api";
import { 
  User, 
  Lock, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Building,
  Globe,
  FileText,
  CreditCard,
  Award,
  GraduationCap,
  Briefcase,
  Users,
  Shield,
  Settings,
  Fingerprint,
  Smartphone,
  Save,
  X,
  Loader2,
  Edit3,
  CheckCircle2,
  Stethoscope
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";
import { Capacitor } from '@capacitor/core';
import { AddressFormOptimized as AddressForm } from "@/components/forms/address-form-optimized";

// Schemas de validação
const patientProfileSchema = z.object({
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
  address: z.string().optional(),
  zipcode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  birthDate: z.string().optional(),
});

const doctorProfileSchema = z.object({
  specialization: z.string().min(1, "Especialização é obrigatória"),
  licenseNumber: z.string().min(1, "CRM é obrigatório"),
  rqe: z.string().optional(),
  education: z.string().optional(),
  experienceYears: z.string().optional(),
  availableForEmergency: z.boolean().optional(),
  consultationFee: z.string().optional(),
  fullBio: z.string().optional(),
  achievements: z.string().optional(),
  consultationPriceDescription: z.string().optional(),
});

const partnerProfileSchema = z.object({
  businessName: z.string().min(1, "Nome da empresa é obrigatório"),
  businessType: z.string().min(1, "Tipo de negócio é obrigatório"),
  description: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().min(1, "Telefone é obrigatório"),
  cnpj: z.string().optional(),
  nationwideService: z.boolean().optional(),
  address: z.string().optional(),
  zipcode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type PatientProfileFormValues = z.infer<typeof patientProfileSchema>;
type DoctorProfileFormValues = z.infer<typeof doctorProfileSchema>;
type PartnerProfileFormValues = z.infer<typeof partnerProfileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const ProfileV2: React.FC = () => {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  const { 
    isAvailable: isBiometricAvailable, 
    biometryTypeName,
    saveCredentials: saveBiometricCredentials,
    clearCredentials: clearBiometricCredentials
  } = useBiometricAuth();
  
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    return localStorage.getItem('biometricEnabled') === 'true';
  });

  // Queries
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/users/profile"],
    queryFn: getUserProfile,
  });

  const { data: partnerData, isLoading: partnerLoading } = useQuery({
    queryKey: ["/api/partners/me"],
    queryFn: getCurrentPartner,
    enabled: user?.role === "partner",
  });

  const { data: doctorData, isLoading: doctorLoading } = useQuery({
    queryKey: ["/api/doctors/user", user?.id],
    queryFn: () => getDoctorByUserId(user?.id || 0),
    enabled: user?.role === "doctor",
  });

  // Forms
  const patientForm = useForm<PatientProfileFormValues>({
    resolver: zodResolver(patientProfileSchema),
  });

  const doctorForm = useForm<DoctorProfileFormValues>({
    resolver: zodResolver(doctorProfileSchema),
  });

  const partnerForm = useForm<PartnerProfileFormValues>({
    resolver: zodResolver(partnerProfileSchema),
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Initialize forms with data
  useEffect(() => {
    if (profileData && (user?.role === "patient" || user?.role === "admin")) {
      patientForm.reset({
        fullName: profileData.fullName || "",
        username: profileData.username || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        zipcode: profileData.zipcode || "",
        street: profileData.street || "",
        number: profileData.number || "",
        complement: profileData.complement || "",
        neighborhood: profileData.neighborhood || "",
        city: profileData.city || "",
        state: profileData.state || "",
        birthDate: profileData.birthDate ? new Date(profileData.birthDate).toISOString().split('T')[0] : "",
      });
    }
  }, [profileData, user?.role, patientForm]);

  useEffect(() => {
    if (doctorData && user?.role === "doctor") {
      doctorForm.reset({
        specialization: doctorData.specialization || "",
        licenseNumber: doctorData.licenseNumber || "",
        rqe: doctorData.rqe || "",
        education: doctorData.education || "",
        experienceYears: doctorData.experienceYears?.toString() || "",
        availableForEmergency: doctorData.availableForEmergency || false,
        consultationFee: doctorData.consultationFee?.toString() || "",
        fullBio: doctorData.fullBio || "",
        achievements: doctorData.achievements || "",
        consultationPriceDescription: doctorData.consultationPriceDescription || "",
      });
      if (doctorData.profileImage) {
        setProfileImage(doctorData.profileImage);
      }
    }
  }, [doctorData, user?.role, doctorForm]);

  useEffect(() => {
    if (partnerData && user?.role === "partner") {
      partnerForm.reset({
        businessName: partnerData.businessName || "",
        businessType: partnerData.businessType || "",
        description: partnerData.description || "",
        website: partnerData.website || "",
        phone: partnerData.phone || "",
        cnpj: partnerData.cnpj || "",
        nationwideService: partnerData.nationwideService || false,
        address: partnerData.address || "",
        zipcode: partnerData.zipcode || "",
        street: partnerData.street || "",
        number: partnerData.number || "",
        complement: partnerData.complement || "",
        neighborhood: partnerData.neighborhood || "",
        city: partnerData.city || "",
        state: partnerData.state || "",
      });
    }
  }, [partnerData, user?.role, partnerForm]);

  useEffect(() => {
    if (profileData?.profileImage) {
      setProfileImage(profileData.profileImage);
    }
  }, [profileData]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar suas informações.",
        variant: "destructive",
      });
    },
  });

  const updateDoctorMutation = useMutation({
    mutationFn: (data: any) => updateDoctor(doctorData?.id || 0, data),
    onSuccess: () => {
      toast({
        title: "Perfil médico atualizado!",
        description: "Suas informações profissionais foram salvas.",
      });
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["/api/doctors/user", user?.id] });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar suas informações.",
        variant: "destructive",
      });
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: (data: any) => updatePartner(partnerData?.id || 0, data),
    onSuccess: () => {
      toast({
        title: "Perfil empresarial atualizado!",
        description: "As informações da empresa foram salvas.",
      });
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["/api/partners/me"] });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as informações.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      setBiometricEnabled(enabled);
      localStorage.setItem('biometricEnabled', enabled.toString());
      
      if (!enabled) {
        await clearBiometricCredentials();
      }
      
      toast({
        title: enabled ? "Biometria habilitada" : "Biometria desabilitada",
        description: enabled 
          ? `Login com ${biometryTypeName} ativado.`
          : "O login biométrico foi desativado.",
      });
    } catch (error) {
      setBiometricEnabled(!enabled);
      localStorage.setItem('biometricEnabled', (!enabled).toString());
      toast({
        title: "Erro",
        description: "Não foi possível alterar a configuração.",
        variant: "destructive",
      });
    }
  };

  const onPatientSubmit = async (data: PatientProfileFormValues) => {
    const updateData: any = {
      phone: data.phone,
      birthDate: data.birthDate,
      zipcode: data.zipcode,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      address: data.address,
    };

    if (user?.role === "admin") {
      updateData.fullName = data.fullName;
      updateData.username = data.username;
      updateData.email = data.email;
    }

    updateProfileMutation.mutate(updateData);
  };

  const onDoctorSubmit = async (data: DoctorProfileFormValues) => {
    const formattedData = {
      ...data,
      experienceYears: data.experienceYears ? parseInt(data.experienceYears, 10) : undefined,
      consultationFee: data.consultationFee ? parseFloat(data.consultationFee) : undefined,
    };
    updateDoctorMutation.mutate(formattedData);
  };

  const onPartnerSubmit = async (data: PartnerProfileFormValues) => {
    updatePartnerMutation.mutate(data);
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      const response = await fetch('/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      });

      if (!response.ok) throw new Error('Falha ao alterar senha');

      toast({
        title: "Senha alterada!",
        description: "Sua senha foi atualizada com sucesso.",
      });
      
      passwordForm.reset();
    } catch (error) {
      toast({
        title: "Erro ao alterar senha",
        description: "Verifique sua senha atual e tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (profileLoading || (user?.role === "partner" && partnerLoading) || (user?.role === "doctor" && doctorLoading)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  const displayName = user?.role === 'partner' ? partnerData?.businessName : user?.fullName;
  const userSpecialty = user?.role === 'doctor' ? doctorData?.specialization : undefined;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto -mt-4">
        {/* Header com foto */}
        <ProfileHeader
          userName={displayName || 'Usuário'}
          userEmail={user?.email || ''}
          userRole={user?.role || 'patient'}
          profileImage={profileImage}
          verified={user?.role === 'doctor' ? doctorData?.onboardingCompleted : true}
          specialty={userSpecialty}
          businessName={user?.role === 'partner' ? partnerData?.businessName : undefined}
          subscriptionPlan={user?.subscriptionPlan}
          onImageUpdate={(url) => {
            setProfileImage(url);
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
          }}
        />

        {/* Tabs de conteúdo */}
        <div className="px-4 md:px-8 -mt-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-lg">
              <TabsTrigger 
                value="profile" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
              >
                <User className="w-4 h-4 mr-2" />
                Informações
              </TabsTrigger>
              {user?.role === "patient" && user?.subscriptionPlan?.includes('_family') && (
                <TabsTrigger 
                  value="dependents"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Dependentes
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="security"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
              >
                <Shield className="w-4 h-4 mr-2" />
                Segurança
              </TabsTrigger>
            </TabsList>

            {/* Tab de Informações */}
            <TabsContent value="profile" className="space-y-6">
              {/* Paciente */}
              {(user?.role === "patient" || user?.role === "admin") && (
                <Form {...patientForm}>
                  <form onSubmit={patientForm.handleSubmit(onPatientSubmit)} className="space-y-6">
                    <ProfileCard
                      title="Informações Pessoais"
                      description="Seus dados pessoais e de contato"
                      icon={User}
                      action={
                        <Button
                          type="button"
                          variant={isEditMode ? "ghost" : "outline"}
                          size="sm"
                          onClick={() => setIsEditMode(!isEditMode)}
                        >
                          {isEditMode ? (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Cancelar
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Editar
                            </>
                          )}
                        </Button>
                      }
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProfileFormField
                          control={patientForm.control}
                          name="fullName"
                          label="Nome Completo"
                          placeholder="Seu nome completo"
                          icon={User}
                          readOnly={user?.role !== "admin" || !isEditMode}
                        />
                        
                        <ProfileFormField
                          control={patientForm.control}
                          name="email"
                          label="E-mail"
                          placeholder="seu@email.com"
                          type="email"
                          icon={Mail}
                          readOnly={user?.role !== "admin" || !isEditMode}
                        />
                        
                        <ProfileFormField
                          control={patientForm.control}
                          name="phone"
                          label="Telefone"
                          placeholder="(00) 00000-0000"
                          icon={Phone}
                          disabled={!isEditMode}
                        />
                        
                        <ProfileFormField
                          control={patientForm.control}
                          name="birthDate"
                          label="Data de Nascimento"
                          type="date"
                          icon={Calendar}
                          disabled={!isEditMode}
                        />
                      </div>
                    </ProfileCard>

                    <ProfileCard
                      title="Endereço"
                      description="Seu endereço residencial"
                      icon={MapPin}
                    >
                      <AddressForm
                        defaultValues={{
                          zipcode: patientForm.watch("zipcode") || "",
                          street: patientForm.watch("street") || "",
                          number: patientForm.watch("number") || "",
                          complement: patientForm.watch("complement") || "",
                          neighborhood: patientForm.watch("neighborhood") || "",
                          city: patientForm.watch("city") || "",
                          state: patientForm.watch("state") || "",
                        }}
                        onSubmit={(addressData) => {
                          Object.keys(addressData).forEach((key) => {
                            patientForm.setValue(key as any, addressData[key as keyof typeof addressData]);
                          });
                        }}
                        isSubmitting={!isEditMode}
                        showSubmitButton={false}
                        standAlone={false}
                        isReadOnly={!isEditMode}
                      />
                    </ProfileCard>

                    {isEditMode && (
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditMode(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Salvar
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              )}

              {/* Médico */}
              {user?.role === "doctor" && doctorData && (
                <Form {...doctorForm}>
                  <form onSubmit={doctorForm.handleSubmit(onDoctorSubmit)} className="space-y-6">
                    <ProfileCard
                      title="Informações Profissionais"
                      description="Seus dados médicos e credenciais"
                      icon={Stethoscope}
                      action={
                        <Button
                          type="button"
                          variant={isEditMode ? "ghost" : "outline"}
                          size="sm"
                          onClick={() => setIsEditMode(!isEditMode)}
                        >
                          {isEditMode ? (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Cancelar
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Editar
                            </>
                          )}
                        </Button>
                      }
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProfileFormField
                          control={doctorForm.control}
                          name="specialization"
                          label="Especialização"
                          placeholder="Ex: Clínica Geral"
                          icon={Award}
                          disabled={!isEditMode}
                        />
                        
                        <ProfileFormField
                          control={doctorForm.control}
                          name="licenseNumber"
                          label="CRM"
                          placeholder="12345-SP"
                          icon={FileText}
                          disabled={!isEditMode}
                        />
                        
                        <ProfileFormField
                          control={doctorForm.control}
                          name="rqe"
                          label="RQE"
                          placeholder="RQE 12345"
                          icon={Award}
                          disabled={!isEditMode}
                          description="Registro de Qualificação de Especialista"
                        />
                        
                        <ProfileFormField
                          control={doctorForm.control}
                          name="experienceYears"
                          label="Anos de Experiência"
                          placeholder="10"
                          type="number"
                          icon={Briefcase}
                          disabled={!isEditMode}
                        />
                        
                        <ProfileFormField
                          control={doctorForm.control}
                          name="education"
                          label="Formação"
                          placeholder="Universidade, Curso, Ano"
                          icon={GraduationCap}
                          disabled={!isEditMode}
                        />
                        
                        <ProfileFormField
                          control={doctorForm.control}
                          name="consultationFee"
                          label="Valor da Consulta"
                          placeholder="150.00"
                          type="number"
                          icon={CreditCard}
                          disabled={!isEditMode}
                        />
                      </div>

                      <ProfileFormField
                        control={doctorForm.control}
                        name="fullBio"
                        label="Biografia Profissional"
                        placeholder="Conte sobre sua experiência e especialidades..."
                        multiline
                        rows={4}
                        disabled={!isEditMode}
                      />

                      <ProfileFormField
                        control={doctorForm.control}
                        name="achievements"
                        label="Conquistas e Certificações"
                        placeholder="Suas certificações, prêmios e conquistas..."
                        multiline
                        rows={3}
                        disabled={!isEditMode}
                      />

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <Phone className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Disponível para Emergências</p>
                            <p className="text-sm text-gray-500">Receba solicitações de consultas emergenciais</p>
                          </div>
                        </div>
                        <Checkbox
                          checked={doctorForm.watch("availableForEmergency")}
                          onCheckedChange={(checked) => 
                            doctorForm.setValue("availableForEmergency", checked as boolean)
                          }
                          disabled={!isEditMode}
                        />
                      </div>
                    </ProfileCard>

                    {isEditMode && (
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditMode(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateDoctorMutation.isPending}
                        >
                          {updateDoctorMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Salvar
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              )}

              {/* Parceiro */}
              {user?.role === "partner" && partnerData && (
                <Form {...partnerForm}>
                  <form onSubmit={partnerForm.handleSubmit(onPartnerSubmit)} className="space-y-6">
                    <ProfileCard
                      title="Informações Empresariais"
                      description="Dados da sua empresa"
                      icon={Building}
                      action={
                        <Button
                          type="button"
                          variant={isEditMode ? "ghost" : "outline"}
                          size="sm"
                          onClick={() => setIsEditMode(!isEditMode)}
                        >
                          {isEditMode ? (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Cancelar
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Editar
                            </>
                          )}
                        </Button>
                      }
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ProfileFormField
                          control={partnerForm.control}
                          name="businessName"
                          label="Nome da Empresa"
                          placeholder="Sua Empresa Ltda."
                          icon={Building}
                          disabled={!isEditMode}
                        />
                        
                        <ProfileFormField
                          control={partnerForm.control}
                          name="businessType"
                          label="Tipo de Negócio"
                          placeholder="Clínica, Hospital, etc."
                          icon={Briefcase}
                          disabled={!isEditMode}
                        />
                        
                        <ProfileFormField
                          control={partnerForm.control}
                          name="cnpj"
                          label="CNPJ"
                          placeholder="00.000.000/0000-00"
                          icon={FileText}
                          disabled={!isEditMode}
                        />
                        
                        <ProfileFormField
                          control={partnerForm.control}
                          name="phone"
                          label="Telefone"
                          placeholder="(00) 0000-0000"
                          icon={Phone}
                          disabled={!isEditMode}
                        />
                        
                        <ProfileFormField
                          control={partnerForm.control}
                          name="website"
                          label="Website"
                          placeholder="https://www.seusite.com.br"
                          icon={Globe}
                          disabled={!isEditMode}
                        />
                      </div>

                      <ProfileFormField
                        control={partnerForm.control}
                        name="description"
                        label="Descrição"
                        placeholder="Descreva sua empresa e serviços..."
                        multiline
                        rows={4}
                        disabled={!isEditMode}
                      />

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Globe className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Atendimento Nacional</p>
                            <p className="text-sm text-gray-500">Disponível para clientes de todo o Brasil</p>
                          </div>
                        </div>
                        <Switch
                          checked={partnerForm.watch("nationwideService")}
                          onCheckedChange={(checked) => 
                            partnerForm.setValue("nationwideService", checked)
                          }
                          disabled={!isEditMode}
                        />
                      </div>
                    </ProfileCard>

                    {!partnerForm.watch("nationwideService") && (
                      <ProfileCard
                        title="Endereço Comercial"
                        description="Localização da sua empresa"
                        icon={MapPin}
                      >
                        <AddressForm
                          defaultValues={{
                            zipcode: partnerForm.watch("zipcode") || "",
                            street: partnerForm.watch("street") || "",
                            number: partnerForm.watch("number") || "",
                            complement: partnerForm.watch("complement") || "",
                            neighborhood: partnerForm.watch("neighborhood") || "",
                            city: partnerForm.watch("city") || "",
                            state: partnerForm.watch("state") || "",
                          }}
                          onSubmit={(addressData) => {
                            Object.keys(addressData).forEach((key) => {
                              partnerForm.setValue(key as any, addressData[key as keyof typeof addressData]);
                            });
                          }}
                          isSubmitting={!isEditMode}
                          showSubmitButton={false}
                          standAlone={false}
                          isReadOnly={!isEditMode}
                        />
                      </ProfileCard>
                    )}

                    {isEditMode && (
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditMode(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={updatePartnerMutation.isPending}
                        >
                          {updatePartnerMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Salvar
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              )}
            </TabsContent>

            {/* Tab de Segurança */}
            <TabsContent value="security" className="space-y-6">
              <ProfileCard
                title="Alterar Senha"
                description="Mantenha sua conta segura"
                icon={Lock}
              >
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <ProfileFormField
                      control={passwordForm.control}
                      name="currentPassword"
                      label="Senha Atual"
                      placeholder="••••••••"
                      type="password"
                      icon={Lock}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ProfileFormField
                        control={passwordForm.control}
                        name="newPassword"
                        label="Nova Senha"
                        placeholder="••••••••"
                        type="password"
                        icon={Lock}
                      />
                      
                      <ProfileFormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        label="Confirmar Nova Senha"
                        placeholder="••••••••"
                        type="password"
                        icon={Lock}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit">
                        <Shield className="w-4 h-4 mr-2" />
                        Alterar Senha
                      </Button>
                    </div>
                  </form>
                </Form>
              </ProfileCard>

              {/* Biometria (apenas no iOS) */}
              {isBiometricAvailable && Capacitor.isNativePlatform() && (
                <ProfileCard
                  title="Autenticação Biométrica"
                  description="Login rápido e seguro"
                  icon={Fingerprint}
                >
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {biometryTypeName === 'Touch ID' || biometryTypeName === 'Impressão Digital' ? (
                          <Fingerprint className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Smartphone className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Login com {biometryTypeName}</p>
                        <p className="text-sm text-gray-500">Entre automaticamente ao abrir o app</p>
                      </div>
                    </div>
                    <Switch
                      checked={biometricEnabled}
                      onCheckedChange={handleBiometricToggle}
                    />
                  </div>
                </ProfileCard>
              )}

              {/* Logout Button */}
              <ProfileCard
                title="Sair da Conta"
                description="Encerrar sua sessão atual"
                icon={LogOut}
              >
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="text-center sm:text-left mb-4 sm:mb-0">
                    <p className="font-medium text-gray-900">Deseja sair da sua conta?</p>
                    <p className="text-sm text-gray-500 mt-1">Você precisará fazer login novamente para acessar o app</p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {logoutMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saindo...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair
                      </>
                    )}
                  </Button>
                </div>
              </ProfileCard>
            </TabsContent>

            {/* Tab de Dependentes */}
            {user?.role === "patient" && user?.subscriptionPlan?.includes('_family') && (
              <TabsContent value="dependents" className="space-y-6">
                <ProfileCard
                  title="Gerenciar Dependentes"
                  description="Adicione e gerencie os dependentes do seu plano familiar"
                  icon={Users}
                  action={
                    <Badge variant="secondary">
                      Plano {user.subscriptionPlan.includes('ultra') ? 'Ultra' : 
                             user.subscriptionPlan.includes('plus') ? 'Plus' : 'Básico'} Familiar
                    </Badge>
                  }
                >
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Recurso em desenvolvimento
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Em breve você poderá adicionar e gerenciar até 3 dependentes no seu plano familiar.
                    </p>
                  </div>
                </ProfileCard>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfileV2;