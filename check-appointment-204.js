const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAppointment204() {
  try {
    console.log('🔍 Checking appointment 204...\n');
    
    // Buscar consulta
    const appointment = await prisma.appointments.findUnique({
      where: { id: 204 },
      include: {
        consultation_recording: true,
        medical_records: true,
        users: true,
        doctors: {
          include: {
            users: true
          }
        }
      }
    });
    
    if (appointment) {
      console.log('📋 Appointment 204 details:');
      console.log(`  Status: ${appointment.status}`);
      console.log(`  Date: ${appointment.date}`);
      console.log(`  Patient: ${appointment.users.full_name} (ID: ${appointment.user_id})`);
      console.log(`  Doctor: ${appointment.doctors?.users?.full_name || 'N/A'} (ID: ${appointment.doctor_id})`);
      console.log(`  Has Recording: ${!!appointment.consultation_recording}`);
      
      if (appointment.consultation_recording) {
        console.log('\n🎙️ Recording details:');
        console.log(`  ID: ${appointment.consultation_recording.id}`);
        console.log(`  Status: ${appointment.consultation_recording.transcription_status}`);
        console.log(`  Audio URL: ${appointment.consultation_recording.audio_url}`);
        console.log(`  Has Transcription: ${!!appointment.consultation_recording.transcription}`);
        console.log(`  Has AI Notes: ${!!appointment.consultation_recording.ai_generated_notes}`);
        console.log(`  Processing Error: ${appointment.consultation_recording.processing_error || 'None'}`);
        console.log(`  Created At: ${appointment.consultation_recording.created_at}`);
        console.log(`  Processing Started: ${appointment.consultation_recording.processing_started_at}`);
        console.log(`  Processing Completed: ${appointment.consultation_recording.processing_completed_at}`);
        
        // Verificar se o prontuário foi criado automaticamente
        const medicalRecordsFromRecording = await prisma.medical_records.findMany({
          where: {
            appointment_id: appointment.id,
            recording_id: appointment.consultation_recording.id
          }
        });
        
        console.log(`\n📄 Medical records created from recording: ${medicalRecordsFromRecording.length}`);
        medicalRecordsFromRecording.forEach((record, i) => {
          console.log(`  Record ${i + 1}:`);
          console.log(`    ID: ${record.id}`);
          console.log(`    Status: ${record.status}`);
          console.log(`    AI Generated: ${record.ai_generated}`);
          console.log(`    Created At: ${record.created_at}`);
        });
      }
      
      console.log(`\n📋 All Medical Records for this appointment: ${appointment.medical_records.length}`);
      appointment.medical_records.forEach((record, i) => {
        console.log(`  Record ${i + 1}: ID ${record.id}, Status: ${record.status}, AI: ${record.ai_generated}`);
      });
      
      // Verificar logs recentes no sistema
      console.log('\n🔍 Checking system logs for recent recordings...');
      const recentRecordings = await prisma.consultation_recordings.findMany({
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          appointments: true
        }
      });
      
      console.log(`\n📼 Recent recordings (last 5):`);
      recentRecordings.forEach((rec, i) => {
        console.log(`  ${i + 1}. Appointment ${rec.appointment_id}: Status ${rec.transcription_status}, Created ${rec.created_at}`);
      });
      
    } else {
      console.log('❌ Appointment 204 not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAppointment204();