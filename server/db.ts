import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from '../shared/schema';

// Configuração básica do WebSocket para Neon
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configurando o pool com opções otimizadas para produção
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,                          // Aumentar para suportar múltiplas requisições simultâneas
  idleTimeoutMillis: 30000,         // 30 segundos - tempo adequado para conexão inativa
  connectionTimeoutMillis: 15000,   // 15 segundos - mais tempo para conexões instáveis
  allowExitOnIdle: true,            // Permitir que o processo encerre quando idle
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } // SSL para produção (Neon requer)
    : false
});

// Adicione um handler para eventos de erro no pool de conexão
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexão do banco de dados:', err);
});

// Inicialização da instância Drizzle
export const db = drizzle(pool, { schema });

// Re-exportar schemas necessários
export { deviceTokens } from '../db/schema/device-tokens';

// Função auxiliar para garantir que o pool está funcionando
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Conexão com o banco de dados testada com sucesso:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Erro ao testar conexão com o banco de dados:', error);
    return false;
  }
};

// Implementação de retry logic para queries
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Se for erro de timeout ou conexão, tentar novamente
      if (error.message?.includes('timeout') || 
          error.message?.includes('connect') ||
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT') {
        
        if (i < maxRetries - 1) {
          const waitTime = delay * Math.pow(2, i); // Backoff exponencial
          console.log(`Retry ${i + 1}/${maxRetries} após ${waitTime}ms - Erro: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // Se não for erro de conexão, lançar imediatamente
      throw error;
    }
  }
  
  throw lastError;
}

// Função wrapper para queries com retry automático
export async function safeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
  return executeWithRetry(queryFn);
}

// Testar a conexão durante a inicialização com retry
executeWithRetry(testConnection, 5, 2000).catch(err => {
  console.error('Falha no teste inicial de conexão após múltiplas tentativas:', err);
});
