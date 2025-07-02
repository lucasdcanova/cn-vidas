const { Pool } = require('pg');
require('dotenv').config();

async function checkTranscription(appointmentId) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const result = await pool.query(`
      SELECT 
        id,
        appointment_id,
        transcription,
        audio_url,
        file_size,
        duration
      FROM consultation_recordings
      WHERE appointment_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [appointmentId]);

    if (result.rows.length === 0) {
      console.log('❌ Nenhuma gravação encontrada');
      return;
    }

    const recording = result.rows[0];
    console.log('\n📼 Detalhes da gravação:');
    console.log(`   - ID: ${recording.id}`);
    console.log(`   - Arquivo: ${recording.audio_url}`);
    console.log(`   - Tamanho: ${recording.file_size ? (recording.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}`);
    console.log(`   - Duração: ${recording.duration || 'N/A'} segundos`);
    console.log(`\n📝 Transcrição: "${recording.transcription}"`);
    console.log(`   - Comprimento: ${recording.transcription ? recording.transcription.length : 0} caracteres`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

// Executar
const appointmentId = process.argv[2] || 220;
checkTranscription(appointmentId).catch(console.error);