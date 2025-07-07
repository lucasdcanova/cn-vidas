import React from 'react';
import { cn } from '@/lib/utils';
import { IOSScrollView } from './IOSScrollView';
import { IOSKeyboardAvoidingView } from './IOSKeyboardAvoidingView';
import { isIOS } from '@/utils/platform';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function OnboardingLayout({
  children,
  className,
  contentClassName
}: OnboardingLayoutProps) {
  // Para web, usa layout padrão
  if (!isIOS()) {
    return (
      <div className={cn("min-h-screen", className)}>
        <div className={cn("h-full overflow-y-auto", contentClassName)}>
          {children}
        </div>
      </div>
    );
  }

  // Para iOS, usa componentes otimizados
  return (
    <IOSKeyboardAvoidingView className={cn("min-h-screen", className)}>
      <IOSScrollView 
        className="flex-1"
        contentClassName={contentClassName}
        bounces={true}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </IOSScrollView>
    </IOSKeyboardAvoidingView>
  );
}