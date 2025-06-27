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
  // Componente vazio - não renderiza nada
  return null;
}