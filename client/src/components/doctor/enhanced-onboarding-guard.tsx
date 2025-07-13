import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { isNativeApp } from '@/utils/platform';
import { httpRequest } from '@/lib/http-client';

interface EnhancedDoctorOnboardingGuardProps {
  children: React.ReactNode;
}

export function EnhancedDoctorOnboardingGuard({ children }: EnhancedDoctorOnboardingGuardProps) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Get doctor profile to check if onboarding is complete
  const { data: doctorProfile, isLoading, error } = useQuery({
    queryKey: ['/api/doctors/profile'],
    queryFn: async ({ signal }) => {
      try {
        // No iOS, usar httpRequest para garantir envio de tokens
        if (isNativeApp()) {
          console.log('🔍 [EnhancedDoctorOnboardingGuard] Buscando perfil via httpRequest...');
          return await httpRequest<any>('/api/doctors/profile', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          });
        }
        
        // Na web, usar fetch normal
        const res = await fetch('/api/doctors/profile', { 
          signal,
          credentials: 'include' 
        });
        
        if (!res.ok) {
          // Se o perfil não existe (404), retornar null ao invés de lançar erro
          if (res.status === 404) {
            console.log('⚠️ [EnhancedDoctorOnboardingGuard] Perfil não encontrado (404)');
            return null;
          }
          throw new Error('Falha ao buscar perfil');
        }
        return res.json();
      } catch (error: any) {
        console.error('❌ [EnhancedDoctorOnboardingGuard] Erro ao buscar perfil:', error);
        // Se for erro de parsing ou rede, retornar null ao invés de lançar
        if (error.message?.includes('JSON') || error.message?.includes('pattern')) {
          console.log('⚠️ [EnhancedDoctorOnboardingGuard] Erro de parsing, retornando null');
          return null;
        }
        throw error;
      }
    },
    enabled: !!user && user.role === 'doctor',
    // Reduzir tentativas para evitar loop
    staleTime: 5000, // Cache por 5 segundos
    cacheTime: 5000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    gcTime: 5000,
    retry: 1, // Tentar apenas 1 vez
    retryDelay: 2000 // Aguardar 2 segundos entre tentativas
  });

  useEffect(() => {
    // Skip if not a doctor or still loading
    if (!user || user.role !== 'doctor' || isLoading) return;
    
    // Skip if already on onboarding page
    if (location === '/doctor-onboarding') return;
    
    // Debug log detalhado para iOS
    console.log('🔍 [EnhancedDoctorOnboardingGuard] Verificação iniciada:', {
      platform: isNativeApp() ? 'iOS' : 'Web',
      user: user?.email,
      location,
      error: error?.message,
      profileLoaded: !!doctorProfile,
      onboardingCompleted: doctorProfile?.onboardingCompleted,
      rawProfile: JSON.stringify(doctorProfile)
    });
    
    // Se houve erro ao carregar o perfil, não fazer nada (evitar loop)
    if (error) {
      console.error('❌ [EnhancedDoctorOnboardingGuard] Erro ao carregar perfil:', error);
      return;
    }
    
    // Se o perfil é null ou undefined, redirecionar para onboarding
    if (!doctorProfile) {
      console.log('⚠️ [EnhancedDoctorOnboardingGuard] Perfil não existe, redirecionando para onboarding...');
      navigate('/doctor-onboarding');
      return;
    }
    
    // Se o perfil foi carregado
    console.log('📊 [EnhancedDoctorOnboardingGuard] Perfil carregado:', {
      id: doctorProfile.id,
      userId: doctorProfile.userId,
      onboardingCompleted: doctorProfile.onboardingCompleted,
      onboardingCompletedType: typeof doctorProfile.onboardingCompleted,
      hasAllFields: !!(doctorProfile.specialization && 
                       doctorProfile.education &&
                       doctorProfile.consultationFee &&
                       doctorProfile.pixKey &&
                       doctorProfile.bankName)
    });
    
    // IMPORTANTE: Se onboardingCompleted é true, NÃO redirecionar
    if (doctorProfile.onboardingCompleted === true) {
      console.log('✅ [EnhancedDoctorOnboardingGuard] Onboarding já completado, permitindo acesso');
      return;
    }
    
    // Se onboardingCompleted é false ou null, verificar campos
    console.log('⚠️ [EnhancedDoctorOnboardingGuard] Onboarding não completado, verificando campos...');
    
    const isProfileIncomplete = !doctorProfile.specialization || 
                               !doctorProfile.education ||
                               !doctorProfile.consultationFee ||
                               !doctorProfile.pixKey ||
                               !doctorProfile.bankName;
    
    console.log('📄 [EnhancedDoctorOnboardingGuard] Status dos campos:', {
      specialization: !!doctorProfile.specialization,
      education: !!doctorProfile.education,
      consultationFee: !!doctorProfile.consultationFee,
      pixKey: !!doctorProfile.pixKey,
      bankName: !!doctorProfile.bankName,
      isProfileIncomplete
    });
    
    if (isProfileIncomplete) {
      console.log('🚀 [EnhancedDoctorOnboardingGuard] Redirecionando para onboarding...');
      navigate('/doctor-onboarding');
    }
  }, [user, doctorProfile, isLoading, location, navigate, error]);

  // Show loading while checking profile
  if (user && user.role === 'doctor' && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando seu perfil...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}