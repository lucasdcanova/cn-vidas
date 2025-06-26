import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface EnhancedDoctorOnboardingGuardProps {
  children: React.ReactNode;
}

export function EnhancedDoctorOnboardingGuard({ children }: EnhancedDoctorOnboardingGuardProps) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Get doctor profile to check if onboarding is complete
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
    enabled: !!user && user.role === 'doctor',
    // Forçar busca fresca no iOS para evitar dados desatualizados
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    // Skip if not a doctor or still loading
    if (!user || user.role !== 'doctor' || isLoading) return;
    
    // Skip if already on onboarding pages
    if (location === '/onboarding/doctor' || location === '/doctor-onboarding') return;
    
    // Debug log para iOS
    console.log('🔍 EnhancedDoctorOnboardingGuard - Verificando perfil do médico:', {
      doctorProfile,
      onboardingCompleted: doctorProfile?.onboardingCompleted,
      location,
      user: user?.email
    });
    
    // Check if onboarding is complete with the new field
    if (doctorProfile && !doctorProfile.onboardingCompleted) {
      console.log('⚠️ EnhancedDoctorOnboardingGuard - Onboarding não completado, verificando campos...');
      
      // Check if essential fields are filled
      const isProfileIncomplete = !doctorProfile.specialization || 
                                 !doctorProfile.education ||
                                 !doctorProfile.consultationFee ||
                                 !doctorProfile.pixKey ||
                                 !doctorProfile.bankName;
      
      console.log('📄 EnhancedDoctorOnboardingGuard - Campos do perfil:', {
        specialization: !!doctorProfile.specialization,
        education: !!doctorProfile.education,
        consultationFee: !!doctorProfile.consultationFee,
        pixKey: !!doctorProfile.pixKey,
        bankName: !!doctorProfile.bankName,
        isProfileIncomplete
      });
      
      if (isProfileIncomplete) {
        console.log('🚀 EnhancedDoctorOnboardingGuard - Redirecionando para onboarding...');
        navigate('/onboarding/doctor');
      }
    }
  }, [user, doctorProfile, isLoading, location, navigate]);

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