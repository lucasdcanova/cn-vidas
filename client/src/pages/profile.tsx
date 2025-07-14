import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Control } from "react-hook-form";
import { z } from "zod";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import SellerForm from "@/components/forms/seller-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  getUserProfile,
  updateUserProfile,
  getCurrentPartner,
  getDoctorByUserId,
  updatePartner,
  updateDoctor
} from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Edit } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { useFreshUserData } from "@/hooks/use-fresh-user-data";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";
import { 
  Loader2, 
  User, 
  Lock, 
  Shield, 
  Upload,
  Building,
  Stethoscope,
  MapPin,
  Users,
  UserPlus,
  AlertCircle,
  Fingerprint,
  Smartphone
} from "lucide-react";
import Breadcrumb from "@/components/ui/breadcrumb";
import { AddressFormOptimized as AddressForm, AddressFormValues } from "@/components/forms/address-form-optimized";
import ImageCropper from "@/components/shared/ImageCropper";
import ProfilePhotoSection from "@/components/profile/ProfilePhotoSection";
import ProfilePhotoUploader from "@/components/shared/ProfilePhotoUploader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Esquema de perfil básico (paciente)
const patientProfileSchema = z.object({
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
  // Campos de endereço detalhados
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

// Esquema de perfil do médico
const doctorProfileSchema = z.object({
  specialization: z.string().min(1, "Especialização é obrigatória"),
  licenseNumber: z.string().min(1, "Número de registro é obrigatório"),
  rqe: z.string().optional(),
  education: z.string().optional(),
  experienceYears: z.string().optional(), // Mantemos como string no form, mas convertemos na submissão
  availableForEmergency: z.boolean().optional(),
  consultationFee: z.string().optional(), // Mantemos como string no form, mas convertemos na submissão
  profileImage: z.string().optional(),
  // Novos campos do onboarding
  fullBio: z.string().optional(),
  areasOfExpertise: z.array(z.string()).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  achievements: z.string().optional(),
  consultationPriceDescription: z.string().optional(),
});

// Esquema de perfil do parceiro (empresa)
const partnerProfileSchema = z.object({
  businessName: z.string().min(1, "Nome da empresa é obrigatório"),
  businessType: z.string().min(1, "Tipo de negócio é obrigatório"),
  description: z.string().optional(),
  website: z.string().optional(),
  // Campos de endereço detalhados
  address: z.string().optional(), // Mantido para compatibilidade
  zipcode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().min(1, "Telefone é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres").optional(),
  nationwideService: z.boolean().optional(),
});

// Password change form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "A senha atual deve ter pelo menos 6 caracteres"),
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "A confirmação da senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// Schema de validação para dependentes
const dependentSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter exatamente 11 dígitos'),
  relationship: z.string().optional(),
  birthDate: z.string().optional(),
});

type PatientProfileFormValues = z.infer<typeof patientProfileSchema>;
type DoctorProfileFormValues = z.infer<typeof doctorProfileSchema>;
type PartnerProfileFormValues = z.infer<typeof partnerProfileSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type DependentFormValues = z.infer<typeof dependentSchema>;

interface Dependent {
  id: number;
  fullName: string;
  cpf: string;
  relationship?: string;
  birthDate?: string;
}

