import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoRefreshIndicatorProps {
  isRefreshing?: boolean;
  interval?: number;
  className?: string;
}

export function AutoRefreshIndicator({ 
  isRefreshing = false, 
  interval = 5000,
  className 
}: AutoRefreshIndicatorProps) {
  const [pulseCount, setPulseCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pulse animation every interval
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-40",
      "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "border rounded-lg shadow-lg p-3",
      "transition-all duration-300",
      className
    )}>
      <div className="flex items-center gap-3">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          <span className={cn(
            "text-xs font-medium",
            isOnline ? "text-green-600" : "text-red-600"
          )}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* Auto-refresh Status */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <RefreshCw 
              className={cn(
                "h-4 w-4 text-primary transition-transform duration-1000",
                isRefreshing && "animate-spin"
              )}
              key={pulseCount} // Force re-render for pulse effect
            />
            {/* Pulse effect */}
            <div 
              className={cn(
                "absolute inset-0 rounded-full bg-primary/20",
                "animate-ping"
              )}
              key={`pulse-${pulseCount}`}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            Atualização automática
          </span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "h-2 w-2 rounded-full",
            isOnline ? "bg-green-500" : "bg-red-500",
            isOnline && "animate-pulse"
          )} />
          <span className="text-xs text-muted-foreground">
            {isRefreshing ? 'Atualizando...' : 'Ativo'}
          </span>
        </div>
      </div>

      {/* Info tooltip on hover */}
      <div className="mt-2 text-xs text-muted-foreground opacity-0 hover:opacity-100 transition-opacity">
        <p>A página atualiza automaticamente a cada {interval / 1000} segundos.</p>
        <p>Novas consultas aparecerão instantaneamente.</p>
      </div>
    </div>
  );
}