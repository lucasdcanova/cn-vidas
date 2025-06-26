import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { httpRequest } from '@/lib/http-client';

interface PartnerOnboardingGuardProps {
  children: React.ReactNode;
}

export function PartnerOnboardingGuard({ children }: PartnerOnboardingGuardProps) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Get partner profile
  const { data: partnerProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['/api/partners/me'],
    queryFn: async () => {
      try {
        return await httpRequest('/api/partners/me');
      } catch (error) {
        console.error('❌ [PartnerOnboardingGuard] Erro ao buscar perfil:', error);
        throw error;
      }
    },
    enabled: !!user && user.role === 'partner',
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true
  });

  // Check partner addresses
  const { data: addresses, isLoading: loadingAddresses, error: addressesError } = useQuery({
    queryKey: ['/api/partners/addresses'],
    queryFn: async () => {
      try {
        return await httpRequest('/api/partners/addresses');
      } catch (error) {
        console.error('❌ [PartnerOnboardingGuard] Erro ao buscar endereços:', error);
        // Em caso de erro, retornar array vazio para não bloquear
        return [];
      }
    },
    enabled: !!partnerProfile,
    staleTime: 0,
    gcTime: 0,
    retry: 1
  });

  // Check partner services
  const { data: services, isLoading: loadingServices, error: servicesError } = useQuery({
    queryKey: ['/api/partners/my-services'],
    queryFn: async () => {
      try {
        return await httpRequest('/api/partners/my-services');
      } catch (error) {
        console.error('❌ [PartnerOnboardingGuard] Erro ao buscar serviços:', error);
        // Em caso de erro, retornar array vazio para não bloquear
        return [];
      }
    },
    enabled: !!partnerProfile,
    staleTime: 0,
    gcTime: 0,
    retry: 1
  });

  useEffect(() => {
    // Skip if not a partner or still loading
    if (!user || user.role !== 'partner' || loadingProfile || loadingAddresses || loadingServices) {
      console.log('🔍 [PartnerOnboardingGuard] Skipping check:', {
        hasUser: !!user,
        userRole: user?.role,
        loadingProfile,
        loadingAddresses,
        loadingServices
      });
      return;
    }
    
    // Skip if already on onboarding page
    if (location === '/partner-onboarding') {
      console.log('🔍 [PartnerOnboardingGuard] Already on onboarding page');
      return;
    }
    
    // Check if onboarding is complete
    if (partnerProfile) {
      console.log('🔍 [PartnerOnboardingGuard] Partner profile:', partnerProfile);
      console.log('🔍 [PartnerOnboardingGuard] Addresses:', addresses);
      console.log('🔍 [PartnerOnboardingGuard] Services:', services);
      
      // First check if onboardingCompleted flag is set
      if (partnerProfile.onboardingCompleted === true) {
        console.log('✅ [PartnerOnboardingGuard] Partner already completed onboarding (flag=true)');
        return;
      }
      
      // If flag is not set, check if essential data exists
      const isProfileIncomplete = !partnerProfile.businessName || 
                                 !partnerProfile.businessType || 
                                 !partnerProfile.cnpj ||
                                 !partnerProfile.phone;
      
      // Check if has at least one address and one active service
      const hasNoAddresses = !addresses || addresses.length === 0;
      const hasNoActiveServices = !services || !services.some((s: any) => s.isActive);
      
      console.log('🔍 [PartnerOnboardingGuard] Check results:', {
        onboardingCompleted: partnerProfile.onboardingCompleted,
        isProfileIncomplete,
        hasNoAddresses,
        hasNoActiveServices,
        needsOnboarding: !partnerProfile.onboardingCompleted && (isProfileIncomplete || hasNoAddresses || hasNoActiveServices),
        addressesError: addressesError ? String(addressesError) : null,
        servicesError: servicesError ? String(servicesError) : null
      });
      
      if (!partnerProfile.onboardingCompleted && (isProfileIncomplete || hasNoAddresses || hasNoActiveServices)) {
        console.log('❌ [PartnerOnboardingGuard] Redirecting to onboarding');
        navigate('/partner-onboarding');
      } else {
        console.log('✅ [PartnerOnboardingGuard] Onboarding complete, no redirect needed');
      }
    } else {
      console.log('❌ [PartnerOnboardingGuard] No partner profile found');
    }
  }, [user, partnerProfile, addresses, services, loadingProfile, loadingAddresses, loadingServices, location, navigate]);

  // Show loading while checking profile
  if (user && user.role === 'partner' && (loadingProfile || loadingAddresses || loadingServices)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}