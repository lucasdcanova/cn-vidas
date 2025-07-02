const { Pool } = require('pg');
require('dotenv').config();

async function fixFailedRecording(appointmentId) {
  console.log(`\n🔧 Corrigindo gravação com falha para consulta ${appointmentId}...\n`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Resetar status para reprocessar
    const result = await pool.query(`
      UPDATE consultation_recordings
      SET 
        transcription_status = 'pending',
        ai_processing_status = 'pending',
        transcription_error = NULL,
        ai_processing_error = NULL,
        processing_started_at = NULL,
        processing_completed_at = NULL
      WHERE appointment_id = $1
      RETURNING id
    `, [appointmentId]);

    if (result.rows.length === 0) {
      console.log('❌ Nenhuma gravação encontrada');
      return;
    }

    console.log(`✅ Gravação ${result.rows[0].id} resetada para reprocessamento`);
    console.log('\n💡 A gravação será reprocessada automaticamente em alguns segundos');
    console.log('   Aguarde cerca de 30 segundos e verifique novamente');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

// Executar
const appointmentId = process.argv[2] || 220;
fixFailedRecording(appointmentId).catch(console.error);