import { useCallback, useEffect, useState } from 'react';
import { hapticService } from '@/services/haptic-service';

export interface UseHapticReturn {
  isAvailable: boolean;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  buttonPress: () => Promise<void>;
  submitForm: () => Promise<void>;
  success: () => Promise<void>;
  error: () => Promise<void>;
  warning: () => Promise<void>;
  toggle: () => Promise<void>;
  appointment: () => Promise<void>;
  emergency: () => Promise<void>;
  message: () => Promise<void>;
  photo: () => Promise<void>;
  biometric: () => Promise<void>;
  refresh: () => Promise<void>;
  vibrate: (duration?: number) => Promise<void>;
}

export function useHaptic(): UseHapticReturn {
  const [isEnabled, setIsEnabled] = useState(hapticService.isEnabled());

  const setEnabled = useCallback((enabled: boolean) => {
    hapticService.setEnabled(enabled);
    setIsEnabled(enabled);
    // Salvar preferência no localStorage
    localStorage.setItem('haptic_enabled', String(enabled));
  }, []);

  // Carregar preferência salva
  useEffect(() => {
    const saved = localStorage.getItem('haptic_enabled');
    if (saved !== null) {
      const enabled = saved === 'true';
      hapticService.setEnabled(enabled);
      setIsEnabled(enabled);
    }
  }, []);

  const buttonPress = useCallback(async () => {
    await hapticService.buttonPress();
  }, []);

  const submitForm = useCallback(async () => {
    await hapticService.submitForm();
  }, []);

  const success = useCallback(async () => {
    await hapticService.notification('success');
  }, []);

  const error = useCallback(async () => {
    await hapticService.notification('error');
  }, []);

  const warning = useCallback(async () => {
    await hapticService.notification('warning');
  }, []);

  const toggle = useCallback(async () => {
    await hapticService.toggleSwitch();
  }, []);

  const appointment = useCallback(async () => {
    await hapticService.appointmentBooked();
  }, []);

  const emergency = useCallback(async () => {
    await hapticService.emergencyAlert();
  }, []);

  const message = useCallback(async () => {
    await hapticService.messageReceived();
  }, []);

  const photo = useCallback(async () => {
    await hapticService.photoCapture();
  }, []);

  const biometric = useCallback(async () => {
    await hapticService.biometricSuccess();
  }, []);

  const refresh = useCallback(async () => {
    await hapticService.pullToRefresh();
  }, []);

  const vibrate = useCallback(async (duration?: number) => {
    await hapticService.vibrate(duration);
  }, []);

  return {
    isAvailable: hapticService.isEnabled(),
    isEnabled,
    setEnabled,
    buttonPress,
    submitForm,
    success,
    error,
    warning,
    toggle,
    appointment,
    emergency,
    message,
    photo,
    biometric,
    refresh,
    vibrate
  };
}