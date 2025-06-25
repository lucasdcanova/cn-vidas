import { AssetConfig } from '@capacitor/assets';

const config: AssetConfig = {
  iconBackgroundColor: '#ffffff',
  iconBackgroundColorDark: '#ffffff',
  splashBackgroundColor: '#ffffff',
  splashBackgroundColorDark: '#ffffff',
  logoSplashScale: 0.4,
  ios: {
    // Ícone principal
    icon: './ios-assets/AppIcon-1024x1024.png',
    
    // Splash screen
    splash: './ios-assets/Splash-2732x2732.png',
    
    // Configurações específicas do iOS
    splashScreenDelay: 3000,
    splashScreenShowSpinner: false,
    splashScreenSpinnerColor: '#c7144c',
  },
  android: {
    // Por enquanto vamos usar os mesmos assets
    icon: './ios-assets/AppIcon-1024x1024.png',
    splash: './ios-assets/Splash-2732x2732.png',
  }
};

export default config;