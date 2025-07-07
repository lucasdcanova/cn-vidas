import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Preferences } from '@capacitor/preferences';

interface RemoteLogEntry {
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  timestamp: string;
  userAgent: string;
  platform: string;
  appVersion: string;
  stack?: string;
  metadata?: any;
}

const REMOTE_LOG_ENDPOINT = '/api/diagnostics/remote-console';
const LOG_BUFFER_SIZE = 50;
const FLUSH_INTERVAL = 5000; // 5 segundos

class RemoteConsole {
  private logBuffer: RemoteLogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };

  constructor() {
    this.initialize();
  }
  
  private async initialize() {
    const shouldEnable = await this.shouldEnableRemoteLogging();
    
    if (shouldEnable) {
      this.interceptConsole();
      this.originalConsole.log('[RemoteConsole] Ativado! Logs serão enviados para o servidor.');
      
      // Adicionar logs de teste inicial com delay
      setTimeout(() => {
        console.log('[RemoteConsole] Log de teste - Console remoto funcionando!');
        console.info('[RemoteConsole] Informação de teste');
        console.warn('[RemoteConsole] Aviso de teste');
        
        // Forçar flush imediato para teste
        this.flush().then(() => {
          this.originalConsole.log('[RemoteConsole] Flush de teste completado');
        }).catch(err => {
          this.originalConsole.error('[RemoteConsole] Erro no flush de teste:', err);
        });
      }, 2000);
    } else {
      this.originalConsole.log('[RemoteConsole] Não ativado. Condições não atendidas.');
    }
  }

  private async shouldEnableRemoteLogging(): Promise<boolean> {
    // Ativa em produção, TestFlight, ou com flag específica
    const isProduction = process.env.NODE_ENV === 'production';
    const isTestFlight = navigator.userAgent.includes('TestFlight');
    const isCapacitor = !!(window as any).Capacitor;
    const isNativeApp = isCapacitor && (window as any).Capacitor.isNativePlatform();
    
    // Verifica flag no storage apropriado
    let hasRemoteLogFlag = false;
    
    if (isNativeApp) {
      try {
        const { value } = await Preferences.get({ key: 'enableRemoteConsole' });
        hasRemoteLogFlag = value === 'true';
      } catch (error) {
        this.originalConsole.error('[RemoteConsole] Erro ao ler preferências:', error);
      }
    } else {
      hasRemoteLogFlag = localStorage.getItem('enableRemoteConsole') === 'true';
    }
    
    // Log para debug
    this.originalConsole.log('[RemoteConsole] Debug info:', {
      isProduction,
      hasRemoteLogFlag,
      isTestFlight,
      isCapacitor,
      isNativeApp,
      userAgent: navigator.userAgent,
      nodeEnv: process.env.NODE_ENV
    });
    
    // Sempre ativa se a flag estiver definida
    if (hasRemoteLogFlag) {
      this.originalConsole.log('[RemoteConsole] Ativado por flag de configuração');
      return true;
    }
    
    // Ativa para qualquer app nativo ou com as outras condições
    return isProduction || isTestFlight || isNativeApp;
  }

  private interceptConsole() {
    ['log', 'warn', 'error', 'info', 'debug'].forEach((level) => {
      const originalMethod = this.originalConsole[level as keyof typeof this.originalConsole];
      
      (console as any)[level] = (...args: any[]) => {
        // Chama o console original
        originalMethod.apply(console, args);
        
        // Captura para envio remoto
        this.captureLog(level as RemoteLogEntry['level'], args);
      };
    });
  }

  private captureLog(level: RemoteLogEntry['level'], args: any[]) {
    try {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      }).join(' ');

      const logEntry: RemoteLogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        appVersion: (window as any).APP_VERSION || 'unknown',
        metadata: {
          url: window.location.href,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
      };

      // Captura stack trace para erros
      if (level === 'error') {
        const error = args.find(arg => arg instanceof Error);
        if (error) {
          logEntry.stack = error.stack;
        }
      }

      this.addToBuffer(logEntry);
    } catch (e) {
      // Falha silenciosamente para não causar loops
    }
  }

  private addToBuffer(entry: RemoteLogEntry) {
    this.logBuffer.push(entry);
    
    // Limita o tamanho do buffer
    if (this.logBuffer.length > LOG_BUFFER_SIZE) {
      this.logBuffer.shift();
    }
    
    // Agenda flush
    this.scheduleFlush();
  }

  private scheduleFlush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, FLUSH_INTERVAL);
  }

  async flush() {
    if (this.logBuffer.length === 0) return;
    
    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];
    
    try {
      this.originalConsole.log(`[RemoteConsole] Enviando ${logsToSend.length} logs para o servidor...`);
      
      // Tenta obter o userId do localStorage (se o usuário estiver logado)
      const userStr = localStorage.getItem('user');
      let userId: number | undefined;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user.id;
        } catch (e) {
          // Ignora erro de parse
        }
      }
      
      const response = await fetch(REMOTE_LOG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Incluir cookies para autenticação
        body: JSON.stringify({
          logs: logsToSend,
          sessionId: this.getSessionId(),
          userId: userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      this.originalConsole.log(`[RemoteConsole] ✅ ${result.count} logs enviados com sucesso`);
    } catch (error) {
      this.originalConsole.error('[RemoteConsole] ❌ Erro ao enviar logs:', error);
      // Re-adiciona logs ao buffer se falhar
      this.logBuffer = [...logsToSend, ...this.logBuffer];
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('remoteConsoleSessionId');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('remoteConsoleSessionId', sessionId);
    }
    return sessionId;
  }

  // Método público para forçar envio
  forceFlush() {
    this.flush();
  }

  // Método para ativar/desativar
  async setEnabled(enabled: boolean) {
    const isCapacitor = !!(window as any).Capacitor;
    const isNativeApp = isCapacitor && (window as any).Capacitor.isNativePlatform();
    
    if (isNativeApp) {
      try {
        await Preferences.set({
          key: 'enableRemoteConsole',
          value: enabled.toString()
        });
      } catch (error) {
        this.originalConsole.error('[RemoteConsole] Erro ao salvar preferências:', error);
      }
    } else {
      localStorage.setItem('enableRemoteConsole', enabled.toString());
    }
    
    const shouldEnable = await this.shouldEnableRemoteLogging();
    if (enabled && !shouldEnable) {
      window.location.reload();
    }
  }
}

// Instância global
const remoteConsole = new RemoteConsole();

// Hook para usar em componentes
export function useRemoteConsole() {
  useEffect(() => {
    // Força flush ao desmontar ou fechar página
    const handleUnload = () => {
      remoteConsole.forceFlush();
    };
    
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      remoteConsole.forceFlush();
    };
  }, []);
  
  return {
    flush: () => remoteConsole.forceFlush(),
    setEnabled: (enabled: boolean) => remoteConsole.setEnabled(enabled),
  };
}

// Exporta instância para uso direto
export { remoteConsole };