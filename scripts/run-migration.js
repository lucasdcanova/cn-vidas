require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('🔧 Aplicando migrações...');
    
    // Adicionar colunas de cloud recording
    await sql`
      ALTER TABLE consultation_recordings 
      ADD COLUMN IF NOT EXISTS cloud_recording_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS cloud_recording_url TEXT,
      ADD COLUMN IF NOT EXISTS cloud_recording_status VARCHAR(50) DEFAULT 'pending'
    `;
    
    console.log('✅ Colunas de cloud recording adicionadas');
    
    // Adicionar outras colunas que possam estar faltando
    await sql`
      ALTER TABLE consultation_recordings 
      ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS ai_processing_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS ai_processing_error TEXT,
      ADD COLUMN IF NOT EXISTS transcription_error TEXT,
      ADD COLUMN IF NOT EXISTS soap_note JSONB,
      ADD COLUMN IF NOT EXISTS prescription JSONB,
      ADD COLUMN IF NOT EXISTS summary TEXT,
      ADD COLUMN IF NOT EXISTS room_name VARCHAR(255)
    `;
    
    console.log('✅ Todas as colunas verificadas e adicionadas');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

runMigration();