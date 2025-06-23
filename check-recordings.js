const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecordings() {
  try {
    console.log('🔍 Checking database for recordings...\n');
    
    // Check consultation_recordings table
    const recordings = await prisma.consultation_recordings.findMany({
      include: {
        appointments: true,
        medical_records: true
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });
    
    console.log(`Found ${recordings.length} recordings:\n`);
    
    recordings.forEach((recording, index) => {
      console.log(`Recording ${index + 1}:`);
      console.log(`  ID: ${recording.id}`);
      console.log(`  Appointment ID: ${recording.appointment_id}`);
      console.log(`  Status: ${recording.transcription_status}`);
      console.log(`  Has Audio URL: ${!!recording.audio_url}`);
      console.log(`  Has Transcription: ${!!recording.transcription}`);
      console.log(`  Has AI Notes: ${!!recording.ai_generated_notes}`);
      console.log(`  Medical Records: ${recording.medical_records.length}`);
      console.log(`  Created: ${recording.created_at}`);
      console.log(`  Error: ${recording.processing_error || 'None'}`);
      console.log('---');
    });
    
    // Check specific appointment
    console.log('\n🔍 Checking appointment 182 specifically...');
    const appointment182 = await prisma.appointments.findUnique({
      where: { id: 182 },
      include: {
        consultation_recording: true
      }
    });
    
    if (appointment182) {
      console.log('Appointment 182 found:');
      console.log(`  Status: ${appointment182.status}`);
      console.log(`  Date: ${appointment182.date}`);
      console.log(`  Has Recording: ${!!appointment182.consultation_recording}`);
      if (appointment182.consultation_recording) {
        console.log(`  Recording Status: ${appointment182.consultation_recording.transcription_status}`);
      }
    } else {
      console.log('❌ Appointment 182 not found');
    }
    
    // Check medical records for appointment 182
    console.log('\n🔍 Checking medical records for appointment 182...');
    const medicalRecords = await prisma.medical_records.findMany({
      where: { appointment_id: 182 }
    });
    
    console.log(`Found ${medicalRecords.length} medical records for appointment 182`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecordings();