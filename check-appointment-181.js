const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAppointment181() {
  try {
    console.log('🔍 Checking appointment 181...\n');
    
    const appointment = await prisma.appointments.findUnique({
      where: { id: 181 },
      include: {
        consultation_recording: true,
        medical_records: true
      }
    });
    
    if (appointment) {
      console.log('Appointment 181 found:');
      console.log(`  Status: ${appointment.status}`);
      console.log(`  Date: ${appointment.date}`);
      console.log(`  Has Recording: ${!!appointment.consultation_recording}`);
      
      if (appointment.consultation_recording) {
        console.log('\nRecording details:');
        console.log(`  ID: ${appointment.consultation_recording.id}`);
        console.log(`  Status: ${appointment.consultation_recording.transcription_status}`);
        console.log(`  Audio URL: ${appointment.consultation_recording.audio_url}`);
        console.log(`  Has Transcription: ${!!appointment.consultation_recording.transcription}`);
        console.log(`  Has AI Notes: ${!!appointment.consultation_recording.ai_generated_notes}`);
        console.log(`  Error: ${appointment.consultation_recording.processing_error || 'None'}`);
      }
      
      console.log(`\nMedical Records: ${appointment.medical_records.length}`);
      appointment.medical_records.forEach((record, i) => {
        console.log(`  Record ${i + 1}: ID ${record.id}, Status: ${record.status}`);
      });
    } else {
      console.log('❌ Appointment 181 not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAppointment181();