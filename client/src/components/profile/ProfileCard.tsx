import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ProfileCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export default function ProfileCard({
  title,
  description,
  icon: Icon,
  children,
  className,
  action
}: ProfileCardProps) {
  return (
    <Card className={cn(
      "backdrop-blur-sm bg-white/95 border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300",
      className
    )}>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            {Icon && (
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {description && (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>
          </div>
          {action && (
            <div className="ml-4">{action}</div>
          )}
        </div>
        
        {/* Content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </Card>
  );
}