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
  Percent,
  GraduationCap,
  Calendar,
  MapPin,
  Briefcase
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { IOSScrollView } from '@/components/shared/IOSScrollView';
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
      
      // If doctor already completed onboarding, redirect
      if (doctorProfile.onboardingCompleted) {
        navigate('/dashboard');
      }
    }
  }, [doctorProfile, navigate]);

  // Update doctor profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
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

  const handleNext = async () => {
    console.log('handleNext called, current step:', step);
    
    if (step === 1) {
      // Validate professional info
      if (!formData.specialization || !formData.licenseNumber || !formData.education || !formData.experienceYears) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Por favor, preencha todos os campos obrigatórios.',
          variant: 'destructive'
        });
        return;
      }
      
      setStep(2);
    } else if (step === 2) {
      // Validate consultation info
      if (!formData.consultationFee || formData.consultationFee <= 0) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Por favor, informe o valor da consulta.',
          variant: 'destructive'
        });
        return;
      }
      
      setStep(3);
    } else if (step === 3) {
      // Validate payment info
      if (!formData.pixKeyType || !formData.pixKey || !formData.bankName) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Por favor, preencha todos os dados bancários.',
          variant: 'destructive'
        });
        return;
      }
      
      // Update profile and complete onboarding
      try {
        await updateProfileMutation.mutateAsync({
          ...formData,
          onboardingCompleted: true
        });
        
        toast({
          title: 'Cadastro completado!',
          description: 'Bem-vindo ao CNVidas. Você já pode começar a atender pacientes.',
        });
        
        navigate('/dashboard');
      } catch (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Erro ao salvar',
          description: 'Ocorreu um erro ao salvar as informações. Tente novamente.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Função para centralizar o campo focado (idêntica ao partner)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando seu perfil...</p>
        </div>
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
                        Preencha seus dados profissionais para que os pacientes possam conhecê-lo
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle className="flex items-center gap-1 whitespace-nowrap">
                          Como funciona a <img src={cnvidasLogo} alt="CNVidas" className="h-6 w-auto inline-block object-contain align-middle -mt-1" /> para Médicos
                        </AlertTitle>
                        <AlertDescription className="space-y-2 mt-2">
                          <p>• Atenda pacientes por telemedicina de forma segura e regulamentada</p>
                          <p>• Receba pagamentos diretamente via PIX após cada consulta</p>
                          <p>• Prescreva receitas digitais com assinatura eletrônica</p>
                          <p>• Acesse prontuário eletrônico completo dos pacientes</p>
                          <p>• Sem mensalidade - você paga apenas uma taxa por consulta realizada</p>
                        </AlertDescription>
                      </Alert>

                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="specialization" className="text-gray-700 font-medium">Especialidade *</Label>
                          <div className="relative">
                            <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="specialization"
                              placeholder="Ex: Cardiologia, Clínica Geral"
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
                          <Label htmlFor="licenseNumber" className="text-gray-700 font-medium">CRM *</Label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="licenseNumber"
                              placeholder="Ex: 123456/SP"
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
                            <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Textarea
                              id="education"
                              placeholder="Ex: Medicina - USP (2010)&#10;Residência em Cardiologia - HC-FMUSP (2013)"
                              rows={3}
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
                          <Label htmlFor="experienceYears" className="text-gray-700 font-medium">Anos de Experiência *</Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="experienceYears"
                              type="number"
                              min="0"
                              placeholder="Ex: 10"
                              value={formData.experienceYears || ''}
                              onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                              onFocus={handleInputFocus}
                              onBlur={handleInputBlur}
                              className={`pl-10 rounded-xl bg-gray-50/50 border-gray-200/50 hover:bg-white/60 transition-all duration-200 ${
                                focusedField === 'experienceYears' ? 'border-blue-500 ring-4 ring-blue-500/10' : ''
                              }`}
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="biography" className="text-gray-700 font-medium">Biografia</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Textarea
                              id="biography"
                              placeholder="Conte um pouco sobre você, sua experiência e abordagem médica..."
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

                {/* Step 2: Consultation Information */}
                {step === 2 && (
                  <>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Informações da Consulta
                      </CardTitle>
                      <CardDescription>
                        Defina o valor e os detalhes das suas consultas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Como funciona o pagamento</AlertTitle>
                        <AlertDescription className="space-y-2 mt-2">
                          <p>• Você define o valor da consulta</p>
                          <p>• Pacientes pagam antecipadamente via cartão, PIX ou boleto</p>
                          <p>• Você recebe automaticamente via PIX após a consulta</p>
                          <p>• CNVidas cobra apenas 20% de taxa sobre cada consulta realizada</p>
                          <p>• Sem mensalidade ou taxas fixas</p>
                        </AlertDescription>
                      </Alert>

                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="consultationFee" className="text-gray-700 font-medium">Valor da Consulta (R$) *</Label>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <span className="absolute left-9 top-1/2 -translate-y-1/2 text-muted-foreground">
                              R$
                            </span>
                            <Input
                              id="consultationFee"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="150,00"
                              value={formData.consultationFee || ''}
                              onChange={(e) => setFormData({ ...formData, consultationFee: parseFloat(e.target.value) || 0 })}
                              onFocus={handleInputFocus}
                              onBlur={handleInputBlur}
                              className={`pl-16 rounded-xl bg-gray-50/50 border-gray-200/50 hover:bg-white/60 transition-all duration-200 ${
                                focusedField === 'consultationFee' ? 'border-blue-500 ring-4 ring-blue-500/10' : ''
                              }`}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Valor sugerido: R$ 100,00 a R$ 300,00 por consulta
                          </p>
                        </div>

                        {formData.consultationFee > 0 && (
                          <div className="bg-muted rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Valor da consulta:</span>
                              <span className="font-semibold">R$ {formData.consultationFee.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span className="text-sm">Taxa CNVidas (20%):</span>
                              <span className="text-sm">- R$ {(formData.consultationFee * 0.20).toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Você recebe:</span>
                              <span className="font-semibold text-green-600">
                                R$ {(formData.consultationFee * 0.80).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}

                        <Alert>
                          <Clock className="h-4 w-4" />
                          <AlertTitle>Duração das consultas</AlertTitle>
                          <AlertDescription>
                            As consultas têm duração padrão de 30 minutos, podendo ser estendidas conforme necessário.
                          </AlertDescription>
                        </Alert>
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
                        Dados para Recebimento
                      </CardTitle>
                      <CardDescription>
                        Configure como você receberá os pagamentos das consultas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Recebimento via PIX</AlertTitle>
                        <AlertDescription className="space-y-2 mt-2">
                          <p>• Receba instantaneamente após cada consulta</p>
                          <p>• Sem taxas adicionais de transferência</p>
                          <p>• Disponível 24/7, inclusive fins de semana</p>
                          <p>• Confirmação automática de pagamento</p>
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
                              <SelectItem value="phone">Telefone</SelectItem>
                              <SelectItem value="random">Chave aleatória</SelectItem>
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
                                formData.pixKeyType === 'phone' ? '(11) 99999-9999' :
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
                              placeholder="Ex: Banco do Brasil, Itaú, Nubank"
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
                              <SelectItem value="pagamento">Conta de Pagamento</SelectItem>
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
                      disabled={updateProfileMutation.isPending}
                    >
                      Voltar
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleNext}
                    disabled={updateProfileMutation.isPending}
                    className={step === 1 ? 'ml-auto' : ''}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
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
                      <Briefcase className="h-5 w-5" />
                      Vantagens de ser Médico CNVidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Atenda de qualquer lugar</p>
                        <p className="text-sm text-muted-foreground">Flexibilidade total para trabalhar de casa ou consultório</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Receba rapidamente</p>
                        <p className="text-sm text-muted-foreground">Pagamentos via PIX logo após cada consulta</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Prontuário eletrônico completo</p>
                        <p className="text-sm text-muted-foreground">Histórico e documentos dos pacientes em um só lugar</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Prescrição digital</p>
                        <p className="text-sm text-muted-foreground">Receitas com assinatura eletrônica válida em todo Brasil</p>
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
            </div>
          </div>
        </div>
      </IOSScrollView>
    </div>
  );
}