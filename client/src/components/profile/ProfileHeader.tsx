import React from 'react';
import { cn } from '@/lib/utils';
import ProfilePhotoSection from './ProfilePhotoSection';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Building2, Stethoscope, User } from 'lucide-react';

interface ProfileHeaderProps {
  userName: string;
  userEmail: string;
  userRole: 'patient' | 'doctor' | 'partner' | 'admin';
  profileImage?: string | null;
  verified?: boolean;
  specialty?: string;
  businessName?: string;
  subscriptionPlan?: string;
  onImageUpdate?: (imageUrl: string | null) => void;
  className?: string;
}

export default function ProfileHeader({
  userName,
  userEmail,
  userRole,
  profileImage,
  verified = false,
  specialty,
  businessName,
  subscriptionPlan,
  onImageUpdate,
  className
}: ProfileHeaderProps) {
  const getRoleDisplay = () => {
    switch (userRole) {
      case 'doctor':
        return { icon: Stethoscope, label: 'Médico', color: 'text-blue-600' };
      case 'partner':
        return { icon: Building2, label: 'Parceiro', color: 'text-purple-600' };
      case 'admin':
        return { icon: User, label: 'Administrador', color: 'text-red-600' };
      default:
        return { icon: User, label: 'Paciente', color: 'text-green-600' };
    }
  };

  const roleInfo = getRoleDisplay();
  const RoleIcon = roleInfo.icon;

  const getPlanBadgeColor = (plan?: string) => {
    if (!plan) return 'secondary';
    if (plan.includes('premium') || plan.includes('ultra')) return 'default';
    if (plan.includes('standard') || plan.includes('plus')) return 'secondary';
    return 'outline';
  };

  const getPlanDisplayName = (plan?: string) => {
    if (!plan) return '';
    const planMap: Record<string, string> = {
      'basic': 'Básico',
      'standard': 'Padrão',
      'premium': 'Premium',
      'family_basic': 'Familiar Básico',
      'family_plus': 'Familiar Plus',
      'ultra_family': 'Ultra Familiar',
      'medical': 'Plano Médico'
    };
    return planMap[plan] || plan;
  };

  return (
    <div className={cn("relative", className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-t-2xl" />
      
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10 rounded-t-2xl" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      <div className="relative z-10 px-8 pt-12 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Foto de perfil */}
            <div className="relative -mb-20 md:-mb-16">
              <ProfilePhotoSection
                currentImage={profileImage}
                userName={userName}
                userType={userRole}
                onImageUpdate={onImageUpdate}
                size="xl"
              />
            </div>
            
            {/* Informações do usuário */}
            <div className="flex-1 text-center md:text-left mb-4">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {businessName || userName}
                </h1>
                {verified && (
                  <CheckCircle2 className="w-6 h-6 text-blue-200" />
                )}
              </div>
              
              <p className="text-blue-100 text-lg mb-3">{userEmail}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {/* Badge do tipo de usuário */}
                <Badge 
                  variant="secondary" 
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                >
                  <RoleIcon className="w-4 h-4 mr-1.5" />
                  {roleInfo.label}
                </Badge>
                
                {/* Especialidade (médicos) */}
                {userRole === 'doctor' && specialty && (
                  <Badge 
                    variant="secondary"
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                  >
                    {specialty}
                  </Badge>
                )}
                
                {/* Plano (pacientes) */}
                {userRole === 'patient' && subscriptionPlan && (
                  <Badge 
                    variant={getPlanBadgeColor(subscriptionPlan)}
                    className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                  >
                    {getPlanDisplayName(subscriptionPlan)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}