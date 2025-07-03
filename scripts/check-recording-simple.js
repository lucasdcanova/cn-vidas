const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const appointmentId = process.argv[2] || 238;

async function check() {
  const recording = await prisma.$queryRaw`
    SELECT * FROM consultation_recordings 
    WHERE appointment_id = ${parseInt(appointmentId)}
    LIMIT 1
  `;
  
  if (!recording || recording.length === 0) {
    console.log('❌ Gravação não encontrada');
    return;
  }
  
  const rec = recording[0];
  console.log(`\n🔍 Detalhes da gravação - Consulta ${appointmentId}:`);
  console.log('  Cloud Status:', rec.cloud_recording_status);
  console.log('  AI Status:', rec.ai_processing_status);
  console.log('  Transcription Status:', rec.transcription_status);
  console.log('  AI Error:', rec.ai_processing_error || 'Nenhum');
  console.log('  Audio URL:', rec.audio_url || 'Não definido');
  console.log('  Has Transcription:', rec.transcription ? 'SIM' : 'NÃO');
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());