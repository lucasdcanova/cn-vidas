import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export const configureIOSStatusBar = async (backgroundColor: string = '#eff6ff') => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    try {
      // Define o estilo do status bar (texto ESCURO em fundo claro)
      // Style.Dark = texto escuro em fundo claro
      // Style.Light = texto claro em fundo escuro
      await StatusBar.setStyle({ style: Style.Dark });
      
      // Define a cor de fundo do status bar
      await StatusBar.setBackgroundColor({ color: backgroundColor });
      
      // Garante que o status bar não sobreponha o conteúdo
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (error) {
      console.error('Erro ao configurar status bar iOS:', error);
    }
  }
};