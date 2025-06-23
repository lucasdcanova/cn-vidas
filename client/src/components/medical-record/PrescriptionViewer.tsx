import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, Download, Pill, Calendar, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';

interface Medication {
  medicamento: string;
  dosagem: string;
  posologia: string;
  duracao: string;
  orientacoes?: string;
}

interface PrescriptionData {
  appointmentId: number;
  date: string;
  doctor: {
    name: string;
    crm: string;
    specialization: string;
  };
  patient: {
    name: string;
    cpf: string;
    birthDate?: string;
  };
  medications: Medication[];
  notes?: string;
}

interface PrescriptionViewerProps {
  appointmentId: number;
  className?: string;
}

export function PrescriptionViewer({ appointmentId, className }: PrescriptionViewerProps) {
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescription();
  }, [appointmentId]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/prescriptions/appointment/${appointmentId}`, {
        withCredentials: true
      });
      
      setPrescription(response.data);
    } catch (err: any) {
      console.error('Erro ao buscar receita:', err);
      setError(err.response?.data?.error || 'Erro ao carregar receita médica');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.open(`/api/prescriptions/appointment/${appointmentId}/formatted`, '_blank');
  };

  const handleDownloadPDF = async () => {
    try {
      // Abrir versão formatada em nova aba para o usuário salvar como PDF
      window.open(`/api/prescriptions/appointment/${appointmentId}/formatted`, '_blank');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Carregando receita médica...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !prescription) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            {error || 'Nenhuma receita médica disponível para esta consulta'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <CardTitle>Receita Médica</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Informações da consulta */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(prescription.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
          <Badge variant="secondary">
            Consulta #{prescription.appointmentId}
          </Badge>
        </div>

        {/* Informações do médico */}
        <div className="border-b pb-4">
          <h3 className="font-semibold mb-2">Médico Responsável</h3>
          <p className="text-sm">{prescription.doctor.name}</p>
          <p className="text-sm text-muted-foreground">
            {prescription.doctor.specialization} - CRM: {prescription.doctor.crm}
          </p>
        </div>

        {/* Informações do paciente */}
        <div className="border-b pb-4">
          <h3 className="font-semibold mb-2">Paciente</h3>
          <p className="text-sm">{prescription.patient.name}</p>
          {prescription.patient.cpf && (
            <p className="text-sm text-muted-foreground">CPF: {prescription.patient.cpf}</p>
          )}
        </div>

        {/* Medicamentos prescritos */}
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Medicamentos Prescritos
          </h3>
          
          <div className="space-y-4">
            {prescription.medications.map((medication, index) => (
              <Card key={index} className="p-4">
                <h4 className="font-medium text-lg mb-2">
                  {index + 1}. {medication.medicamento}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Dosagem:</span> {medication.dosagem}
                  </div>
                  <div>
                    <span className="font-medium">Posologia:</span> {medication.posologia}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">Duração:</span> {medication.duracao}
                  </div>
                </div>
                
                {medication.orientacoes && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                    <span className="font-medium">Orientações:</span> {medication.orientacoes}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Observações */}
        {prescription.notes && (
          <div className="mt-4 p-4 bg-muted/30 rounded">
            <h4 className="font-medium mb-2">Observações</h4>
            <p className="text-sm">{prescription.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}