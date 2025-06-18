import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  FileText, 
  Mic, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  FileSignature,
  History,
  Bot
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface MedicalRecord {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id?: number;
  recording_id?: number;
  content: {
    type: string;
    data: string;
    transcription?: string;
  };
  status: 'draft' | 'signed' | 'amended';
  ai_generated: boolean;
  signed_at?: string;
  signature_hash?: string;
  created_at: string;
  updated_at: string;
  patient?: {
    full_name: string;
    cpf?: string;
    birth_date?: string;
  };
  appointment?: {
    date: string;
    type: string;
  };
  consultation_recording?: {
    transcription?: string;
    ai_generated_notes?: string;
  };
}

interface MedicalRecordEditorProps {
  recordId?: number;
  appointmentId?: number;
  onSave?: (record: MedicalRecord) => void;
  onSign?: (record: MedicalRecord) => void;
}

export default function MedicalRecordEditor({
  recordId,
  appointmentId,
  onSave,
  onSign
}: MedicalRecordEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');

  // Carregar prontuário
  useEffect(() => {
    if (recordId) {
      loadRecord();
    } else if (appointmentId) {
      checkForExistingRecord();
    }
  }, [recordId, appointmentId]);

  const loadRecord = async (id?: number) => {
    try {
      setLoading(true);
      const recordIdToLoad = id || recordId;
      if (!recordIdToLoad) {
        throw new Error('ID do prontuário não fornecido');
      }
      
      const response = await axios.get(`/api/medical-records-ai/${recordIdToLoad}`);
      const recordData = response.data;
      setRecord(recordData);
      setEditedContent(recordData.content.data);
    } catch (error: any) {
      console.error('Erro ao carregar prontuário:', error);
      toast({
        title: 'Erro ao carregar prontuário',
        description: error.response?.data?.error || 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkForExistingRecord = async () => {
    try {
      setLoading(true);
      console.log('🔍 [MedicalRecordEditor] Verificando prontuário existente para consulta:', appointmentId);
      
      const response = await axios.get(`/api/medical-records-ai/by-appointment/${appointmentId}`);
      
      if (response.data) {
        console.log('✅ [MedicalRecordEditor] Prontuário encontrado:', response.data);
        setRecord(response.data);
        setEditedContent(response.data.content.data);
        setLoading(false);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Se não existir prontuário, verificar se há gravação sendo processada
        console.log('ℹ️ [MedicalRecordEditor] Nenhum prontuário existente, verificando gravação...');
        checkRecordingStatus();
      } else {
        console.error('❌ [MedicalRecordEditor] Erro ao buscar prontuário:', error);
        setLoading(false);
        toast({
          title: 'Erro ao carregar prontuário',
          description: 'Ocorreu um erro ao tentar carregar o prontuário.',
          variant: 'destructive'
        });
      }
    }
  };

  const checkRecordingStatus = async () => {
    let attempts = 0;
    const maxAttempts = 24; // 2 minutos no total (24 * 5 segundos)
    
    const checkStatus = async () => {
      attempts++;
      console.log(`🔄 [MedicalRecordEditor] Verificando status da gravação (tentativa ${attempts}/${maxAttempts})...`);
      
      try {
        // Buscar gravação da consulta
        const recordingResponse = await axios.get(`/api/consultation-recordings/appointment/${appointmentId}`);
        
        if (recordingResponse.data?.recording) {
          const recording = recordingResponse.data.recording;
          console.log('📼 [MedicalRecordEditor] Status da gravação:', recording.status);
          
          if (recording.status === 'completed' && recording.medicalRecordId) {
            console.log('✅ [MedicalRecordEditor] Prontuário gerado pela IA!');
            // Carregar o prontuário gerado
            loadRecord(recording.medicalRecordId);
            return;
          } else if (recording.status === 'error') {
            console.error('❌ [MedicalRecordEditor] Erro no processamento da gravação');
            setLoading(false);
            toast({
              title: 'Erro no processamento',
              description: 'Houve um erro ao processar a gravação. Você pode criar o prontuário manualmente.',
              variant: 'destructive'
            });
            return;
          } else if (recording.status === 'transcribed') {
            console.log('📝 [MedicalRecordEditor] Transcrição concluída, aguardando geração do prontuário...');
          }
        }
        
        // Se ainda não concluiu e não excedeu tentativas, tentar novamente
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          console.log('⏱️ [MedicalRecordEditor] Tempo limite excedido, permitindo criação manual');
          setLoading(false);
          toast({
            title: 'Processamento em andamento',
            description: 'O processamento está demorando mais que o esperado. Você pode criar o prontuário manualmente.',
            variant: 'default'
          });
        }
      } catch (error) {
        console.error('❌ [MedicalRecordEditor] Erro ao verificar status:', error);
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setLoading(false);
        }
      }
    };
    
    checkStatus();
  };

  // Detectar mudanças
  useEffect(() => {
    if (record && editedContent !== record.content.data) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [editedContent, record]);

  // Salvar rascunho
  const handleSave = async () => {
    try {
      setSaving(true);

      const data = {
        appointmentId,
        content: {
          type: 'SOAP',
          data: editedContent,
          transcription: record?.content.transcription
        }
      };

      let response;
      if (record) {
        // Atualizar existente
        response = await axios.put(`/api/medical-records-ai/${record.id}`, data);
      } else {
        // Criar novo
        response = await axios.post('/api/medical-records-ai', data);
      }

      setRecord(response.data);
      setHasChanges(false);
      
      toast({
        title: 'Prontuário salvo',
        description: 'Rascunho salvo com sucesso'
      });

      onSave?.(response.data);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.response?.data?.error || 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Assinar prontuário
  const handleSign = async () => {
    if (!record) return;

    const confirmed = confirm(
      'Ao assinar este prontuário, você confirma que revisou todo o conteúdo e que ele está correto.\n\n' +
      'O prontuário não poderá ser editado após a assinatura.\n\n' +
      'Deseja continuar?'
    );

    if (!confirmed) return;

    try {
      setSigning(true);

      const response = await axios.post(`/api/medical-records-ai/${record.id}/sign`);
      
      setRecord(response.data);
      
      toast({
        title: 'Prontuário assinado',
        description: 'Prontuário assinado digitalmente com sucesso'
      });

      onSign?.(response.data);
    } catch (error: any) {
      console.error('Erro ao assinar:', error);
      toast({
        title: 'Erro ao assinar',
        description: error.response?.data?.error || 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Processando prontuário...</h3>
            <p className="text-muted-foreground max-w-md">
              A gravação da consulta está sendo transcrita e o prontuário está sendo gerado pela IA. 
              Isso pode levar alguns segundos.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Bot className="h-4 w-4" />
              <span>Gerando prontuário com IA</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Prontuário Médico
              </CardTitle>
              {record?.patient && (
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>Paciente: <span className="font-medium text-foreground">{record.patient.full_name}</span></p>
                  {record.appointment && (
                    <p>Consulta: <span className="font-medium text-foreground">
                      {format(new Date(record.appointment.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span></p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {record?.ai_generated && (
                <Badge variant="secondary" className="gap-1">
                  <Bot className="h-3 w-3" />
                  Gerado por IA
                </Badge>
              )}
              {record?.status === 'signed' ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Assinado
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Rascunho
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor" disabled={record?.status === 'signed'}>
            Editor
          </TabsTrigger>
          <TabsTrigger value="transcription">
            Transcrição
          </TabsTrigger>
          <TabsTrigger value="history">
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Editor */}
        <TabsContent value="editor" className="space-y-4">
          {record?.status === 'signed' ? (
            <Alert>
              <FileSignature className="h-4 w-4" />
              <AlertDescription>
                Este prontuário foi assinado em {record.signed_at && format(new Date(record.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} e não pode ser editado.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {record?.ai_generated && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    Este prontuário foi gerado por IA baseado na transcrição da consulta. Revise cuidadosamente antes de assinar.
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardContent className="pt-6">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="Digite o prontuário aqui..."
                    className="min-h-[500px] font-mono text-sm"
                  />
                </CardContent>
              </Card>

              {/* Ações */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {hasChanges && (
                    <span className="text-yellow-600">
                      • Alterações não salvas
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    variant="outline"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Rascunho
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleSign}
                    disabled={signing || hasChanges || !record}
                    variant="default"
                  >
                    {signing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Assinando...
                      </>
                    ) : (
                      <>
                        <FileSignature className="h-4 w-4 mr-2" />
                        Assinar Digitalmente
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Transcrição */}
        <TabsContent value="transcription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Transcrição da Consulta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {record?.content.transcription || record?.consultation_recording?.transcription ? (
                <ScrollArea className="h-[500px] w-full pr-4">
                  <p className="whitespace-pre-wrap text-sm">
                    {record.content.transcription || record.consultation_recording?.transcription}
                  </p>
                </ScrollArea>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma transcrição disponível
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico de Versões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {record && (
                  <>
                    {/* Versão atual */}
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {record.status === 'signed' ? 'Assinado' : 'Rascunho atual'}
                          </p>
                          {record.ai_generated && (
                            <Badge variant="outline" className="text-xs">
                              IA
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(record.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Criação */}
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-muted rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="font-medium">Criado</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(record.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}