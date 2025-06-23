import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

async function runMigration() {
  try {
    console.log('🔧 Executando migração para consultation_recordings...');
    
    // Ler arquivo SQL
    const migrationPath = path.join(process.cwd(), 'server/migrations/consultation_recordings.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    
    // Executar cada comando SQL separadamente
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    for (const command of commands) {
      if (command.includes('CREATE') || command.includes('INDEX')) {
        console.log(`📝 Executando: ${command.substring(0, 50)}...`);
        await db.execute(sql.raw(command + ';'));
      }
    }
    
    console.log('✅ Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

runMigration();