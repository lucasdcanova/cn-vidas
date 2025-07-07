import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from './db';

async function createRemoteConsoleTable() {
  try {
    console.log('🔧 Criando tabela remote_console_logs...');
    
    // Criar a tabela remote_console_logs
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS remote_console_logs (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        user_id INTEGER,
        log_level VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        metadata JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Criar índices separadamente
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_session_id ON remote_console_logs (session_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_id ON remote_console_logs (user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_timestamp ON remote_console_logs (timestamp)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_created_at ON remote_console_logs (created_at)`);
    
    console.log('✅ Tabela remote_console_logs criada com sucesso!');
    
    // Verificar se a tabela foi criada
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'remote_console_logs'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estrutura da tabela remote_console_logs:');
    result.rows.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
    process.exit(1);
  }
}

createRemoteConsoleTable();