import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

/**
 * Configura o status bar do iOS
 * @param backgroundColor - Cor de fundo da status bar (hex)
 * @param darkText - Se true, usa texto escuro (para fundos claros). Se false, usa texto claro (para fundos escuros)
 */
export const configureIOSStatusBar = async (backgroundColor: string = '#eff6ff', darkText: boolean = true) => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    try {
      // Garantir que o StatusBar esteja visível
      await StatusBar.show();

      // Define o estilo do status bar
      // Style.Light = texto escuro em fundo claro (iOS nomenclatura)
      // Style.Dark = texto claro em fundo escuro
      await StatusBar.setStyle({ style: darkText ? Style.Light : Style.Dark });

      // Define a cor de fundo do status bar
      await StatusBar.setBackgroundColor({ color: backgroundColor });

      // Garante que o status bar não sobreponha o conteúdo
      await StatusBar.setOverlaysWebView({ overlay: false });

      console.log('✅ StatusBar iOS configurado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao configurar status bar iOS:', error);
    }
  }
};