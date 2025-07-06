import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

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
    if (this.shouldEnableRemoteLogging()) {
      this.interceptConsole();
    }
  }

  private shouldEnableRemoteLogging(): boolean {
    // Ativa apenas em produção ou com flag específica
    const isProduction = process.env.NODE_ENV === 'production';
    const hasRemoteLogFlag = localStorage.getItem('enableRemoteConsole') === 'true';
    const isTestFlight = navigator.userAgent.includes('TestFlight');
    
    return isProduction || hasRemoteLogFlag || isTestFlight;
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
      await fetch(REMOTE_LOG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
          sessionId: this.getSessionId(),
        }),
      });
    } catch (error) {
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
  setEnabled(enabled: boolean) {
    localStorage.setItem('enableRemoteConsole', enabled.toString());
    if (enabled && !this.shouldEnableRemoteLogging()) {
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