import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

/**
 * Configuração global do StatusBar para iOS
 */
export class StatusBarConfig {
  /**
   * Inicializa o StatusBar com configurações padrão
   */
  static async initialize() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Garantir que o StatusBar esteja visível
      await StatusBar.show();
      
      // Configurar estilo padrão
      await StatusBar.setStyle({ style: Style.Light }); // Light = texto preto no fundo claro
      
      // Configurar cor de fundo padrão (branco)
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
      
      // Configurar para não sobrepor o conteúdo
      await StatusBar.setOverlaysWebView({ overlay: false });
      
      console.log('✅ StatusBar configurado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao configurar StatusBar:', error);
    }
  }

  /**
   * Configura o StatusBar para telas com fundo claro
   */
  static async setLightBackground() {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await StatusBar.show();
      await StatusBar.setStyle({ style: Style.Light }); // Texto preto
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
    } catch (error) {
      console.error('Erro ao configurar StatusBar light:', error);
    }
  }

  /**
   * Configura o StatusBar para telas com fundo escuro
   */
  static async setDarkBackground() {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await StatusBar.show();
      await StatusBar.setStyle({ style: Style.Dark }); // Texto branco
      await StatusBar.setBackgroundColor({ color: '#000000' });
    } catch (error) {
      console.error('Erro ao configurar StatusBar dark:', error);
    }
  }

  /**
   * Configura o StatusBar para a tela de auth (fundo azul claro)
   */
  static async setAuthBackground() {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await StatusBar.show();
      await StatusBar.setStyle({ style: Style.Light }); // Texto preto
      await StatusBar.setBackgroundColor({ color: '#eff6ff' });
    } catch (error) {
      console.error('Erro ao configurar StatusBar auth:', error);
    }
  }

  /**
   * Mostra o StatusBar
   */
  static async show() {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await StatusBar.show();
    } catch (error) {
      console.error('Erro ao mostrar StatusBar:', error);
    }
  }

  /**
   * Oculta o StatusBar
   */
  static async hide() {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      await StatusBar.hide();
    } catch (error) {
      console.error('Erro ao ocultar StatusBar:', error);
    }
  }
}