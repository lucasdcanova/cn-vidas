import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cnvidas.app',
  appName: 'CN Vidas',
  webDir: 'dist/client',
  version: '1.0.0',
  server: {
    // Para desenvolvimento, apontar para o servidor local
    // Remover ou comentar para produção
    // url: 'http://localhost:5173',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
  ios: {
    // Configurações específicas do iOS
    contentInset: 'never',
    backgroundColor: '#eff6ff'
  }
};

export default config;
