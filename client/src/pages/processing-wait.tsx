import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { httpRequest } from '@/lib/http-client';

export function ProcessingWaitPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  
  const [status, setStatus] = useState<string>('checking');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  
  useEffect(() => {
    if (!appointmentId) {
      navigate('/');
      return;
    }
    
    checkStatus();
  }, [appointmentId]);
  
  const checkStatus = async () => {
    try {
      const response = await httpRequest(`/api/consultation-recordings/status/${appointmentId}`);
      
      console.log('📊 Status da gravação:', response);
      
      if (response.status === 'not_found') {
        setStatus('waiting');
        setProgress(10);
      } else if (response.status === 'pending') {
        setStatus('waiting');
        setProgress(25);
      } else if (response.status === 'processing') {
        setStatus('processing');
        setProgress(50);
      } else if (response.status === 'completed' && response.hasMedicalRecord) {
        setStatus('completed');
        setProgress(100);
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate(`/doctor/medical-records/edit?appointmentId=${appointmentId}`);
        }, 2000);
        return;
      } else if (response.status === 'failed') {
        setStatus('error');
        setError(response.error || 'Erro no processamento');
        return;
      }
      
      // Continuar verificando
      setAttempts(prev => prev + 1);
      
      // Máximo de 30 tentativas (2,5 minutos)
      if (attempts < 30) {
        setTimeout(checkStatus, 5000); // Verificar a cada 5 segundos
      } else {
        setStatus('timeout');
        setError('O processamento está demorando mais que o esperado');
      }
      
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setStatus('error');
      setError('Erro ao verificar status do processamento');
    }
  };
  
  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return 'Verificando gravação...';
      case 'waiting':
        return 'Aguardando processamento iniciar...';
      case 'processing':
        return 'Processando gravação e gerando prontuário...';
      case 'completed':
        return 'Prontuário gerado com sucesso!';
      case 'error':
        return 'Erro no processamento';
      case 'timeout':
        return 'Processamento demorado';
      default:
        return 'Processando...';
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
      case 'timeout':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-2xl mt-20">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6">
            {getStatusIcon()}
            
            <h2 className="text-2xl font-semibold text-center">
              {getStatusMessage()}
            </h2>
            
            {status !== 'error' && status !== 'timeout' && status !== 'completed' && (
              <>
                <p className="text-muted-foreground text-center">
                  A inteligência artificial está analisando a gravação da consulta e gerando o prontuário médico.
                  Este processo pode levar alguns segundos.
                </p>
                
                <Progress value={progress} className="w-full max-w-xs" />
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Tempo estimado: 30-60 segundos</span>
                </div>
              </>
            )}
            
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg w-full">
                <p className="font-medium">Erro no processamento:</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
            
            {(status === 'error' || status === 'timeout') && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/doctor/medical-records/edit?appointmentId=${appointmentId}`)}
                >
                  Criar prontuário manualmente
                </Button>
                <Button
                  onClick={() => {
                    setStatus('checking');
                    setError(null);
                    setAttempts(0);
                    checkStatus();
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}