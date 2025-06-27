import React from 'react';
import { cn } from '@/lib/utils';
import { 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LucideIcon } from 'lucide-react';

interface ProfileFormFieldProps {
  control: any;
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  type?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
}

export default function ProfileFormField({
  control,
  name,
  label,
  placeholder,
  description,
  type = 'text',
  icon: Icon,
  disabled = false,
  readOnly = false,
  multiline = false,
  rows = 3,
  className
}: ProfileFormFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-gray-500" />}
            {label}
          </FormLabel>
          <FormControl>
            <div className="relative">
              {multiline ? (
                <Textarea
                  placeholder={placeholder}
                  disabled={disabled}
                  readOnly={readOnly}
                  rows={rows}
                  className={cn(
                    "resize-none transition-all duration-200",
                    "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    readOnly && "bg-gray-50 cursor-not-allowed"
                  )}
                  {...field}
                />
              ) : (
                <Input
                  type={type}
                  placeholder={placeholder}
                  disabled={disabled}
                  readOnly={readOnly}
                  className={cn(
                    "transition-all duration-200",
                    "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    readOnly && "bg-gray-50 cursor-not-allowed"
                  )}
                  {...field}
                />
              )}
            </div>
          </FormControl>
          {description && (
            <FormDescription className="text-xs text-gray-500 mt-1.5">
              {description}
            </FormDescription>
          )}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}