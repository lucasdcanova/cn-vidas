import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Printer, 
  Download,
  Calendar,
  Pill,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Medication {
  nome: string;
  dosagem: string;
  via: string;
  frequencia: string;
  duracao: string;
  quantidade: string;
  instrucoes?: string;
}

interface Prescription {
  medicamentos: Medication[];
  observacoes?: string;
}

interface PrescriptionDisplayProps {
  prescription: Prescription;
  patientName?: string;
  patientCpf?: string;
  doctorName?: string;
  doctorCrm?: string;
  consultationDate?: string;
  isSigned?: boolean;
  signedAt?: string;
  onPrint?: () => void;
  onDownload?: () => void;
}

export default function PrescriptionDisplay({
  prescription,
  patientName,
  patientCpf,
  doctorName,
  doctorCrm,
  consultationDate,
  isSigned,
  signedAt,
  onPrint,
  onDownload
}: PrescriptionDisplayProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6" id="prescription-display">
      {/* Header com informações do paciente e médico */}
      <Card className="print:shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Receituário Médico</CardTitle>
              {consultationDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  {format(new Date(consultationDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Imprimir
              </Button>
              {onDownload && (
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Baixar PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {patientName && (
              <div>
                <span className="text-muted-foreground">Paciente:</span>
                <p className="font-medium">{patientName}</p>
                {patientCpf && <p className="text-xs text-muted-foreground">CPF: {patientCpf}</p>}
              </div>
            )}
            {doctorName && (
              <div className="text-right">
                <span className="text-muted-foreground">Médico(a):</span>
                <p className="font-medium">{doctorName}</p>
                {doctorCrm && <p className="text-xs text-muted-foreground">CRM: {doctorCrm}</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Medicamentos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Pill className="h-5 w-5" />
          Medicamentos Prescritos
        </h3>
        
        {prescription.medicamentos.map((med, index) => (
          <Card key={index} className="print:break-inside-avoid">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="text-lg font-semibold">{med.nome}</h4>
                  <Badge variant="outline">{med.dosagem}</Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Via de Administração</p>
                    <p className="font-medium">{med.via}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Frequência</p>
                    <p className="font-medium">{med.frequencia}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Duração</p>
                    <p className="font-medium">{med.duracao}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Quantidade Total</p>
                    <p className="font-medium">{med.quantidade}</p>
                  </div>
                </div>

                {med.instrucoes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Instruções especiais:</p>
                    <p className="text-sm font-medium">{med.instrucoes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Observações Gerais */}
      {prescription.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Observações Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{prescription.observacoes}</p>
          </CardContent>
        </Card>
      )}

      {/* Assinatura Digital */}
      {isSigned && signedAt && (
        <div className="border-t pt-6 mt-8">
          <div className="text-center space-y-2">
            <Separator className="mb-4" />
            <p className="text-sm text-muted-foreground">
              Documento assinado digitalmente em{' '}
              {format(new Date(signedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            {doctorName && doctorCrm && (
              <div>
                <p className="font-medium">{doctorName}</p>
                <p className="text-sm text-muted-foreground">CRM: {doctorCrm}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estilos de impressão */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #prescription-display, #prescription-display * {
            visibility: visible;
          }
          #prescription-display {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}