// Sistema de logs remotos para debug em produção
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  userAgent: string;
  url: string;
}

class RemoteLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  
  constructor() {
    // Salvar logs originais
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // Interceptar console.log
    console.log = (...args) => {
      originalLog(...args);
      this.log('info', args.join(' '));
    };
    
    // Interceptar console.warn
    console.warn = (...args) => {
      originalWarn(...args);
      this.log('warn', args.join(' '));
    };
    
    // Interceptar console.error
    console.error = (...args) => {
      originalError(...args);
      this.log('error', args.join(' '));
    };
    
    // Capturar erros globais
    window.addEventListener('error', (event) => {
      this.log('error', `Global error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });
    
    // Capturar promises rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', `Unhandled promise rejection: ${event.reason}`);
    });
  }
  
  private log(level: LogEntry['level'], message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.logs.push(entry);
    
    // Limitar número de logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Salvar no localStorage para recuperar depois
    try {
      localStorage.setItem('cnvidas_debug_logs', JSON.stringify(this.logs));
    } catch (e) {
      // Ignorar erros de localStorage
    }
  }
  
  // Método para enviar logs para servidor (opcional)
  async sendLogs() {
    try {
      const response = await fetch('/api/debug/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: this.logs,
          deviceInfo: {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timestamp: new Date().toISOString()
          }
        })
      });
      
      if (response.ok) {
        this.logs = []; // Limpar logs após enviar
        localStorage.removeItem('cnvidas_debug_logs');
      }
    } catch (error) {
      console.error('Erro ao enviar logs:', error);
    }
  }
  
  // Método para obter logs
  getLogs() {
    return this.logs;
  }
  
  // Método para exibir logs na tela (útil para debug)
  showLogsOnScreen() {
    const logsDiv = document.createElement('div');
    logsDiv.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      max-height: 200px;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: monospace;
      font-size: 10px;
      padding: 10px;
      z-index: 99999;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'X';
    closeBtn.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: red;
      color: white;
      border: none;
      padding: 5px 10px;
      cursor: pointer;
    `;
    closeBtn.onclick = () => logsDiv.remove();
    
    logsDiv.appendChild(closeBtn);
    
    const logsContent = document.createElement('pre');
    logsContent.textContent = this.logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    logsDiv.appendChild(logsContent);
    document.body.appendChild(logsDiv);
  }
}

// Exportar instância única
export const remoteLogger = new RemoteLogger();

// Adicionar comando global para debug
(window as any).showDebugLogs = () => remoteLogger.showLogsOnScreen();
(window as any).getDebugLogs = () => remoteLogger.getLogs();
(window as any).sendDebugLogs = () => remoteLogger.sendLogs();