const { drizzle } = require('drizzle-orm/neon-serverless');
const { neon } = require('@neondatabase/serverless');
const { consultationRecordings } = require('../shared/schema');
const { eq } = require('drizzle-orm');

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql });

const appointmentId = process.argv[2] || 238;

async function checkError() {
  const recording = await db.select()
    .from(consultationRecordings)
    .where(eq(consultationRecordings.appointmentId, parseInt(appointmentId)))
    .limit(1);
  
  if (recording.length === 0) {
    console.log('❌ Gravação não encontrada');
    return;
  }
  
  const rec = recording[0];
  console.log(`\n🔍 Detalhes da gravação - Consulta ${appointmentId}:`);
  console.log('  Cloud Status:', rec.cloudRecordingStatus);
  console.log('  AI Status:', rec.aiProcessingStatus);
  console.log('  Transcription Status:', rec.transcriptionStatus);
  console.log('  AI Error:', rec.aiProcessingError || 'Nenhum');
  console.log('  Audio URL:', rec.audioUrl || 'Não definido');
  console.log('  Transcription:', rec.transcription ? rec.transcription.substring(0, 100) + '...' : 'Vazio');
}

checkError().catch(console.error);