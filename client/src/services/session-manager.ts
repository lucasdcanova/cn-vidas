import { Capacitor } from '@capacitor/core';
import { isNativeApp } from '@/utils/platform';
import { queryClient } from '@/lib/queryClient';
import { secureStorage } from './secure-storage';

class SessionManager {
  private isNative = Capacitor.isNativePlatform();

  /**
   * Limpa completamente a sessão do usuário
   * Especialmente importante para iOS onde cookies podem persistir
   */
  async clearSession(): Promise<void> {
    console.log('🧹 SessionManager: Iniciando limpeza completa da sessão');

    try {
      // 1. Limpar armazenamento seguro (KeyChain no iOS)
      await secureStorage.clear();
      console.log('✅ Armazenamento seguro limpo');

      // 2. Limpar localStorage
      const keysToRemove = [
        'authToken',
        'sessionID',
        'userData',
        'userRole',
        'userId',
        'userEmail'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Limpar todo o localStorage para garantir
      localStorage.clear();
      console.log('✅ LocalStorage limpo');

      // 3. Limpar sessionStorage
      sessionStorage.clear();
      console.log('✅ SessionStorage limpo');

      // 4. Limpar cookies via JavaScript
      this.clearAllCookies();
      console.log('✅ Cookies limpos via JavaScript');

      // 5. Limpar cache do React Query
      queryClient.clear();
      queryClient.removeQueries();
      queryClient.cancelQueries();
      
      // Especificamente invalidar a query do usuário
      queryClient.setQueryData(['/api/user'], null);
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      console.log('✅ Cache do React Query limpo');

      // 6. Se estiver no iOS, usar API nativa para limpar dados do WebView
      if (this.isNative && Capacitor.getPlatform() === 'ios') {
        await this.clearIOSWebViewData();
      }

      // 7. Adicionar delay para garantir que todas as operações sejam concluídas
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('✅ SessionManager: Limpeza completa da sessão concluída');
    } catch (error) {
      console.error('❌ SessionManager: Erro ao limpar sessão:', error);
      // Continuar mesmo se houver erro em alguma etapa
    }
  }

  /**
   * Limpa todos os cookies possíveis
   */
  private clearAllCookies(): void {
    // Obter todos os cookies
    const cookies = document.cookie.split(';');
    
    // Para cada cookie, tentar removê-lo de várias formas
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      
      if (name) {
        // Tentar remover o cookie com diferentes combinações de path e domain
        const paths = ['/', window.location.pathname, ''];
        const domains = [
          '',
          window.location.hostname,
          `.${window.location.hostname}`,
          window.location.hostname.replace(/^www\./, ''),
          `.${window.location.hostname.replace(/^www\./, '')}`,
          'localhost',
          '.localhost',
          'cnvidas-updated.onrender.com',
          '.cnvidas-updated.onrender.com'
        ];
        
        paths.forEach(path => {
          domains.forEach(domain => {
            // Definir cookie com valor vazio e data de expiração no passado
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path};${domain ? ` domain=${domain};` : ''}`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=-99999999; path=${path};${domain ? ` domain=${domain};` : ''}`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path};${domain ? ` domain=${domain};` : ''} SameSite=None; Secure`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path};${domain ? ` domain=${domain};` : ''} SameSite=Lax`;
          });
        });
      }
    });
  }

  /**
   * Limpa dados específicos do WebView no iOS
   */
  private async clearIOSWebViewData(): Promise<void> {
    try {
      // Importar plugin do Capacitor App para iOS
      const { App } = await import('@capacitor/app');
      
      // Forçar reload da aplicação para limpar cache do WebView
      // Isso é mais agressivo mas garante limpeza completa no iOS
      console.log('🔄 iOS: Forçando reload do WebView');
      
      // Primeiro tentar limpar dados do WebView se disponível
      if ('webkit' in window && window.webkit?.messageHandlers) {
        try {
          // Tentar enviar mensagem para o iOS nativo limpar dados
          (window as any).webkit.messageHandlers.clearWebViewData?.postMessage({});
        } catch (e) {
          console.log('⚠️ iOS: Não foi possível enviar mensagem para limpar WebView');
        }
      }

      // Aguardar um momento antes de recarregar
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('❌ iOS: Erro ao limpar dados do WebView:', error);
    }
  }

  /**
   * Verifica se há sessão ativa
   */
  hasActiveSession(): boolean {
    return !!(
      localStorage.getItem('authToken') || 
      document.cookie.includes('auth_token') ||
      queryClient.getQueryData(['/api/user'])
    );
  }

  /**
   * Força logout completo com redirecionamento
   */
  async forceLogout(): Promise<void> {
    console.log('🚪 SessionManager: Forçando logout completo');
    
    // Limpar toda a sessão
    await this.clearSession();
    
    // Aguardar para garantir limpeza
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Redirecionar para a página de autenticação
    window.location.href = '/auth';
  }
}

// Exportar instância única
export const sessionManager = new SessionManager();

// Exportar também a classe para testes
export { SessionManager };