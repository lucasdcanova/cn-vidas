import { useState, useEffect, useCallback } from 'react';
import { localNotifications, AppointmentNotification } from '@/services/local-notifications';
import { useToast } from '@/hooks/use-toast';

export interface UseLocalNotificationsReturn {
  isAvailable: boolean;
  hasPermission: boolean;
  scheduleAppointmentReminders: (notification: AppointmentNotification) => Promise<void>;
  cancelAppointmentReminders: (appointmentId: number) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

export function useLocalNotifications(): UseLocalNotificationsReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initNotifications = async () => {
      await localNotifications.initialize();
      await localNotifications.createNotificationChannel();
      
      const permission = await localNotifications.checkPermissions();
      setHasPermission(permission);
      setIsAvailable(true);
    };

    initNotifications();
  }, []);

  const scheduleAppointmentReminders = useCallback(async (notification: AppointmentNotification) => {
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        return;
      }
    }

    try {
      await localNotifications.scheduleAppointmentReminders(notification);
      
      if (notification.userType === 'patient') {
        toast({
          title: 'Lembretes agendados',
          description: 'Você receberá lembretes 1 dia e 1 hora antes da consulta',
        });
      }
    } catch (error) {
      console.error('Erro ao agendar lembretes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível agendar os lembretes',
        variant: 'destructive'
      });
    }
  }, [hasPermission, toast]);

  const cancelAppointmentReminders = useCallback(async (appointmentId: number) => {
    try {
      await localNotifications.cancelAppointmentReminders(appointmentId);
    } catch (error) {
      console.error('Erro ao cancelar lembretes:', error);
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      await localNotifications.initialize();
      const permission = await localNotifications.checkPermissions();
      setHasPermission(permission);
      
      if (!permission) {
        toast({
          title: 'Permissão necessária',
          description: 'Habilite as notificações para receber lembretes de consultas',
          variant: 'destructive'
        });
      }
      
      return permission;
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return false;
    }
  }, [toast]);

  return {
    isAvailable,
    hasPermission,
    scheduleAppointmentReminders,
    cancelAppointmentReminders,
    requestPermissions
  };
}