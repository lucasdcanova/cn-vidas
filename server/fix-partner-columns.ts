import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from './db';

async function fixPartnerColumns() {
  try {
    console.log('🔧 Adicionando coluna onboarding_completed à tabela partners...');
    
    await db.execute(sql`
      ALTER TABLE partners 
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false NOT NULL
    `);
    
    console.log('✅ Coluna onboarding_completed adicionada com sucesso!');
    
    // Verificar se existem outras colunas que possam estar faltando
    console.log('🔍 Verificando estrutura da tabela partners...');
    
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'partners'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colunas da tabela partners:');
    result.rows.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error);
    process.exit(1);
  }
}

fixPartnerColumns();