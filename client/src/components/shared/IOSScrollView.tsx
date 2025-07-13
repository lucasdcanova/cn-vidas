import React, { forwardRef } from 'react';
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

export const IOSScrollView = forwardRef<HTMLDivElement, IOSScrollViewProps>(({
  children,
  className,
  contentClassName,
  showsVerticalScrollIndicator = false,
  bounces = true,
  keyboardShouldPersistTaps = 'handled'
}, ref) => {
  // Para iOS, aplicamos estilos específicos de scroll
  const scrollStyles = isIOS() ? {
    WebkitOverflowScrolling: 'touch' as any,
    overscrollBehavior: 'contain',
    // Forçar hardware acceleration
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as any
  } : {};

  return (
    <div 
      ref={ref}
      className={cn(
        "relative w-full h-full overflow-hidden",
        // Safe areas para iOS
        isIOS() && "safe-top safe-bottom",
        className
      )}
    >
      <div 
        className={cn(
          "absolute inset-0 overflow-y-auto overflow-x-hidden ios-scroll-view-content",
          // Padding para safe areas no iOS
          isIOS() && "pb-safe pt-safe",
          // Adicionar momentum scrolling no iOS
          isIOS() && "overflow-y-scroll",
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
});

IOSScrollView.displayName = 'IOSScrollView';