import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cnvidas.app',
  appName: 'CN Vidas',
  webDir: 'dist/client',
  version: '1.0.0',
  server: {
    // Configuração para carregar o app do servidor remoto
    url: 'https://cnvidas.onrender.com',
    cleartext: true,
    allowNavigation: ['https://cnvidas.onrender.com']
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
  ios: {
    // Configurações específicas do iOS
    contentInset: 'never',
    backgroundColor: '#eff6ff',
    limitsNavigationsToAppBoundDomains: false,
    allowsLinkPreview: false
  }
};

export default config;
