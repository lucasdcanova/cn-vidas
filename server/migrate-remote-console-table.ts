import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from './db';

async function migrateRemoteConsoleTable() {
  try {
    console.log('🔧 Migrando tabela remote_console_logs...');
    
    // 1. Primeiro, copiar dados de log_level para level se necessário
    await db.execute(sql`
      UPDATE remote_console_logs 
      SET level = log_level 
      WHERE level IS NULL AND log_level IS NOT NULL
    `);
    console.log('✅ Dados copiados de log_level para level');
    
    // 2. Tornar level NOT NULL se tem dados
    await db.execute(sql`
      UPDATE remote_console_logs 
      SET level = 'log' 
      WHERE level IS NULL
    `);
    console.log('✅ Valores NULL em level corrigidos');
    
    // 3. Alterar level para NOT NULL
    await db.execute(sql`
      ALTER TABLE remote_console_logs 
      ALTER COLUMN level SET NOT NULL
    `);
    console.log('✅ Coluna level definida como NOT NULL');
    
    // 4. Remover restrição NOT NULL de log_level
    await db.execute(sql`
      ALTER TABLE remote_console_logs 
      ALTER COLUMN log_level DROP NOT NULL
    `);
    console.log('✅ Restrição NOT NULL removida de log_level');
    
    // 5. Tornar session_id NOT NULL também
    await db.execute(sql`
      UPDATE remote_console_logs 
      SET session_id = 'legacy-' || id::text 
      WHERE session_id IS NULL
    `);
    
    await db.execute(sql`
      ALTER TABLE remote_console_logs 
      ALTER COLUMN session_id SET NOT NULL
    `);
    console.log('✅ Coluna session_id definida como NOT NULL');
    
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
    console.error('❌ Erro ao migrar tabela:', error);
    process.exit(1);
  }
}

migrateRemoteConsoleTable();