const Profile: React.FC = () => {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-refresh após completar onboarding
  React.useEffect(() => {
    const justCompletedOnboarding = localStorage.getItem('justCompletedOnboarding');
    
    if (justCompletedOnboarding === 'true' && user?.role === 'doctor') {
      // Remove a flag imediatamente para evitar múltiplos refreshes
      localStorage.removeItem('justCompletedOnboarding');
      
      // Mostrar mensagem informativa
      toast({
        title: 'Atualizando informações...',
        description: 'Seus dados estão sendo carregados. A página será atualizada em instantes.',
        duration: 5000,
      });
      
      // Aguardar 5 segundos e recarregar a página
      const timeoutId = setTimeout(() => {
        window.location.reload();
      }, 5000);
      
      // Cleanup do timeout
      return () => clearTimeout(timeoutId);
    }
  }, [toast, user?.role]);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditMode, setIsEditMode] = useState(true);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Use o hook para garantir dados frescos do usuário
  const { refreshUserData } = useFreshUserData();
  
  // Biometric auth hook
  const { 
    isAvailable: isBiometricAvailable, 
    biometryTypeName,
    saveCredentials: saveBiometricCredentials,
    clearCredentials: clearBiometricCredentials
  } = useBiometricAuth();
  
  // Estado para biometric settings
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    return localStorage.getItem('biometricEnabled') === 'true';
  });
  
  // Form para dependentes
  const dependentForm = useForm<DependentFormValues>({
    resolver: zodResolver(dependentSchema),
    defaultValues: {
      fullName: '',
      cpf: '',
      relationship: '',
      birthDate: '',
    },
  });
  
  // Fetch user profile data with optimized cache settings
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/users/profile"],
    queryFn: getUserProfile,
    staleTime: 1 * 60 * 1000, // 1 minute (reduzido de 5)
    cacheTime: 3 * 60 * 1000, // 3 minutes (reduzido de 10)
    refetchOnWindowFocus: true, // Reativar refetch on focus para garantir dados atualizados
    refetchOnMount: true, // Sempre refetch ao montar
  });
  
  // Use useEffect to handle profile data changes - only for profile image
  React.useEffect(() => {
    if (profileData && profileData.profileImage && !profileImage) {
      console.log("Imagem de perfil encontrada no servidor");
      setProfileImage(profileData.profileImage);
    }
  }, [profileData?.profileImage]); // Dependência mais específica
  
  // Fetch partner data if user is a partner
  const { data: partnerData, isLoading: partnerLoading } = useQuery({
    queryKey: ["/api/partners/me"],
    queryFn: getCurrentPartner,
    enabled: !!user?.id && user?.role === "partner",
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  // Fetch doctor data if user is a doctor
  const { data: doctorData, isLoading: doctorLoading } = useQuery({
    queryKey: ["/api/doctors/user", user?.id],
    queryFn: async () => {
      console.log("Buscando perfil do médico para usuário ID:", user?.id);
      const data = await getDoctorByUserId(user?.id || 0);
      console.log("🩺 Dados do médico recebidos da API:", data);
      console.log("🩺 Campos específicos:", {
        specialization: data?.specialization,
        licenseNumber: data?.licenseNumber,
        education: data?.education,
        experienceYears: data?.experienceYears,
        consultationFee: data?.consultationFee,
        onboardingCompleted: data?.onboardingCompleted
      });
      return data;
    },
    enabled: !!user?.id && user?.role === "doctor",
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  // Query para buscar dependentes
  const { data: dependents = [], isLoading: dependentsLoading } = useQuery<Dependent[]>({
    queryKey: ['/api/dependents'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/dependents');
      return response.json();
    },
    enabled: !!user?.id && user?.role === "patient" && user?.subscriptionPlan?.includes('_family'),
  });
  
  // Patient profile form
  const patientForm = useForm<PatientProfileFormValues>({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      fullName: profileData?.fullName || "",
      username: profileData?.username || "",
      email: profileData?.email || "",
      phone: profileData?.phone || "",
      address: profileData?.address || "",
      birthDate: profileData?.birthDate ? new Date(profileData.birthDate).toISOString().split('T')[0] : "",
    },
  });
  
  // Estado para controlar se os dados iniciais já foram carregados
  const [isPatientFormInitialized, setIsPatientFormInitialized] = React.useState(false);
  const [forceUpdate, setForceUpdate] = React.useState(0);
  
  // Atualizar o formulário quando os dados do perfil forem carregados pela primeira vez
  React.useEffect(() => {
    if (profileData && !isPatientFormInitialized && (user?.role === "patient" || user?.role === "admin")) {
      console.log("Inicializando formulário do paciente com dados do perfil:", profileData);
      console.log("🏠 Dados de endereço do perfil:", {
        street: profileData.street,
        address: profileData.address,
        zipcode: profileData.zipcode,
        number: profileData.number,
        neighborhood: profileData.neighborhood,
        city: profileData.city,
        state: profileData.state
      });
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
      // Pequeno delay para garantir que o formulário foi atualizado
      setTimeout(() => {
        setIsPatientFormInitialized(true);
        // Forçar re-render do AddressForm após carregar os dados
        setForceUpdate(prev => prev + 1);
      }, 100);
    }
  }, [profileData, isPatientFormInitialized, user?.role]);
  
  // Doctor profile form
  const doctorForm = useForm<DoctorProfileFormValues>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: {
      specialization: doctorData?.specialization || "",
      licenseNumber: doctorData?.licenseNumber || "",
      rqe: doctorData?.rqe || "",
      education: doctorData?.education || "",
      experienceYears: doctorData?.experienceYears?.toString() || "",
      availableForEmergency: doctorData?.availableForEmergency || false,
      consultationFee: doctorData?.consultationFee?.toString() || "",
      profileImage: doctorData?.profileImage || "",
      // Novos campos do onboarding
      fullBio: doctorData?.fullBio || "",
      areasOfExpertise: doctorData?.areasOfExpertise || [],
      languagesSpoken: doctorData?.languagesSpoken || [],
      achievements: doctorData?.achievements || "",
      consultationPriceDescription: doctorData?.consultationPriceDescription || "",
    },
  });
  
  // Estado para controlar se os dados do médico já foram inicializados
  const [isDoctorFormInitialized, setIsDoctorFormInitialized] = React.useState(false);
  
  // Inicializar a imagem de perfil e atualizar o formulário quando os dados do médico forem carregados
  React.useEffect(() => {
    if (doctorData && !isDoctorFormInitialized && user?.role === "doctor") {
      console.log("Inicializando formulário do médico com dados:", doctorData);
      doctorForm.reset({
        specialization: doctorData.specialization || "",
        licenseNumber: doctorData.licenseNumber || "",
        rqe: doctorData.rqe || "",
        education: doctorData.education || "",
        experienceYears: doctorData.experienceYears?.toString() || "",
        availableForEmergency: doctorData.availableForEmergency || false,
        consultationFee: doctorData.consultationFee?.toString() || "",
        profileImage: doctorData.profileImage || "",
        // Novos campos do onboarding
        fullBio: doctorData.fullBio || "",
        areasOfExpertise: doctorData.areasOfExpertise || [],
        languagesSpoken: doctorData.languagesSpoken || [],
        achievements: doctorData.achievements || "",
        consultationPriceDescription: doctorData.consultationPriceDescription || "",
      });
      
      if (doctorData.profileImage && !profileImage) {
        setProfileImage(doctorData.profileImage);
      }
      setIsDoctorFormInitialized(true);
    }
  }, [doctorData, isDoctorFormInitialized, user?.role]);
  
  // Partner profile form
  const partnerForm = useForm<PartnerProfileFormValues>({
    resolver: zodResolver(partnerProfileSchema),
    defaultValues: {
      businessName: partnerData?.businessName || "",
      businessType: partnerData?.businessType || "",
      description: partnerData?.description || "",
      website: partnerData?.website || "",
      address: partnerData?.address || "",
      zipcode: partnerData?.zipcode || "",
      street: partnerData?.street || "",
      number: partnerData?.number || "",
      complement: partnerData?.complement || "",
      neighborhood: partnerData?.neighborhood || "",
      city: partnerData?.city || "",
      state: partnerData?.state || "",
      phone: partnerData?.phone || "",
      cnpj: partnerData?.cnpj || "",
      nationwideService: partnerData?.nationwideService || false,
    },
  });
  
  // Estado para controlar se os dados do parceiro já foram inicializados
  const [isPartnerFormInitialized, setIsPartnerFormInitialized] = React.useState(false);
  
  // Atualizar o formulário do parceiro quando os dados forem carregados pela primeira vez
  React.useEffect(() => {
    if (partnerData && !isPartnerFormInitialized && user?.role === "partner") {
      console.log("Inicializando formulário do parceiro com dados:", partnerData);
      partnerForm.reset({
        businessName: partnerData.businessName || "",
        businessType: partnerData.businessType || "",
        description: partnerData.description || "",
        website: partnerData.website || "",
        address: partnerData.address || "",
        zipcode: partnerData.zipcode || "",
        street: partnerData.street || "",
        number: partnerData.number || "",
        complement: partnerData.complement || "",
        neighborhood: partnerData.neighborhood || "",
        city: partnerData.city || "",
        state: partnerData.state || "",
        phone: partnerData.phone || "",
        cnpj: partnerData.cnpj || "",
        nationwideService: partnerData.nationwideService || false,
      });
      
      // Inicializar a imagem de perfil do parceiro
      if (partnerData.profileImage && !profileImage) {
        console.log("Imagem de perfil do parceiro encontrada:", partnerData.profileImage);
        setProfileImage(partnerData.profileImage);
      }
      
      setIsPartnerFormInitialized(true);
    }
  }, [partnerData, isPartnerFormInitialized, user?.role]);

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // User profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      setIsUpdatingProfile(false);
      setIsEditMode(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar seu perfil.",
        variant: "destructive",
      });
      setIsUpdatingProfile(false);
    },
  });
  
  // Doctor profile update mutation
  const updateDoctorMutation = useMutation({
    mutationFn: (data: any) => {
      console.log(`Enviando atualização para médico ID: ${doctorData?.id}`);
      // Garantir que temos um ID válido antes de enviar
      if (!doctorData?.id) {
        throw new Error("ID do médico não encontrado");
      }
      
      // Adicionar o userId aos dados para ajudar na invalidação do cache
      const dataToSend = {
        ...data,
        userId: user?.id
      };
      
      console.log("Dados a serem enviados:", dataToSend);
      return updateDoctor(doctorData.id, dataToSend);
    },
    onSuccess: (response) => {
      console.log("Perfil médico atualizado com sucesso:", response);
      toast({
        title: "Perfil médico atualizado",
        description: "Suas informações profissionais foram atualizadas com sucesso.",
      });
      setIsUpdatingProfile(false);
      setIsEditMode(false);
      
      // Forçar a atualização de todas as consultas relevantes
      queryClient.invalidateQueries({ queryKey: ["/api/doctors/user", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors", doctorData?.id] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      }
    },
    onError: (error) => {
      console.error("Erro ao atualizar perfil médico:", error);
      toast({
        title: "Erro ao atualizar perfil médico",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar seu perfil médico.",
        variant: "destructive",
      });
      setIsUpdatingProfile(false);
    },
  });
  
  // Partner profile update mutation
  const updatePartnerMutation = useMutation({
    mutationFn: async (data: PartnerProfileFormValues) => {
      console.log("Enviando atualização do perfil do parceiro:", data);
      
      // Usar o endpoint correto para atualizar o perfil do parceiro logado
      const res = await apiRequest("PUT", "/api/partners/me", data);
      
      return await res.json();
    },
    onSuccess: (response) => {
      console.log("Perfil de parceiro atualizado com sucesso:", response);
      toast({
        title: "Perfil da empresa atualizado",
        description: "As informações da empresa foram atualizadas com sucesso.",
      });
      setIsUpdatingProfile(false);
      setIsEditMode(false);
      
      // Invalidar cache para forçar reload dos dados
      queryClient.invalidateQueries({ queryKey: ["/api/partners/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners/user", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar perfil de parceiro:", error);
      toast({
        title: "Erro ao atualizar perfil da empresa",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o perfil da empresa.",
        variant: "destructive",
      });
      setIsUpdatingProfile(false);
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });
      passwordForm.reset();
      setIsChangingPassword(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao alterar senha",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao alterar sua senha.",
        variant: "destructive",
      });
      setIsChangingPassword(false);
    },
  });
  
  // Mutation para criar dependente
  const createDependentMutation = useMutation({
    mutationFn: (data: DependentFormValues) => {
      const cleanData = {
        ...data,
        cpf: data.cpf.replace(/\D/g, ''),
      };
      return apiRequest('POST', '/api/dependents', cleanData).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Dependente adicionado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dependents'] });
      dependentForm.reset();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao adicionar dependente.',
        variant: 'destructive',
      });
    },
  });

  // Handle patient profile form submission
  const onPatientSubmit = async (data: PatientProfileFormValues) => {
    event?.preventDefault(); // Evitar qualquer comportamento padrão de formulário
    
    setIsUpdatingProfile(true);
    
    try {
      // Debug - verificar dados antes de enviar
      console.log("🔍 Dados do formulário antes de enviar:", {
        street: data.street,
        zipcode: data.zipcode,
        number: data.number,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        address: data.address
      });
      
      // Preparar dados para envio, excluindo campos não editáveis para não-admins
      const updateData: any = {
        phone: data.phone || "",
        birthDate: data.birthDate || "",
        // Garantir que todos os campos de endereço são enviados explicitamente
        zipcode: data.zipcode || "",
        street: data.street || "",
        number: data.number || "",
        complement: data.complement || "",
        neighborhood: data.neighborhood || "",
        city: data.city || "",
        state: data.state || "",
        // Incluir address caso esteja presente
        address: data.address || ""
      };
      
      console.log("📤 Enviando dados para API:", updateData);
      
      // Se for admin, incluir campos protegidos
      if (user?.role === "admin") {
        updateData.fullName = data.fullName || "";
        updateData.username = data.username || "";
        updateData.email = data.email || "";
      }
      
      // Voltar ao uso do hook de mutação original, que já tem a autenticação configurada corretamente
      await updateProfileMutation.mutateAsync(updateData);
      
      // Exibir mensagem de sucesso
      toast({
        title: "Perfil atualizado",
        description: "Seu perfil foi atualizado com sucesso!",
      });
      
      // Recarregar os dados do perfil para mostrar os dados atualizados
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      
      // Sair do modo edição automaticamente
      setIsEditMode(false);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro ao atualizar perfil",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar seu perfil.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  
  // Handle doctor profile form submission
  const onDoctorSubmit = async (data: DoctorProfileFormValues) => {
    setIsUpdatingProfile(true);
    
    try {
      // Converter campos numéricos (Experiência e taxa de consulta)
      const formattedData = {
        ...data,
        experienceYears: data.experienceYears ? parseInt(data.experienceYears, 10) : undefined,
        consultationFee: data.consultationFee ? parseFloat(data.consultationFee) : undefined,
      };
      
      // Se tiver uma nova imagem de perfil selecionada, enviá-la primeiro
      if (selectedFile) {
        const formData = new FormData();
        formData.append('profileImage', selectedFile);
        
        const response = await fetch('/api/doctors/profile-image', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Falha ao enviar imagem de perfil');
        }
        
        const result = await response.json();
        // Atualizar o URL da imagem nos dados do formulário
        formattedData.profileImage = result.imageUrl;
      }
      
      // Enviar os dados formatados para o servidor
      const doctorDataToSend = {
        specialization: formattedData.specialization,
        licenseNumber: formattedData.licenseNumber,
        rqe: formattedData.rqe,
        education: formattedData.education,
        experienceYears: formattedData.experienceYears,
        availableForEmergency: formattedData.availableForEmergency,
        consultationFee: formattedData.consultationFee,
        profileImage: formattedData.profileImage,
        // Biografia unificada - enviar fullBio como biography também
        biography: formattedData.fullBio,
        fullBio: formattedData.fullBio,
        areasOfExpertise: formattedData.areasOfExpertise,
        languagesSpoken: formattedData.languagesSpoken,
        achievements: formattedData.achievements,
        consultationPriceDescription: formattedData.consultationPriceDescription
      };
      await updateDoctorMutation.mutateAsync(doctorDataToSend);
      
      // Limpar o arquivo selecionado após o envio bem-sucedido
      setSelectedFile(null);
    } catch (error) {
      console.error("Erro ao atualizar perfil médico:", error);
      toast({
        title: "Erro ao atualizar perfil médico",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar seu perfil médico.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
      setIsEditMode(false);
    }
  };
  
  // Handle partner profile form submission
  const onPartnerSubmit = async (data: PartnerProfileFormValues) => {
    setIsUpdatingProfile(true);
    
    try {
      // Debug - mostrar os valores do formulário antes de qualquer processamento
      console.log("Valores originais do formulário:", {
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipcode: data.zipcode
      });
      
      // Verificar valores atuais diretamente do DOM para depuração
      console.log("Valores atuais dos campos do formulário:", {
        street: (document.getElementById('street') as HTMLInputElement | null)?.value,
        number: (document.getElementById('number') as HTMLInputElement | null)?.value,
        neighborhood: (document.getElementById('neighborhood') as HTMLInputElement | null)?.value,
      });
      
      // Capturar valores diretamente dos campos do formulário de endereço
      // já que pode haver uma desconexão entre os formulários
      const streetValue = (document.getElementById('street') as HTMLInputElement | null)?.value || data.street || "";
      const numberValue = (document.getElementById('number') as HTMLInputElement | null)?.value || data.number || "";
      const complementValue = (document.getElementById('complement') as HTMLInputElement | null)?.value || data.complement || "";
      const neighborhoodValue = (document.getElementById('neighborhood') as HTMLInputElement | null)?.value || data.neighborhood || "";
      
      // Construir endereço completo para compatibilidade
      if (streetValue && numberValue) {
        const fullAddress = `${streetValue}, ${numberValue}${complementValue ? `, ${complementValue}` : ""} - ${neighborhoodValue || ""} - ${data.city || ""}/${data.state || ""} - CEP: ${data.zipcode || ""}`;
        data.address = fullAddress;
      }
      
      // Validar CNPJ se preenchido
      if (data.cnpj && data.cnpj.length < 14) {
        toast({
          title: "CNPJ inválido",
          description: "Por favor, digite um CNPJ válido com pelo menos 14 dígitos.",
          variant: "destructive",
        });
        setIsUpdatingProfile(false);
        return;
      }
      
      // Garantir que todos os campos de endereço são enviados explicitamente
      // usando os valores capturados diretamente dos campos
      const dataWithAllFields = {
        ...data,
        businessName: data.businessName || "",
        businessType: data.businessType || "",
        description: data.description || "",
        website: data.website || "",
        phone: data.phone || "",
        cnpj: data.cnpj || "",
        nationwideService: data.nationwideService || false,
        // Campos de endereço explícitos - usar valores capturados
        zipcode: data.zipcode || "",
        street: streetValue,
        number: numberValue,
        complement: complementValue,
        neighborhood: neighborhoodValue,
        city: data.city || "",
        state: data.state || "",
        address: data.address || ""
      };
      
      console.log("Enviando dados completos do parceiro:", dataWithAllFields);
      
      // Enviar dados para o servidor
      await updatePartnerMutation.mutateAsync(dataWithAllFields);
    } catch (error) {
      console.error("Erro ao atualizar perfil de parceiro:", error);
      toast({
        title: "Erro ao atualizar perfil da empresa",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o perfil da empresa.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
      setIsEditMode(false);
    }
  };
  
  // Handle dependent form submission
  const onDependentSubmit = (data: DependentFormValues) => {
    createDependentMutation.mutate(data);
  };
  
  // Handle biometric toggle
  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      setBiometricEnabled(enabled);
      localStorage.setItem('biometricEnabled', enabled.toString());
      
      if (enabled) {
        // Se habilitando, salvar as credenciais atuais
        if (profileData?.email) {
          // Solicitar a senha do usuário para salvar nas credenciais biométricas
          toast({
            title: "Biometria habilitada",
            description: `Login com ${biometryTypeName} será usado automaticamente na próxima vez.`,
          });
        }
      } else {
        // Se desabilitando, limpar as credenciais
        await clearBiometricCredentials();
        toast({
          title: "Biometria desabilitada",
          description: "O login biométrico foi desativado.",
        });
      }
    } catch (error) {
      console.error("Erro ao alterar configuração biométrica:", error);
      // Reverter o estado em caso de erro
      setBiometricEnabled(!enabled);
      localStorage.setItem('biometricEnabled', (!enabled).toString());
      
      toast({
        title: "Erro ao alterar configuração",
        description: "Não foi possível alterar a configuração biométrica.",
        variant: "destructive",
      });
    }
  };

  // Handle password form submission
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsChangingPassword(true);
    
    try {
      await apiRequest('PUT', '/api/users/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });
      
      // Resetar o form
      passwordForm.reset();
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      
      let errorMessage = "Ocorreu um erro ao alterar sua senha.";
      
      // Mensagens específicas baseadas no status HTTP
      if (error.response?.status === 401) {
        errorMessage = "Senha atual incorreta. Por favor, verifique e tente novamente.";
      } else if (error.response?.status === 400) {
        errorMessage = "A nova senha deve ser diferente da senha atual.";
      }
      
      toast({
        title: "Erro ao alterar senha",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Verificar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione apenas imagens (JPEG, PNG, etc.)",
          variant: "destructive"
        });
        return;
      }
      
      // Verificar tamanho do arquivo (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 5MB",
          variant: "destructive"
        });
        return;
      }
      
      // Criar URL temporária para o diálogo de recorte
      const objectUrl = URL.createObjectURL(file);
      setTempImageUrl(objectUrl);
      
      // Abrir o diálogo de recorte
      setShowCropDialog(true);
      
      console.log("Arquivo selecionado:", file.name, "Tamanho:", Math.round(file.size / 1024), "KB");
    }
  };
  
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Lidar com o cancelamento do recorte
  const handleCropCancel = () => {
    setShowCropDialog(false);
    setTempImageUrl(null);
  };
  
  // Lidar com a conclusão do recorte
  const handleCropComplete = (croppedImageBlob: Blob) => {
    // Criar um arquivo a partir do Blob
    const file = new File([croppedImageBlob], "profile_cropped.jpg", { type: "image/jpeg" });
    
    // Salvar arquivo selecionado
    setSelectedFile(file);
    
    // Criar URL temporária para visualização
    const objectUrl = URL.createObjectURL(croppedImageBlob);
    setProfileImage(objectUrl);
    
    // Fechar diálogo de recorte
    setShowCropDialog(false);
    setTempImageUrl(null);
    
    console.log("Imagem recortada com sucesso:", Math.round(croppedImageBlob.size / 1024), "KB");
  };
  
  // Fazer upload da imagem para o servidor
  const uploadProfileImage = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhuma imagem selecionada",
        description: "Por favor, selecione uma imagem para fazer upload",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUpdatingProfile(true);
      console.log("Iniciando upload da imagem:", selectedFile.name);
      
      const formData = new FormData();
      formData.append('profileImage', selectedFile);
      
      // Obter o token de autenticação do localStorage
      const token = localStorage.getItem('authToken');
      const sessionId = localStorage.getItem('sessionId');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers['Authorization'] = token;
        console.log("Token de autenticação encontrado:", token);
      } else {
        console.log("Token de autenticação não encontrado");
      }
      
      if (sessionId) {
        headers['X-Session-ID'] = sessionId;
        console.log("Session ID encontrado:", sessionId);
      } else {
        console.log("Session ID não encontrado");
      }
      
      console.log("Headers para upload:", headers);
      
      // Fazer o upload da imagem
      console.log("Enviando solicitação para /api/doctor-profile-image");
      const response = await fetch('/api/doctor-profile-image', {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include' // Importante para enviar cookies de sessão
      });
      
      console.log("Resposta recebida:", response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta:", errorText);
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Resultado do upload:", result);
      
      // Atualizar a imagem exibida com a URL retornada pelo servidor
      if (result.imageUrl) {
        console.log("Nova URL da imagem:", result.imageUrl);
        setProfileImage(result.imageUrl);
      }
      
      toast({
        title: "Imagem atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso."
      });
      
      // Atualizar o cache de consultas
      console.log("Invalidando consultas para atualizar a UI");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Query principal do useAuth
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/doctors/user", user?.id] });
      
      // Forçar refetch da query principal para garantir atualização imediata
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/user"] });
      }, 300);
      
    } catch (error) {
      console.error("Erro ao fazer upload de imagem:", error);
      
      toast({
        title: "Erro ao atualizar imagem",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao fazer upload da imagem",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Remover a imagem de perfil
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setProfileImage(null);
    
    if (user?.role === "doctor" && doctorData?.id) {
      // Atualizar o perfil do médico sem imagem
      updateDoctorMutation.mutate({
        ...doctorForm.getValues(),
        profileImage: null 
      });
    }
  };
  
  // Função para formatar CPF
  const formatCpf = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };
  

  if (profileLoading || (user?.role === "partner" && partnerLoading) || (user?.role === "doctor" && doctorLoading)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Carregando perfil...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      {/* Componente de recorte de imagem */}
      {showCropDialog && tempImageUrl && (
        <ImageCropper
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1} // Quadrado
          isOpen={showCropDialog}
        />
      )}
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={`grid w-full ${user?.role === "patient" && user?.subscriptionPlan?.includes('_family') ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            {user?.role === "patient" && user?.subscriptionPlan?.includes('_family') && (
              <TabsTrigger value="dependents">
                <Users className="h-4 w-4 mr-2" />
                Dependentes
              </TabsTrigger>
            )}
            <TabsTrigger value="security">
              <Lock className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle>Informações do Perfil</CardTitle>
                    <CardDescription>
                      Atualize seus dados pessoais e informações de contato
                    </CardDescription>
                  </div>
                  {!isEditMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pb-8 profile-form-container">
                {/* Paciente (padrão) */}
                {(user?.role === "patient" || user?.role === "admin") && (
                  <Form {...patientForm}>
                    <form onSubmit={patientForm.handleSubmit(onPatientSubmit)} className="space-y-4 scroll-pb-32">
                      {/* Upload de foto de perfil para pacientes */}
                      <div className="flex justify-center mb-6">
                        <ProfilePhotoSection
                          currentImage={profileImage}
                          userName={user?.fullName || 'Paciente'}
                          userType="patient"
                          size="xl"
                          onImageUpdate={(url) => {
                            setProfileImage(url);
                            // Invalidar cache para atualizar dados
                            queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Query principal
                            queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
                            // Forçar refetch para garantir atualização
                            setTimeout(() => {
                              queryClient.refetchQueries({ queryKey: ["/api/user"] });
                            }, 300);
                          }}
                          className="w-fit"
                        />
                      </div>
                      <div className={user?.role === "admin" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : ""}>
                        <FormField
                          control={patientForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Seu nome completo" 
                                  disabled={true} // Sempre desabilitado para não-admins
                                  className={user?.role !== "admin" ? "bg-muted cursor-not-allowed" : ""}
                                  {...field} 
                                />
                              </FormControl>
                              {user?.role !== "admin" && (
                                <FormDescription className="text-xs">
                                  Este campo não pode ser editado
                                </FormDescription>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Campo username visível apenas para administradores */}
                        {user?.role === "admin" && (
                          <FormField
                            control={patientForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome de Usuário</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="seunome" 
                                    disabled={!isEditMode}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      
                      <FormField
                        control={patientForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="seu@email.com" 
                                type="email" 
                                disabled={true} // Sempre desabilitado para não-admins
                                className={user?.role !== "admin" ? "bg-muted cursor-not-allowed" : ""}
                                {...field} 
                              />
                            </FormControl>
                            {user?.role !== "admin" && (
                              <FormDescription className="text-xs">
                                Este campo não pode ser editado
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={patientForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(00) 00000-0000" 
                                disabled={isUpdatingProfile || !isEditMode}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Seção de Endereço Completo */}
                      <div className="mt-6 mb-8">
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-medium">Endereço</h3>
                        </div>
                        
                        {/* Campo de teste para debug */}
                        <div className="mb-4 p-4 bg-gray-100 rounded">
                          <p className="text-sm">Debug - Valores atuais do formulário:</p>
                          <p className="text-xs">CEP: {patientForm.watch("zipcode") || "(vazio)"}</p>
                          <p className="text-xs">Rua: {patientForm.watch("street") || "(vazio)"}</p>
                          <p className="text-xs">Número: {patientForm.watch("number") || "(vazio)"}</p>
                          <p className="text-xs">Bairro: {patientForm.watch("neighborhood") || "(vazio)"}</p>
                          <p className="text-xs">Cidade: {patientForm.watch("city") || "(vazio)"}</p>
                          <p className="text-xs">Estado: {patientForm.watch("state") || "(vazio)"}</p>
                        </div>
                        
                        {/* Campo de CEP direto para teste */}
                        <FormField
                          control={patientForm.control}
                          name="zipcode"
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel>CEP (teste direto)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="00000-000"
                                  {...field}
                                  disabled={!isEditMode}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {(() => {
                          const formValues = patientForm.getValues();
                          console.log('[Profile] Renderizando AddressForm com valores:', {
                            zipcode: formValues.zipcode,
                            street: formValues.street,
                            number: formValues.number,
                            neighborhood: formValues.neighborhood,
                            city: formValues.city,
                            state: formValues.state,
                            isInitialized: isPatientFormInitialized,
                            profileData: profileData
                          });
                          return null;
                        })()}
                        
                        <AddressForm
                          key={`patient-address-${profileData?.id}-${isPatientFormInitialized}-${forceUpdate}`}
                          control={patientForm.control} // Passar o control do formulário pai
                          defaultValues={{
                            zipcode: patientForm.getValues("zipcode") || "",
                            street: patientForm.getValues("street") || "",
                            number: patientForm.getValues("number") || "",
                            complement: patientForm.getValues("complement") || "",
                            neighborhood: patientForm.getValues("neighborhood") || "",
                            city: patientForm.getValues("city") || "",
                            state: patientForm.getValues("state") || "",
                          }}
                          isSubmitting={isUpdatingProfile || !isEditMode}
                          onSubmit={(addressData) => {
                            // Usar setTimeout para evitar conflitos de renderização
                            setTimeout(() => {
                              // Atualizar os valores no formulário principal em tempo real
                              patientForm.setValue("zipcode", addressData.zipcode, { shouldDirty: true, shouldValidate: false });
                              patientForm.setValue("street", addressData.street, { shouldDirty: true, shouldValidate: false });
                              patientForm.setValue("number", addressData.number, { shouldDirty: true, shouldValidate: false });
                              patientForm.setValue("complement", addressData.complement || "", { shouldDirty: true, shouldValidate: false });
                              patientForm.setValue("neighborhood", addressData.neighborhood, { shouldDirty: true, shouldValidate: false });
                              patientForm.setValue("city", addressData.city, { shouldDirty: true, shouldValidate: false });
                              patientForm.setValue("state", addressData.state, { shouldDirty: true, shouldValidate: false });
                              
                              // Construir o endereço completo para o campo legado
                              const fullAddress = `${addressData.street}, ${addressData.number}${addressData.complement ? `, ${addressData.complement}` : ""} - ${addressData.neighborhood} - ${addressData.city}/${addressData.state} - CEP: ${addressData.zipcode}`;
                              patientForm.setValue("address", fullAddress, { shouldDirty: true, shouldValidate: false });
                            }, 0);
                          }}
                          showSubmitButton={false}
                          standAlone={false} // Modo integrado - não cria um <form> aninhado
                          isReadOnly={!isEditMode} // Tornar readonly quando não está em modo de edição
                        />
                      </div>
                      
                      <FormField
                        control={patientForm.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem className="max-w-sm">
                            <FormLabel>Data de Nascimento</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                disabled={isUpdatingProfile || !isEditMode}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-3">
                        {!isEditMode ? (
                          <Button 
                            type="button" 
                            onClick={() => setIsEditMode(true)}
                            variant="outline"
                          >
                            Editar informações
                          </Button>
                        ) : (
                          <Button 
                            type="button" 
                            onClick={() => setIsEditMode(false)}
                            variant="outline"
                          >
                            Cancelar edição
                          </Button>
                        )}
                        
                        <Button 
                          type="submit" 
                          disabled={isUpdatingProfile || !isEditMode}
                        >
                          {isUpdatingProfile ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : "Salvar Alterações"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
                
                {/* Médico */}
                {user?.role === "doctor" && doctorData && (
                  <Form {...doctorForm}>
                    <form onSubmit={doctorForm.handleSubmit(onDoctorSubmit)} className="space-y-4">
                      {/* Upload de foto de perfil para médicos */}
                      <div className="flex justify-center mb-6">
                        <ProfilePhotoSection
                          currentImage={profileImage}
                          userName={user?.fullName || 'Médico'}
                          userType="doctor"
                          size="xl"
                          onImageUpdate={(url) => {
                            setProfileImage(url);
                            // Invalidar cache para atualizar dados
                            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                            queryClient.invalidateQueries({ queryKey: ["/api/doctors/user", user?.id] });
                            queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
                            // Forçar refetch para garantir atualização
                            setTimeout(() => {
                              queryClient.refetchQueries({ queryKey: ["/api/user"] });
                            }, 300);
                          }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={doctorForm.control as Control<DoctorProfileFormValues>}
                          name="specialization"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Especialização</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Ex: Clínico Geral" 
                                  disabled={isUpdatingProfile || !isEditMode}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={doctorForm.control as Control<DoctorProfileFormValues>}
                          name="licenseNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Registro (CRM)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="12345-SP" 
                                  disabled={isUpdatingProfile || !isEditMode}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* TEMPORARILY COMMENTED OUT - MIGRATION PENDING
                        <FormField
                          control={doctorForm.control as Control<DoctorProfileFormValues>}
                          name="rqe"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>RQE - Registro de Qualificação de Especialista</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="RQE 12345 (Opcional)" 
                                  disabled={isUpdatingProfile || !isEditMode}
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Informe seu RQE se você possui título de especialista
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        */}
                      </div>
                      
                      <FormField
                        control={doctorForm.control as Control<DoctorProfileFormValues>}
                        name="fullBio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Biografia profissional</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Biografia detalhada para exibição no perfil..." 
                                disabled={isUpdatingProfile || !isEditMode}
                                className="min-h-32"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Esta biografia será exibida em seu perfil público
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={doctorForm.control as Control<DoctorProfileFormValues>}
                        name="achievements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conquistas e Certificações</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva suas principais conquistas, prêmios e certificações..." 
                                disabled={isUpdatingProfile || !isEditMode}
                                className="min-h-24"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={doctorForm.control as Control<DoctorProfileFormValues>}
                          name="education"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Formação Acadêmica</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Universidade, Curso, Ano" 
                                  disabled={isUpdatingProfile || !isEditMode}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={doctorForm.control as Control<DoctorProfileFormValues>}
                          name="experienceYears"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Anos de Experiência</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0"
                                  placeholder="10" 
                                  disabled={isUpdatingProfile || !isEditMode}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={doctorForm.control as Control<DoctorProfileFormValues>}
                        name="consultationFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor da Consulta (R$)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                step="0.01"
                                placeholder="150.00" 
                                disabled={isUpdatingProfile || !isEditMode}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={doctorForm.control as Control<DoctorProfileFormValues>}
                        name="consultationPriceDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição do Valor</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: Inclui retorno em até 30 dias" 
                                disabled={isUpdatingProfile || !isEditMode}
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Informações adicionais sobre o valor da consulta
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={doctorForm.control as Control<DoctorProfileFormValues>}
                        name="availableForEmergency"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isUpdatingProfile || !isEditMode}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Disponível para Emergências</FormLabel>
                              <FormDescription>
                                Permitir que pacientes me contatem para consultas de emergência
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={isUpdatingProfile}
                        >
                          {isUpdatingProfile ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : "Salvar Alterações"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
                
                {/* Parceiro (Empresa) */}
                {user?.role === "partner" && partnerData && (
                  <Form {...partnerForm}>
                    <form onSubmit={partnerForm.handleSubmit(onPartnerSubmit)} className="space-y-4">
                      {/* Upload de foto de perfil para parceiros */}
                      <div className="flex justify-center mb-6">
                        <ProfilePhotoUploader
                          currentImage={profileImage || partnerData?.profileImage}
                          userName={partnerData?.businessName || user?.fullName || 'Parceiro'}
                          userType="partner"
                          size="xl"
                          onImageUpdate={(url) => {
                            console.log("Imagem atualizada para parceiro:", url);
                            setProfileImage(url);
                            // Invalidar cache para atualizar dados
                            queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Query principal
                            queryClient.invalidateQueries({ queryKey: ["/api/partners/me"] });
                            queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
                            // Forçar refetch para garantir atualização
                            setTimeout(() => {
                              queryClient.refetchQueries({ queryKey: ["/api/user"] });
                              queryClient.refetchQueries({ queryKey: ["/api/partners/me"] });
                            }, 300);
                          }}
                          className="w-fit"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={partnerForm.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome da Empresa</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Sua Empresa Ltda." 
                                  disabled={!isEditMode || isUpdatingProfile}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={partnerForm.control}
                          name="businessType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Negócio</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Clínica, Hospital, etc." 
                                  disabled={!isEditMode || isUpdatingProfile}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={partnerForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição da Empresa</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva sua empresa e serviços..." 
                                disabled={isUpdatingProfile}
                                className="min-h-32"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={partnerForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://www.seusite.com.br" 
                                  disabled={!isEditMode || isUpdatingProfile}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={partnerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="(00) 0000-0000" 
                                  disabled={!isEditMode || isUpdatingProfile}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={partnerForm.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="00.000.000/0000-00" 
                                disabled={isUpdatingProfile}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Toggle Atendimento Nacional */}
                      <FormField
                        control={partnerForm.control}
                        name="nationwideService"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Atendimento em todo o Brasil
                              </FormLabel>
                              <FormDescription>
                                Quando ativado, seu serviço ficará disponível para pacientes de qualquer localidade, sem necessidade de endereço específico.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isUpdatingProfile || !isEditMode}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Seção de Endereço Comercial Completo */}
                      <div className="mt-6 mb-4">
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-medium">Endereço Comercial</h3>
                          {partnerForm.watch("nationwideService") && (
                            <span className="text-sm text-muted-foreground">(Desabilitado - Atendimento Nacional Ativo)</span>
                          )}
                        </div>
                        
                        <div className="address-form-container">
                          <AddressForm
                            key={`partner-address-${partnerData?.id}-${isPartnerFormInitialized}`}
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
                              console.log("Dados de endereço recebidos do componente AddressForm:", addressData);
                              
                              // Usar setTimeout para evitar conflitos de renderização
                              setTimeout(() => {
                                // Atualizar os valores no formulário principal em tempo real
                                partnerForm.setValue("zipcode", addressData.zipcode, { shouldDirty: true, shouldValidate: false });
                                partnerForm.setValue("street", addressData.street, { shouldDirty: true, shouldValidate: false });
                                partnerForm.setValue("number", addressData.number, { shouldDirty: true, shouldValidate: false });
                                partnerForm.setValue("complement", addressData.complement || "", { shouldDirty: true, shouldValidate: false });
                                partnerForm.setValue("neighborhood", addressData.neighborhood, { shouldDirty: true, shouldValidate: false });
                                partnerForm.setValue("city", addressData.city, { shouldDirty: true, shouldValidate: false });
                                partnerForm.setValue("state", addressData.state, { shouldDirty: true, shouldValidate: false });
                                
                                // Construir o endereço completo para o campo legado
                                const fullAddress = `${addressData.street}, ${addressData.number}${addressData.complement ? `, ${addressData.complement}` : ""} - ${addressData.neighborhood} - ${addressData.city}/${addressData.state} - CEP: ${addressData.zipcode}`;
                                partnerForm.setValue("address", fullAddress, { shouldDirty: true, shouldValidate: false });
                              }, 0);
                            }}
                            isSubmitting={isUpdatingProfile}
                            showSubmitButton={false}
                            standAlone={false} // Modo integrado - não cria um <form> aninhado
                            isReadOnly={!isEditMode || partnerForm.watch("nationwideService")} // Tornar readonly quando não está em modo de edição ou quando atendimento nacional está ativo
                          />
                        </div>
                      </div>
                      
                      {isEditMode && (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditMode(false);
                              // Resetar o formulário para os valores originais
                              partnerForm.reset({
                                businessName: partnerData?.businessName || "",
                                businessType: partnerData?.businessType || "",
                                description: partnerData?.description || "",
                                website: partnerData?.website || "",
                                address: partnerData?.address || "",
                                zipcode: partnerData?.zipcode || "",
                                street: partnerData?.street || "",
                                number: partnerData?.number || "",
                                complement: partnerData?.complement || "",
                                neighborhood: partnerData?.neighborhood || "",
                                city: partnerData?.city || "",
                                state: partnerData?.state || "",
                                phone: partnerData?.phone || "",
                                cnpj: partnerData?.cnpj || "",
                                nationwideService: partnerData?.nationwideService || false,
                              });
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={isUpdatingProfile}
                          >
                            {isUpdatingProfile ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                              </>
                            ) : "Salvar Alterações"}
                          </Button>
                        </div>
                      )}
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
            
            {/* Botão de Logout para iOS */}
            {Capacitor.isNativePlatform() && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logoutMutation.mutate();
                  }}
                  disabled={logoutMutation.isPending}
                  className="text-gray-500 hover:text-red-600 transition-colors"
                >
                  {logoutMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Saindo...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-3 w-3" />
                      Sair
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Aba de Dependentes - apenas para pacientes com plano familiar */}
          {user?.role === "patient" && user?.subscriptionPlan?.includes('_family') && (
            <TabsContent value="dependents">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <CardTitle>Dependentes do Plano Familiar</CardTitle>
                      <CardDescription>
                        Gerencie até 3 dependentes no seu plano familiar
                      </CardDescription>
                    </div>
                    
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          disabled={dependents.length >= 3}
                          size="sm"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Adicionar Dependente
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Adicionar Novo Dependente</DialogTitle>
                          <DialogDescription>
                            Cadastre um dependente no seu plano familiar.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Form {...dependentForm}>
                          <form onSubmit={dependentForm.handleSubmit(onDependentSubmit)} className="space-y-4">
                            <FormField
                              control={dependentForm.control}
                              name="fullName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome Completo *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Digite o nome completo"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={dependentForm.control}
                              name="cpf"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CPF *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Digite apenas números"
                                      maxLength={11}
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={dependentForm.control}
                              name="relationship"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Parentesco</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione o parentesco" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="pai">Pai</SelectItem>
                                      <SelectItem value="mae">Mãe</SelectItem>
                                      <SelectItem value="filho">Filho(a)</SelectItem>
                                      <SelectItem value="conjuge">Cônjuge</SelectItem>
                                      <SelectItem value="outro">Outro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={dependentForm.control}
                              name="birthDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Data de Nascimento</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="flex gap-2 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                className="flex-1"
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                disabled={createDependentMutation.isPending}
                                className="flex-1"
                              >
                                {createDependentMutation.isPending ? 'Salvando...' : 'Adicionar'}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Alert sobre limite */}
                  {dependents.length >= 3 && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Você atingiu o limite máximo de 3 dependentes para planos familiares.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Lista de dependentes */}
                  {dependentsLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-20 bg-gray-200 rounded"></div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                      {dependents.length === 0 ? (
                        <div className="lg:col-span-2 text-center py-12">
                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Nenhum dependente cadastrado
                          </h3>
                          <p className="text-gray-600">
                            Comece adicionando seu primeiro dependente ao plano familiar.
                          </p>
                        </div>
                      ) : (
                        dependents.map((dependent) => (
                          <Card key={dependent.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <CardTitle className="text-lg font-semibold">
                                    {dependent.fullName}
                                  </CardTitle>
                                  <p className="text-sm text-gray-600">
                                    <strong>CPF:</strong> {formatCpf(dependent.cpf)}
                                  </p>
                                  {dependent.relationship && (
                                    <p className="text-sm text-gray-600">
                                      <strong>Parentesco:</strong> {dependent.relationship}
                                    </p>
                                  )}
                                  {dependent.birthDate && (
                                    <p className="text-sm text-gray-600">
                                      <strong>Data de nascimento:</strong> {new Date(dependent.birthDate).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="secondary">
                                  Dependente
                                </Badge>
                              </div>
                            </CardHeader>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
                  
                  {/* Informações do plano */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Informações do Plano Familiar</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600 space-y-2">
                      <p>• Você pode adicionar até 3 dependentes no seu plano familiar</p>
                      <p>• Os dependentes têm acesso aos mesmos benefícios do seu plano</p>
                      <p>• Dependentes utilizados: {dependents.length}/3</p>
                      <p className="text-amber-600">• Para remover dependentes, entre em contato com o suporte</p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Altere sua senha e configure outras opções de segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha Atual</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              disabled={isChangingPassword}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nova Senha</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              disabled={isChangingPassword}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Nova Senha</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              disabled={isChangingPassword}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Alterando senha...
                          </>
                        ) : "Alterar Senha"}
                      </Button>
                    </div>
                  </form>
                </Form>
                
                {/* Biometric Settings - apenas no iOS */}
                {isBiometricAvailable && Capacitor.isNativePlatform() && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          {biometryTypeName === 'Touch ID' || biometryTypeName === 'Impressão Digital' ? (
                            <Fingerprint className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                          )}
                          <h3 className="text-base font-medium">Login com {biometryTypeName}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Faça login automaticamente usando {biometryTypeName} quando abrir o app
                        </p>
                      </div>
                      <Switch
                        checked={biometricEnabled}
                        onCheckedChange={handleBiometricToggle}
                        aria-label={`Habilitar login com ${biometryTypeName}`}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Card de Vendedor/Consultor - apenas para pacientes */}
            {user?.role === "patient" && (
              <SellerForm subscriptionChangedAt={profileData?.updatedAt} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;