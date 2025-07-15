import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cnvidas.app',
  appName: 'CN Vidas',
  webDir: 'dist/client',
  version: '1.0.0',
  server: {
    // Carregar arquivos localmente, não do servidor remoto
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    StatusBar: {
      visible: true,
      style: "LIGHT",
      backgroundColor: "#eff6ff",
      overlaysWebView: false
    }
  },
  ios: {
    // Configurações específicas do iOS
    contentInset: 'never',
    backgroundColor: '#eff6ff',
    limitsNavigationsToAppBoundDomains: false,
    allowsLinkPreview: false
  },
  android: {
    // Configurações específicas do Android
    backgroundColor: '#eff6ff',
    buildToolsVersion: '34.0.0',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
