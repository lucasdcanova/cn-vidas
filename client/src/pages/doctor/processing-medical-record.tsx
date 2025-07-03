import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { httpRequest } from '@/lib/http-client';
import { toast } from '@/hooks/use-toast';

export default function ProcessingMedicalRecordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appointmentId = searchParams.get('appointmentId');
  
  const [status, setStatus] = useState<'processing' | 'completed' | 'error'>('processing');
  const [attempts, setAttempts] = useState(0);
  const [currentStep, setCurrentStep] = useState<'recording' | 'transcribing' | 'generating' | 'ready'>('recording');

  useEffect(() => {
    if (!appointmentId) {
      navigate('/doctor/dashboard');
      return;
    }

    checkMedicalRecordStatus();
  }, [appointmentId]);

  const checkMedicalRecordStatus = async () => {
    const maxAttempts = 60; // 5 minutos (60 * 5 segundos)
    let currentAttempts = 0;

    const checkStatus = async () => {
      currentAttempts++;
      setAttempts(currentAttempts);
      
      try {
        // Verificar se o prontuário já existe
        const recordResponse = await httpRequest(`/api/medical-records-ai/by-appointment/${appointmentId}`, {
          method: 'GET'
        });
        
        if (recordResponse.data) {
          console.log('✅ Prontuário pronto!');
          setStatus('completed');
          setCurrentStep('ready');
          
          // Aguardar 1 segundo para mostrar sucesso, depois redirecionar
          setTimeout(() => {
            navigate(`/doctor/medical-records/edit?appointmentId=${appointmentId}`);
          }, 1000);
          return;
        }
      } catch (err) {
        // Prontuário ainda não existe, verificar status da gravação
        try {
          const recordingResponse = await httpRequest(`/api/consultation-recordings/appointment/${appointmentId}`, {
            method: 'GET'
          });
          
          if (recordingResponse.data?.recording) {
            const recording = recordingResponse.data.recording;
            
            // Atualizar o passo atual baseado no status
            if (recording.cloudRecordingStatus === 'completed' && recording.transcriptionStatus === 'pending') {
              setCurrentStep('transcribing');
            } else if (recording.transcriptionStatus === 'completed' && recording.aiProcessingStatus === 'pending') {
              setCurrentStep('generating');
            } else if (recording.aiProcessingStatus === 'error') {
              setStatus('error');
              toast({
                title: 'Erro no processamento',
                description: 'Houve um erro ao processar a gravação. Você será redirecionado para criar o prontuário manualmente.',
                variant: 'destructive'
              });
              
              setTimeout(() => {
                navigate(`/doctor/medical-records/edit?appointmentId=${appointmentId}`);
              }, 3000);
              return;
            }
          }
        } catch (recordingErr) {
          console.log('Gravação ainda não iniciada');
        }
      }

      // Continuar verificando
      if (currentAttempts < maxAttempts) {
        setTimeout(checkStatus, 5000); // Verificar a cada 5 segundos
      } else {
        // Tempo esgotado
        setStatus('error');
        toast({
          title: 'Processamento demorado',
          description: 'O processamento está demorando mais que o esperado. Você será redirecionado para criar o prontuário manualmente.',
          variant: 'destructive'
        });
        
        setTimeout(() => {
          navigate(`/doctor/medical-records/edit?appointmentId=${appointmentId}`);
        }, 3000);
      }
    };

    checkStatus();
  };

  const steps = [
    {
      id: 'recording',
      title: 'Processando gravação',
      description: 'A gravação da consulta está sendo processada'
    },
    {
      id: 'transcribing',
      title: 'Transcrevendo áudio',
      description: 'Convertendo o áudio da consulta em texto'
    },
    {
      id: 'generating',
      title: 'Gerando prontuário',
      description: 'IA analisando e criando o prontuário SOAP'
    },
    {
      id: 'ready',
      title: 'Prontuário pronto',
      description: 'O prontuário foi gerado com sucesso'
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-8 pb-8">
          <div className="space-y-8">
            {/* Cabeçalho */}
            <div className="text-center space-y-2">
              {status === 'processing' && (
                <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              )}
              {status === 'completed' && (
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              )}
              {status === 'error' && (
                <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
              )}
              
              <h1 className="text-2xl font-bold">
                {status === 'processing' && 'Preparando prontuário médico'}
                {status === 'completed' && 'Prontuário pronto!'}
                {status === 'error' && 'Erro no processamento'}
              </h1>
              
              <p className="text-muted-foreground max-w-md mx-auto">
                {status === 'processing' && 'Aguarde enquanto processamos a gravação e geramos o prontuário com inteligência artificial.'}
                {status === 'completed' && 'O prontuário foi gerado com sucesso. Redirecionando...'}
                {status === 'error' && 'Houve um problema ao processar a gravação. Você poderá criar o prontuário manualmente.'}
              </p>
            </div>

            {/* Steps do processo */}
            {status === 'processing' && (
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const stepIndex = steps.findIndex(s => s.id === currentStep);
                  const isCompleted = index < stepIndex;
                  const isCurrent = step.id === currentStep;
                  
                  return (
                    <div key={step.id} className="flex items-start gap-4">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                        ${isCompleted || isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                      `}>
                        {isCompleted ? <CheckCircle className="h-5 w-5" /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isCurrent ? '' : 'text-muted-foreground'}`}>
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tempo decorrido */}
            {status === 'processing' && attempts > 0 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Tempo decorrido: {Math.floor(attempts * 5 / 60)}:{String((attempts * 5) % 60).padStart(2, '0')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}