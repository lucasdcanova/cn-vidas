const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Executando migração de sincronização do schema...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Adicionar colunas faltantes
    console.log('📋 Adicionando colunas faltantes na tabela consultation_recordings...');
    
    const alterTableQuery = `
      ALTER TABLE consultation_recordings 
      ADD COLUMN IF NOT EXISTS soap_note JSON,
      ADD COLUMN IF NOT EXISTS prescription JSON,
      ADD COLUMN IF NOT EXISTS summary TEXT,
      ADD COLUMN IF NOT EXISTS ai_processing_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS ai_processing_error TEXT,
      ADD COLUMN IF NOT EXISTS transcription_error TEXT;
    `;

    await pool.query(alterTableQuery);
    console.log('✅ Colunas adicionadas com sucesso!\n');

    // Adicionar comentários
    console.log('💬 Adicionando comentários de documentação...');
    
    const comments = [
      "COMMENT ON COLUMN consultation_recordings.soap_note IS 'Nota SOAP gerada pela IA'",
      "COMMENT ON COLUMN consultation_recordings.prescription IS 'Prescrição médica gerada pela IA'",
      "COMMENT ON COLUMN consultation_recordings.summary IS 'Resumo da consulta gerado pela IA'",
      "COMMENT ON COLUMN consultation_recordings.ai_processing_status IS 'Status do processamento da IA: pending, processing, completed, failed'",
      "COMMENT ON COLUMN consultation_recordings.ai_processing_error IS 'Erro durante processamento da IA, se houver'",
      "COMMENT ON COLUMN consultation_recordings.transcription_error IS 'Erro durante transcrição, se houver'"
    ];

    for (const comment of comments) {
      await pool.query(comment);
    }
    
    console.log('✅ Comentários adicionados!\n');

    // Verificar gravações com falha
    console.log('🔍 Verificando gravações com falha de processamento...');
    
    const failedRecordings = await pool.query(`
      SELECT id, appointment_id, transcription_status 
      FROM consultation_recordings 
      WHERE transcription_status = 'failed' 
         OR ai_processing_status = 'failed'
         OR (transcription_status = 'completed' AND ai_processing_status IS NULL)
      ORDER BY created_at DESC
    `);

    if (failedRecordings.rows.length > 0) {
      console.log(`\n⚠️  Encontradas ${failedRecordings.rows.length} gravações com problemas:`);
      failedRecordings.rows.forEach(rec => {
        console.log(`   - Recording ID: ${rec.id}, Appointment: ${rec.appointment_id}, Status: ${rec.transcription_status}`);
      });
      console.log('\n💡 Execute "node reprocess-recording.js" para reprocessar essas gravações.');
    } else {
      console.log('✅ Nenhuma gravação com problemas encontrada!');
    }

    console.log('\n✨ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar
runMigration().catch(console.error);