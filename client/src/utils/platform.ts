import { Capacitor } from '@capacitor/core';

/**
 * Detecta se está rodando como app nativo (iOS/Android)
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Detecta se está rodando no iOS
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Detecta se está rodando no Android
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Detecta se está rodando na web (PWA)
 */
export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Retorna a plataforma atual
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};