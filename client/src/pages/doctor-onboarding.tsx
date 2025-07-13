import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import cnvidasLogo from '@/assets/cnvidas-logo-transparent.png';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Stethoscope,
  CreditCard,
  DollarSign,
  Info,
  Building,
  Key,
  Phone,
  Mail,
  FileText,
  User,
  Clock,
  Percent
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { IOSScrollView } from '@/components/shared/IOSScrollView';
import { IOSKeyboardAvoidingView } from '@/components/shared/IOSKeyboardAvoidingView';
import { isIOS } from '@/utils/platform';
import { StatusBar } from '@capacitor/status-bar';

interface DoctorProfileData {
  specialization: string;
  licenseNumber: string;
  biography: string;
  education: string;
  experienceYears: number;
  consultationFee: number;
  pixKeyType: string;
  pixKey: string;
  bankName: string;
  accountType: string;
}

export default function DoctorOnboardingPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<DoctorProfileData>({
    specialization: '',
    licenseNumber: '',
    biography: '',
    education: '',
    experienceYears: 0,
    consultationFee: 0,
    pixKeyType: '',
    pixKey: '',
    bankName: '',
    accountType: 'corrente'
  });

  // Check if user is a doctor and configure status bar
  useEffect(() => {
    if (user && user.role !== 'doctor') {
      navigate('/dashboard');
    }
    
    // Configure status bar for iOS
    if (isIOS()) {
      StatusBar.setBackgroundColor({ color: '#f9fafb' }); // bg-gray-50
      StatusBar.setStyle({ style: 'DARK' });
    }
    
    // Cleanup on unmount
    return () => {
      if (isIOS()) {
        StatusBar.setBackgroundColor({ color: '#ffffff' });
      }
    };
  }, [user, navigate]);

  // Get current doctor profile
  const { data: doctorProfile, isLoading } = useQuery({
    queryKey: ['/api/doctors/profile'],
    queryFn: ({ signal }) => 
      fetch('/api/doctors/profile', { 
        signal,
        credentials: 'include' 
      })
        .then(res => {
          if (!res.ok) throw new Error('Falha ao buscar perfil');
          return res.json();
        }),
    enabled: !!user && user.role === 'doctor'
  });

  // Update form when profile loads
  useEffect(() => {
    if (doctorProfile) {
      setFormData({
        specialization: doctorProfile.specialization || '',
        licenseNumber: doctorProfile.licenseNumber || '',
        biography: doctorProfile.biography || '',
        education: doctorProfile.education || '',
        experienceYears: doctorProfile.experienceYears || 0,
        consultationFee: doctorProfile.consultationFee || 0,
        pixKeyType: doctorProfile.pixKeyType || '',
        pixKey: doctorProfile.pixKey || '',
        bankName: doctorProfile.bankName || '',
        accountType: doctorProfile.accountType || 'corrente'
      });
      
      // If profile is already complete, redirect to dashboard
      if (doctorProfile.onboardingCompleted) {
        navigate('/doctor-telemedicine');
      }
    }
  }, [doctorProfile, navigate]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<DoctorProfileData>) => {
      const res = await apiRequest('PUT', '/api/doctors/profile', data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao atualizar perfil');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctors/profile'] });
    }
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      console.log('🚀 Enviando dados para completar onboarding:', {
        ...formData,
        onboardingCompleted: true
      });
      
      const res = await apiRequest('PUT', '/api/doctors/profile', { 
        ...formData,
        onboardingCompleted: true 
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao completar cadastro');
      }
      const result = await res.json();
      console.log('✅ Resposta do servidor:', result);
      console.log('✅ onboardingCompleted no resultado:', result.onboardingCompleted);
      return result;
    },
    onSuccess: async (data) => {
      // Invalidar cache do perfil para forçar recarga
      await queryClient.invalidateQueries({ queryKey: ['/api/doctors/profile'] });
      await queryClient.refetchQueries({ queryKey: ['/api/doctors/profile'] });
      
      // IMPORTANT: Also invalidate the /api/doctors/user/{userId} endpoint used by profile page
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: ['/api/doctors/user', user.id] });
        await queryClient.refetchQueries({ queryKey: ['/api/doctors/user', user.id] });
      }
      
      // Invalidate user profile as well
      await queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      
      toast({
        title: 'Cadastro completado!',
        description: 'Bem-vindo ao CNVidas. Você já pode começar a atender pacientes.',
      });
      
      // Definir flag para indicar que acabou de completar o onboarding
      localStorage.setItem('justCompletedOnboarding', 'true');
      
      // Pequeno delay para garantir que o cache foi atualizado
      setTimeout(() => {
        navigate('/doctor-telemedicine');
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao completar cadastro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleNext = async () => {
    if (step === 1) {
      // Validate professional info
      if (!formData.specialization || !formData.education || !formData.licenseNumber) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Por favor, preencha todos os campos profissionais obrigatórios.',
          variant: 'destructive'
        });
        return;
      }
      
      // Update profile with step 1 data
      try {
        await updateProfileMutation.mutateAsync({
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
          education: formData.education,
          experienceYears: formData.experienceYears,
          biography: formData.biography
        });
        setStep(2);
      } catch (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Erro ao salvar',
          description: 'Ocorreu um erro ao salvar as informações. Tente novamente.',
          variant: 'destructive'
        });
      }
    } else if (step === 2) {
      // Validate consultation fee
      if (!formData.consultationFee || formData.consultationFee < 50) {
        toast({
          title: 'Valor inválido',
          description: 'O valor mínimo da consulta é R$ 50,00.',
          variant: 'destructive'
        });
        return;
      }
      
      // Update profile with step 2 data
      try {
        await updateProfileMutation.mutateAsync({
          consultationFee: formData.consultationFee
        });
        setStep(3);
      } catch (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Erro ao salvar',
          description: 'Ocorreu um erro ao salvar as informações. Tente novamente.',
          variant: 'destructive'
        });
      }
    } else if (step === 3) {
      // Validate payment info
      if (!formData.pixKeyType || !formData.pixKey || !formData.bankName) {
        toast({
          title: 'Dados bancários obrigatórios',
          description: 'Por favor, preencha todos os dados bancários para receber pagamentos.',
          variant: 'destructive'
        });
        return;
      }
      // Complete onboarding
      completeOnboardingMutation.mutate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Função para centralizar o campo focado
  const scrollToFocusedElement = (element: HTMLElement) => {
    if (!isIOS()) return;
    
    setTimeout(() => {
      // Tenta encontrar o container de scroll correto
      const scrollContainer = document.querySelector('.ios-scroll-view-content') || 
                             scrollViewRef.current?.querySelector('.overflow-y-auto') ||
                             scrollViewRef.current;
      
      if (!scrollContainer) {
        console.error('Scroll container not found');
        return;
      }

      // Obter a posição relativa do elemento dentro do container
      const elementRect = element.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      
      // Altura do teclado iOS baseada nos logs (aproximadamente 345-390px)
      const keyboardHeight = 370;
      
      // Altura da área visível (tela - teclado)
      const safeAreaTop = 50;
      const visibleHeight = window.innerHeight - keyboardHeight;
      
      // Queremos o campo no centro da área visível entre o teclado e o topo
      // Adicionamos o safeAreaTop para compensar a status bar
      const targetPosition = safeAreaTop + ((visibleHeight - safeAreaTop) / 2);
      
      // Posição atual do elemento relativa ao início do container
      const elementOffsetTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;
      
      // Calcula onde devemos scrollar para centralizar o elemento
      const desiredScrollTop = elementOffsetTop - targetPosition + (element.offsetHeight / 2);
      
      // Garante que não vamos scrollar além dos limites
      const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      const finalScrollTop = Math.max(0, Math.min(desiredScrollTop, maxScroll));
      
      // Executa o scroll
      scrollContainer.scrollTo({
        top: finalScrollTop,
        behavior: 'smooth'
      });
      
      // Log para debug
      console.log('Scroll debug:', {
        elementOffsetTop,
        targetPosition,
        desiredScrollTop: finalScrollTop,
        keyboardHeight,
        visibleHeight,
        containerHeight: scrollContainer.clientHeight,
        scrollHeight: scrollContainer.scrollHeight
      });
    }, 400); // Aguarda o teclado abrir completamente
  };

  // Handler para quando um input recebe foco
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFocusedField(e.target.id);
    scrollToFocusedElement(e.target);
  };

  // Handler para quando um input perde o foco
  const handleInputBlur = () => {
    setFocusedField(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50">
      <IOSScrollView 
        ref={scrollViewRef}
        className="h-full"
        contentClassName=""
      >
        <div className="bg-gray-50 pt-safe pb-8">
          <div className="max-w-3xl mx-auto px-4 pb-32">
            <div
              className="relative mx-auto my-6 md:my-8 px-6 py-8 md:px-8 md:py-12 flex flex-col items-center gap-4 text-center rounded-3xl bg-gradient-to-b from-white/70 to-gray-100 shadow-lg backdrop-blur-sm"
              style={{ 
                opacity: 0,
                animation: 'fadeInSimple 0.5s ease-out forwards', 
                animationDelay: '0.2s',
                animationFillMode: 'forwards'
              }}
            >
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 flex flex-col md:flex-row items-center justify-center gap-2">
                <span>Bem-vindo ao</span>
                <img
                  src={cnvidasLogo}
                  alt="CNVidas"
                  className="h-14 md:h-20 inline-block object-contain drop-shadow-lg"
                />
              </h1>
              <h2
                className="text-xl md:text-2xl font-semibold text-primary"
                style={{ 
                  opacity: 0,
                  animation: 'fadeInSimple 0.5s ease-out forwards', 
                  animationDelay: '0.4s',
                  animationFillMode: 'forwards'
                }}
              >
                Dr(a). {user?.fullName || user?.name || 'Médico'}
              </h2>
              <p
                className="text-muted-foreground text-base md:text-lg max-w-md"
                style={{ 
                  opacity: 0,
                  animation: 'fadeInSimple 0.5s ease-out forwards', 
                  animationDelay: '0.6s',
                  animationFillMode: 'forwards'
                }}
              >
                Complete seu cadastro para começar a atender pacientes
              </p>
            </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mt-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Stethoscope className="h-5 w-5" />
              </div>
              <div className={`w-20 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <DollarSign className="h-5 w-5" />
              </div>
              <div className={`w-20 h-1 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: '1s' }}>
          <Card className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border-gray-200/50">
          {/* Step 1: Professional Information */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Informações Profissionais
                </CardTitle>
                <CardDescription>
                  Preencha seus dados profissionais para que os pacientes possam conhecê-lo melhor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle className="flex items-center gap-1 whitespace-nowrap">
                    Como funciona o <img src={cnvidasLogo} alt="CNVidas" className="h-6 w-auto inline-block object-contain align-middle -mt-1" /> para Médicos
                  </AlertTitle>
                  <AlertDescription className="space-y-2 mt-2">
                    <p>• Atenda pacientes de todo Brasil por telemedicina</p>
                    <p>• Defina livremente o valor de suas consultas</p>
                    <p>• Receba pagamentos semanalmente via PIX</p>
                    <p>• Acesse prontuários e histórico dos pacientes</p>
                    <p>• Plataforma segura e em conformidade com CFM</p>
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="specialization" className="text-gray-700 font-medium">Especialidade *</Label>
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="specialization"
                        placeholder="Ex: Cardiologia, Clínica Geral, Pediatria"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className={`pl-10 rounded-xl bg-gray-50/50 border-gray-200/50 hover:bg-white/60 transition-all duration-200 ${
                          focusedField === 'specialization' ? 'border-blue-500 ring-4 ring-blue-500/10' : ''
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="licenseNumber" className="text-gray-700 font-medium">Número do CRM *</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="licenseNumber"
                        placeholder="Ex: CRM-SP 123456"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className={`pl-10 rounded-xl bg-gray-50/50 border-gray-200/50 hover:bg-white/60 transition-all duration-200 ${
                          focusedField === 'licenseNumber' ? 'border-blue-500 ring-4 ring-blue-500/10' : ''
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="education" className="text-gray-700 font-medium">Formação Acadêmica *</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="education"
                        placeholder="Ex: Medicina - USP (2015)"
                        value={formData.education}
                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className={`pl-10 rounded-xl bg-gray-50/50 border-gray-200/50 hover:bg-white/60 transition-all duration-200 ${
                          focusedField === 'education' ? 'border-blue-500 ring-4 ring-blue-500/10' : ''
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="experienceYears" className="text-gray-700 font-medium">Anos de Experiência</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="experienceYears"
                        type="number"
                        min="0"
                        placeholder="Ex: 10"
                        value={formData.experienceYears || ''}
                        onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value ? parseInt(e.target.value) : 0 })}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className={`pl-10 rounded-xl bg-gray-50/50 border-gray-200/50 hover:bg-white/60 transition-all duration-200 ${
                          focusedField === 'experienceYears' ? 'border-blue-500 ring-4 ring-blue-500/10' : ''
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="biography" className="text-gray-700 font-medium">Biografia (opcional)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Textarea
                        id="biography"
                        placeholder="Conte um pouco sobre sua experiência e abordagem médica..."
                        rows={4}
                        value={formData.biography}
                        onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className={`pl-10 rounded-xl bg-gray-50/50 border-gray-200/50 hover:bg-white/60 transition-all duration-200 ${
                          focusedField === 'biography' ? 'border-blue-500 ring-4 ring-blue-500/10' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Consultation Fee */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Valor da Consulta
                </CardTitle>
                <CardDescription>
                  Defina o valor da sua consulta online
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Como funciona o pagamento</AlertTitle>
                  <AlertDescription className="space-y-2 mt-2">
                    <p>• Você define livremente o valor de suas consultas</p>
                    <p>• Pacientes do <strong>Plano Free</strong>: Pagam 100% do valor da consulta</p>
                    <p>• Pacientes do <strong>Plano Basic</strong>: Têm 30% de desconto</p>
                    <p>• Pacientes dos <strong>Planos Premium e Ultra</strong>: Têm 50% de desconto</p>
                    <p>• Pagamentos são processados semanalmente via PIX direto na sua conta</p>
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="consultationFee" className="text-gray-700 font-medium">Valor da Consulta (R$) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <span className="absolute left-9 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        id="consultationFee"
                        type="number"
                        min="50"
                        step="10"
                        placeholder="0,00"
                        value={formData.consultationFee || ''}
                        onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value ? parseFloat(e.target.value) : 0 })}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className={`pl-16 rounded-xl bg-gray-50/50 border-gray-200/50 hover:bg-white/60 transition-all duration-200 ${
                          focusedField === 'consultationFee' ? 'border-blue-500 ring-4 ring-blue-500/10' : ''
                        }`}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Valor mínimo: R$ 50,00
                    </p>
                  </div>

                  {formData.consultationFee > 0 && (
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <h4 className="font-medium">Valores por tipo de plano:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Badge variant="outline">Plano Free</Badge>
                            Paciente paga:
                          </span>
                          <span className="font-semibold">R$ {formData.consultationFee.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Badge variant="secondary">Plano Basic</Badge>
                            Paciente paga:
                          </span>
                          <span className="font-semibold text-green-600">R$ {(formData.consultationFee * 0.7).toFixed(2)} (-30%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Badge>Planos Premium/Ultra</Badge>
                            Paciente paga:
                          </span>
                          <span className="font-semibold text-green-600">R$ {(formData.consultationFee * 0.5).toFixed(2)} (-50%)</span>
                        </div>
                        <Separator className="my-2" />
                        <p className="text-muted-foreground text-xs">
                          <Info className="inline h-3 w-3 mr-1" />
                          Os valores são definidos por você e repassados integralmente.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Payment Information */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Dados Bancários
                </CardTitle>
                <CardDescription>
                  Informe seus dados para receber os pagamentos das consultas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Pagamentos via PIX</AlertTitle>
                  <AlertDescription>
                    Todos os pagamentos são realizados exclusivamente via PIX, garantindo rapidez e segurança nas transações.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="pixKeyType" className="text-gray-700 font-medium">Tipo de Chave PIX *</Label>
                    <Select
                      value={formData.pixKeyType}
                      onValueChange={(value) => setFormData({ ...formData, pixKeyType: value })}
                    >
                      <SelectTrigger 
                        id="pixKeyType"
                        className={`rounded-xl bg-gray-50/50 border-gray-200/50 hover:bg-white/60 transition-all duration-200 ${
                          focusedField === 'pixKeyType' ? 'border-blue-500 ring-4 ring-blue-500/10' : ''
                        }`}
                        onFocus={() => setFocusedField('pixKeyType')}
                        onBlur={() => setFocusedField(null)}
                      >
                        <SelectValue placeholder="Selecione o tipo de chave" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="telefone">Telefone</SelectItem>
                        <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="pixKey" className="text-gray-700 font-medium">Chave PIX *</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="pixKey"
                        placeholder={
                          formData.pixKeyType === 'cpf' ? '000.000.000-00' :
                          formData.pixKeyType === 'email' ? 'seu@email.com' :
                          formData.pixKeyType === 'telefone' ? '(11) 99999-9999' :
                          'Chave aleatória'
                        }
                        value={formData.pixKey}
                        onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className={`pl-10 rounded-xl bg-gray-50/50 border-gray-200/50 hover:bg-white/60 transition-all duration-200 ${
                          focusedField === 'pixKey' ? 'border-blue-500 ring-4 ring-blue-500/10' : ''
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bankName" className="text-gray-700 font-medium">Banco *</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="bankName"
                        placeholder="Ex: Banco do Brasil, Itaú, Bradesco"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className={`pl-10 rounded-xl bg-gray-50/50 border-gray-200/50 hover:bg-white/60 transition-all duration-200 ${
                          focusedField === 'bankName' ? 'border-blue-500 ring-4 ring-blue-500/10' : ''
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="accountType" className="text-gray-700 font-medium">Tipo de Conta *</Label>
                    <Select
                      value={formData.accountType}
                      onValueChange={(value) => setFormData({ ...formData, accountType: value })}
                    >
                      <SelectTrigger 
                        id="accountType"
                        className={`rounded-xl bg-gray-50/50 border-gray-200/50 hover:bg-white/60 transition-all duration-200 ${
                          focusedField === 'accountType' ? 'border-blue-500 ring-4 ring-blue-500/10' : ''
                        }`}
                        onFocus={() => setFocusedField('accountType')}
                        onBlur={() => setFocusedField(null)}
                      >
                        <SelectValue placeholder="Selecione o tipo de conta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrente">Conta Corrente</SelectItem>
                        <SelectItem value="poupanca">Conta Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          <CardFooter className="flex justify-between">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={updateProfileMutation.isPending || completeOnboardingMutation.isPending}
              >
                Voltar
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={updateProfileMutation.isPending || completeOnboardingMutation.isPending}
              className={step === 1 ? 'ml-auto' : ''}
            >
              {step === 1 && updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando informações...
                </>
              ) : step === 2 && updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando valor...
                </>
              ) : step === 3 && completeOnboardingMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizando cadastro...
                </>
              ) : step === 3 ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completar Cadastro
                </>
              ) : (
                'Próximo'
              )}
            </Button>
          </CardFooter>
        </Card>
        </div>

        {/* Additional Information */}
        <div className="mt-8 space-y-6">
          <div className="animate-slide-up" style={{ animationDelay: '1.2s' }}>
          <Card className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Vantagens de ser Médico CNVidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Atenda de qualquer lugar</p>
                  <p className="text-sm text-muted-foreground">Telemedicina integrada e segura</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Pagamentos garantidos</p>
                  <p className="text-sm text-muted-foreground">Receba semanalmente via PIX</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Prontuário eletrônico</p>
                  <p className="text-sm text-muted-foreground">Histórico completo dos pacientes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Conformidade com CFM</p>
                  <p className="text-sm text-muted-foreground">Plataforma segura e regulamentada</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Ao completar seu cadastro, você concorda com nossos{' '}
              <a href="/termos" className="underline hover:text-primary">
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="/privacidade" className="underline hover:text-primary">
                Política de Privacidade
              </a>
            </p>
          </div>
          </div> {/* Fecha a div mt-8 space-y-6 */}
        </div> {/* Fecha a div max-w-3xl */}
      </div> {/* Fecha a div bg-gray-50 */}
      </IOSScrollView>
    </div>
  );
}