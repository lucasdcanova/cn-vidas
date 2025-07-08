import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from './db';

async function fixRemoteConsoleTable() {
  try {
    console.log('🔧 Corrigindo tabela remote_console_logs...');
    
    // Verificar estrutura atual
    const currentColumns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'remote_console_logs'
    `);
    
    console.log('📋 Colunas atuais:', currentColumns.rows.map((r: any) => r.column_name));
    
    // Adicionar colunas faltantes
    const columnsToAdd = [
      { name: 'level', type: 'VARCHAR(50)', nullable: true },
      { name: 'user_agent', type: 'TEXT', nullable: true },
      { name: 'platform', type: 'VARCHAR(255)', nullable: true },
      { name: 'app_version', type: 'VARCHAR(50)', nullable: true },
      { name: 'stack', type: 'TEXT', nullable: true }
    ];
    
    for (const col of columnsToAdd) {
      const exists = currentColumns.rows.some((r: any) => r.column_name === col.name);
      if (!exists) {
        console.log(`➕ Adicionando coluna ${col.name}...`);
        await db.execute(sql`ALTER TABLE remote_console_logs ADD COLUMN ${sql.raw(col.name)} ${sql.raw(col.type)}`);
      }
    }
    
    // Se temos log_level mas não level, copiar dados
    const hasLogLevel = currentColumns.rows.some((r: any) => r.column_name === 'log_level');
    const hasLevel = currentColumns.rows.some((r: any) => r.column_name === 'level');
    
    if (hasLogLevel && !hasLevel) {
      console.log('📋 Copiando dados de log_level para level...');
      await db.execute(sql`UPDATE remote_console_logs SET level = log_level WHERE level IS NULL`);
    }
    
    // Verificar estrutura final
    const finalColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'remote_console_logs'
      ORDER BY ordinal_position
    `);
    
    console.log('\n✅ Estrutura final da tabela remote_console_logs:');
    finalColumns.rows.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao corrigir tabela:', error);
    process.exit(1);
  }
}

fixRemoteConsoleTable();