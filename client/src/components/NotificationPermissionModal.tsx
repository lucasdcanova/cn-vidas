import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { PushNotificationService } from '@/services/push-notifications';
import { isNativeApp } from '@/utils/platform';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPermissionModal({ isOpen, onClose }: NotificationPermissionModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      await PushNotificationService.initialize();
      onClose();
    } catch (error) {
      console.error('Erro ao habilitar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Salvar preferência para não mostrar novamente por um tempo
    localStorage.setItem('notificationPermissionSkipped', Date.now().toString());
    onClose();
  };

  // Só mostrar em apps nativos
  if (!isNativeApp()) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Bell className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center">
            Ative as Notificações
          </DialogTitle>
          <DialogDescription className="text-center">
            Receba lembretes de consultas, avisos de emergência e atualizações importantes sobre sua saúde.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Lembretes de Consultas</p>
              <p className="text-xs text-muted-foreground">
                Nunca perca uma consulta agendada
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Consultas de Emergência</p>
              <p className="text-xs text-muted-foreground">
                Seja notificado quando um médico aceitar sua emergência
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Resultados e Prescrições</p>
              <p className="text-xs text-muted-foreground">
                Receba avisos quando novos documentos estiverem disponíveis
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col space-y-2">
          <Button 
            onClick={handleEnableNotifications} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Habilitando...' : 'Ativar Notificações'}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="w-full"
            disabled={isLoading}
          >
            Agora não
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground mt-2">
          Você pode alterar isso a qualquer momento nas configurações
        </p>
      </DialogContent>
    </Dialog>
  );
}