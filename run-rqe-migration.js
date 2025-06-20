const { sql } = require('drizzle-orm');
const { db } = require('./dist/server/db.js');

async function runRQEMigration() {
  try {
    console.log('Iniciando migração para adicionar campo RQE...');
    
    // Adicionar coluna rqe (Registro de Qualificação de Especialista) à tabela doctors
    await db.execute(sql`
      ALTER TABLE doctors 
      ADD COLUMN IF NOT EXISTS rqe TEXT
    `);
    
    console.log('✅ Campo RQE adicionado com sucesso à tabela doctors!');
  } catch (error) {
    console.error('❌ Erro ao executar migração RQE:', error);
  } finally {
    process.exit();
  }
}

runRQEMigration();