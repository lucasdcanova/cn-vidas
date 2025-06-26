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
    queryFn: ({ signal }) => 
      fetch('/api/doctors/profile', { 
        signal,
        credentials: 'include' 
      })
        .then(res => {
          if (!res.ok) throw new Error('Falha ao buscar perfil');
          return res.json();
        }),
    enabled: !!user && user.role === 'doctor',
    // Forçar busca fresca no iOS para evitar dados desatualizados
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    gcTime: 0 // Garante que não use garbage collection
  });

  useEffect(() => {
    // Skip if not a doctor or still loading
    if (!user || user.role !== 'doctor' || isLoading) return;
    
    // Skip if already on onboarding pages
    if (location === '/onboarding/doctor' || location === '/doctor-onboarding') return;
    
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
    
    // Se houve erro ao carregar o perfil
    if (error) {
      console.error('❌ [EnhancedDoctorOnboardingGuard] Erro ao carregar perfil:', error);
      return;
    }
    
    // Se o perfil foi carregado
    if (doctorProfile) {
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
        navigate('/onboarding/doctor');
      }
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