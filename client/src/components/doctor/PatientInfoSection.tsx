import { Mail, Phone, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PatientInfoSectionProps {
  patientEmail?: string;
  patientPhone?: string;
  patientBirthDate?: string;
  patientCpf?: string;
  patientAge?: number | null;
  className?: string;
}

export function PatientInfoSection({
  patientEmail,
  patientPhone,
  patientBirthDate,
  patientCpf,
  patientAge,
  className
}: PatientInfoSectionProps) {
  // Formatar CPF para exibição
  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  };

  // Formatar telefone para exibição
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-2 mt-3", className)}>
      {patientEmail && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span className="truncate">{patientEmail}</span>
        </div>
      )}
      
      {patientPhone && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" />
          <span>{formatPhone(patientPhone)}</span>
        </div>
      )}
      
      {patientBirthDate && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {format(new Date(patientBirthDate), "dd/MM/yyyy", { locale: ptBR })}
            {patientAge && ` (${patientAge} anos)`}
          </span>
        </div>
      )}
      
      {patientCpf && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CreditCard className="h-3 w-3" />
          <span>CPF: {formatCPF(patientCpf)}</span>
        </div>
      )}
    </div>
  );
}