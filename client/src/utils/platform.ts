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
 * Detecta se está rodando no iPadOS
 */
export const isIPad = (): boolean => {
  if (Capacitor.getPlatform() === 'ios') {
    // No Capacitor iOS, verificar se é iPad
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('ipad') || 
           (userAgent.includes('macintosh') && 'ontouchend' in document);
  }
  
  // Para web, verificar user agent
  if (Capacitor.getPlatform() === 'web') {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('ipad') || 
           (userAgent.includes('macintosh') && 'ontouchend' in document);
  }
  
  return false;
};

/**
 * Detecta se está rodando em um tablet (iPad ou Android tablet)
 */
export const isTablet = (): boolean => {
  if (isIPad()) return true;
  
  // Para Android, verificar tamanho da tela
  if (isAndroid()) {
    // Considerar tablets se a largura for maior que 768px
    return window.innerWidth >= 768;
  }
  
  return false;
};

/**
 * Retorna a plataforma atual
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};