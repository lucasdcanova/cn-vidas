import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import MedicalRecordEditor from '@/components/medical-records/MedicalRecordEditor';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';

export default function MedicalRecordEditPage() {
  const [, params] = useRoute('/doctor/medical-records/edit');
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Debug detalhado do location
  console.log('🔍 [MedicalRecordEditPage] Location completo:', location);
  console.log('🔍 [MedicalRecordEditPage] Parte antes do ?:', location.split('?')[0]);
  console.log('🔍 [MedicalRecordEditPage] Parte depois do ?:', location.split('?')[1]);
  
  // Extrair appointmentId da query string
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const appointmentId = searchParams.get('appointmentId');
  const recordId = searchParams.get('recordId');
  
  console.log('🔍 [MedicalRecordEditPage] SearchParams:', Array.from(searchParams.entries()));

  useEffect(() => {
    console.log('🏥 Página de edição de prontuário carregada');
    console.log('🆔 AppointmentId:', appointmentId);
    console.log('🆔 RecordId:', recordId);
    console.log('👤 User:', user);
  }, [appointmentId, recordId, user]);

  const handleSave = (record: any) => {
    console.log('✅ Prontuário salvo:', record);
    toast({
      title: 'Prontuário salvo',
      description: 'O prontuário foi salvo com sucesso.',
    });
  };

  const handleSign = (record: any) => {
    console.log('✍️ Prontuário assinado:', record);
    toast({
      title: 'Prontuário assinado',
      description: 'O prontuário foi assinado digitalmente com sucesso.',
    });
    // Após assinar, voltar para a lista de prontuários
    setTimeout(() => {
      navigate('/doctor/medical-records');
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/doctor/medical-records')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-8 w-8" />
                {recordId ? 'Editar Prontuário' : 'Novo Prontuário'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {appointmentId ? 'Prontuário da consulta finalizada' : 'Edite as informações do prontuário médico'}
              </p>
            </div>
          </div>
        </div>

        {/* Editor de Prontuário */}
        <Card>
          <CardHeader>
            <CardTitle>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando prontuário...
                </div>
              ) : (
                'Editor de Prontuário Médico'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointmentId && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Nota:</strong> Este prontuário está sendo criado a partir da consulta #{appointmentId}.
                  {' '}Se houver gravação disponível, o sistema tentará gerar um rascunho automaticamente usando IA.
                </p>
              </div>
            )}
            
            <MedicalRecordEditor
              recordId={recordId ? parseInt(recordId) : undefined}
              appointmentId={appointmentId ? parseInt(appointmentId) : undefined}
              onSave={handleSave}
              onSign={handleSign}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}