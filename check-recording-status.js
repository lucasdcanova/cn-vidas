const { Pool } = require('pg');
require('dotenv').config();

async function checkRecordingStatus(appointmentId) {
  console.log(`\n🔍 Verificando status da gravação para consulta ${appointmentId}...\n`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Buscar gravação
    const recordingResult = await pool.query(`
      SELECT 
        id,
        appointment_id,
        transcription_status,
        ai_processing_status,
        transcription_error,
        ai_processing_error,
        created_at,
        processing_started_at,
        processing_completed_at,
        transcription IS NOT NULL as has_transcription,
        soap_note IS NOT NULL as has_soap_note,
        length(transcription) as transcription_length
      FROM consultation_recordings
      WHERE appointment_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [appointmentId || 220]);

    if (recordingResult.rows.length === 0) {
      console.log('❌ Nenhuma gravação encontrada para esta consulta');
      return;
    }

    const recording = recordingResult.rows[0];
    console.log('📼 Gravação encontrada:');
    console.log(`   - ID: ${recording.id}`);
    console.log(`   - Status transcrição: ${recording.transcription_status}`);
    console.log(`   - Status AI: ${recording.ai_processing_status}`);
    console.log(`   - Tem transcrição: ${recording.has_transcription ? 'Sim (' + recording.transcription_length + ' caracteres)' : 'Não'}`);
    console.log(`   - Tem nota SOAP: ${recording.has_soap_note ? 'Sim' : 'Não'}`);
    
    if (recording.transcription_error) {
      console.log(`   - ❌ Erro transcrição: ${recording.transcription_error}`);
    }
    if (recording.ai_processing_error) {
      console.log(`   - ❌ Erro AI: ${recording.ai_processing_error}`);
    }

    // Buscar prontuário médico
    console.log('\n📋 Verificando prontuário médico...');
    const medicalRecordResult = await pool.query(`
      SELECT 
        id,
        status,
        ai_generated,
        created_at
      FROM medical_records
      WHERE appointment_id = $1
      LIMIT 1
    `, [appointmentId || 220]);

    if (medicalRecordResult.rows.length === 0) {
      console.log('❌ Nenhum prontuário médico encontrado');
      
      // Se a gravação tem processamento completo mas não tem prontuário, é um problema
      if (recording.ai_processing_status === 'completed') {
        console.log('\n⚠️  PROBLEMA: Processamento AI completo mas prontuário não criado!');
      } else if (recording.ai_processing_status === 'processing') {
        console.log('\n⏳ Processamento AI ainda em andamento...');
      } else if (recording.ai_processing_status === 'pending') {
        console.log('\n⏳ Processamento AI ainda não iniciado');
      }
    } else {
      const record = medicalRecordResult.rows[0];
      console.log('✅ Prontuário médico encontrado:');
      console.log(`   - ID: ${record.id}`);
      console.log(`   - Status: ${record.status}`);
      console.log(`   - Gerado por AI: ${record.ai_generated ? 'Sim' : 'Não'}`);
      console.log(`   - Criado em: ${record.created_at}`);
    }

    // Calcular tempo de processamento
    if (recording.processing_started_at) {
      const startTime = new Date(recording.processing_started_at);
      const endTime = recording.processing_completed_at ? new Date(recording.processing_completed_at) : new Date();
      const duration = (endTime - startTime) / 1000;
      console.log(`\n⏱️  Tempo de processamento: ${duration.toFixed(1)} segundos`);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
  } finally {
    await pool.end();
  }
}

// Executar
const appointmentId = process.argv[2];
checkRecordingStatus(appointmentId).catch(console.error);