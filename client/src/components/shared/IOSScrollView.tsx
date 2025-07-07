import React from 'react';
import { cn } from '@/lib/utils';
import { isIOS } from '@/utils/platform';

interface IOSScrollViewProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  showsVerticalScrollIndicator?: boolean;
  bounces?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

export function IOSScrollView({
  children,
  className,
  contentClassName,
  showsVerticalScrollIndicator = false,
  bounces = true,
  keyboardShouldPersistTaps = 'handled'
}: IOSScrollViewProps) {
  // Para iOS, aplicamos estilos específicos de scroll
  const scrollStyles = isIOS() ? {
    WebkitOverflowScrolling: 'touch' as any,
    overscrollBehavior: 'contain'
  } : {};

  return (
    <div 
      className={cn(
        "flex flex-col h-full w-full",
        // Safe areas para iOS
        isIOS() && "safe-top safe-bottom",
        className
      )}
    >
      <div 
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          // Padding para safe areas no iOS
          isIOS() && "pb-safe pt-safe",
          contentClassName
        )}
        style={{
          ...scrollStyles,
          // Esconder scrollbar no iOS se configurado
          ...(isIOS() && !showsVerticalScrollIndicator ? {
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitScrollbar: { display: 'none' }
          } : {})
        }}
        // Permitir scroll com toque
        onTouchStart={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}