import React from 'react';
import { Button, ButtonProps } from './button';
import { CNVidasLoader } from './cnvidas-loader';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({ 
  loading = false,
  loadingText,
  children,
  disabled,
  ...props 
}) => {
  return (
    <Button 
      disabled={disabled || loading} 
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <CNVidasLoader size="small" />
          {loadingText && <span>{loadingText}</span>}
        </div>
      ) : (
        children
      )}
    </Button>
  );
};