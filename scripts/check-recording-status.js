require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkRecordingStatus() {
  try {
    console.log('🔍 Verificando últimas gravações...\n');
    
    // Buscar últimas gravações
    const recordings = await sql`
      SELECT 
        cr.id,
        cr.appointment_id,
        cr.room_name,
        cr.cloud_recording_status,
        cr.ai_processing_status,
        cr.transcription_status,
        cr.created_at,
        a.telemed_room_name
      FROM consultation_recordings cr
      LEFT JOIN appointments a ON a.id = cr.appointment_id
      ORDER BY cr.created_at DESC
      LIMIT 10
    `;
    
    console.log(`📊 Encontradas ${recordings.length} gravações:\n`);
    
    recordings.forEach(rec => {
      console.log(`ID: ${rec.id}`);
      console.log(`  Appointment: ${rec.appointment_id}`);
      console.log(`  Room Name: ${rec.room_name || 'N/A'}`);
      console.log(`  Telemed Room: ${rec.telemed_room_name || 'N/A'}`);
      console.log(`  Cloud Status: ${rec.cloud_recording_status}`);
      console.log(`  AI Status: ${rec.ai_processing_status}`);
      console.log(`  Transcription: ${rec.transcription_status}`);
      console.log(`  Created: ${rec.created_at}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
  
  process.exit(0);
}

checkRecordingStatus();