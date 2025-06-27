import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
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

  // Pulse animation every interval
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount(prev => prev + 1);
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return (
    <div className={cn(
      "inline-flex items-center gap-2",
      className
    )}>
      <div className="relative">
        <RefreshCw 
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-1000",
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
  );
}