import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { isIOS } from '@/utils/platform';
import { Keyboard } from '@capacitor/keyboard';

interface IOSKeyboardAvoidingViewProps {
  children: React.ReactNode;
  className?: string;
  offset?: number;
}

export function IOSKeyboardAvoidingView({
  children,
  className,
  offset = 0
}: IOSKeyboardAvoidingViewProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!isIOS()) return;

    const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
      setKeyboardHeight(info.keyboardHeight);
      setIsKeyboardVisible(true);
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const containerStyle = isIOS() && isKeyboardVisible ? {
    paddingBottom: `${keyboardHeight + offset}px`,
    transition: 'padding-bottom 0.25s ease-in-out'
  } : {};

  return (
    <div 
      className={cn("relative w-full h-full", className)}
      style={containerStyle}
    >
      {children}
    </div>
  );
}