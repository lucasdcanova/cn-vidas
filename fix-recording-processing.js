// Script para corrigir o processamento da gravação que falhou

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRecordingProcessing() {
  const recordingId = 8; // ID da gravação que falhou
  const appointmentId = 217;
  
  try {
    console.log('🔍 Verificando gravação ID:', recordingId);
    
    // Buscar a gravação
    const recording = await prisma.consultation_recordings.findUnique({
      where: { id: recordingId },
      include: {
        appointments: {
          include: {
            users: true,
            doctors: {
              include: {
                users: true
              }
            }
          }
        }
      }
    });
    
    if (!recording) {
      console.error('❌ Gravação não encontrada');
      return;
    }
    
    console.log('📼 Gravação encontrada:');
    console.log('- ID:', recording.id);
    console.log('- Appointment ID:', recording.appointment_id);
    console.log('- Doctor ID:', recording.doctor_id);
    console.log('- Status de transcrição:', recording.transcription_status);
    console.log('- Erro:', recording.processing_error);
    console.log('- Tem transcrição?', !!recording.transcription);
    console.log('- Tem notas AI?', !!recording.ai_generated_notes);
    
    if (!recording.appointments) {
      console.error('❌ Consulta não encontrada');
      return;
    }
    
    console.log('\n📅 Informações da consulta:');
    console.log('- ID:', recording.appointments.id);
    console.log('- Paciente ID:', recording.appointments.user_id);
    console.log('- Médico ID:', recording.appointments.doctor_id);
    
    // Verificar se já existe prontuário
    const existingRecord = await prisma.medical_records.findFirst({
      where: { appointment_id: appointmentId }
    });
    
    if (existingRecord) {
      console.log('\n✅ Prontuário já existe:', existingRecord.id);
      return;
    }
    
    // Se a gravação tem notas AI mas não tem prontuário, criar um
    if (recording.ai_generated_notes) {
      console.log('\n🎯 Criando prontuário médico a partir das notas AI...');
      
      let aiContent;
      try {
        aiContent = typeof recording.ai_generated_notes === 'string' 
          ? JSON.parse(recording.ai_generated_notes) 
          : recording.ai_generated_notes;
      } catch (e) {
        console.error('❌ Erro ao parsear notas AI:', e);
        aiContent = { data: recording.ai_generated_notes };
      }
      
      const doctorUserId = recording.appointments.doctors?.users?.id;
      
      if (!doctorUserId) {
        console.error('❌ ID do usuário médico não encontrado');
        return;
      }
      
      // Criar prontuário
      const newRecord = await prisma.medical_records.create({
        data: {
          patient_id: recording.appointments.user_id,
          doctor_id: doctorUserId,
          appointment_id: appointmentId,
          recording_id: recording.id,
          content: aiContent,
          status: 'draft',
          ai_generated: true
        }
      });
      
      console.log('✅ Prontuário criado com sucesso:', newRecord.id);
    } else {
      console.log('\n⚠️  Gravação não tem notas AI geradas');
      console.log('Transcrição disponível:', recording.transcription ? 'SIM' : 'NÃO');
      
      // Resetar status para tentar processar novamente
      if (recording.transcription_status === 'failed') {
        console.log('\n🔄 Resetando status da gravação para reprocessamento...');
        await prisma.consultation_recordings.update({
          where: { id: recordingId },
          data: {
            transcription_status: 'pending',
            processing_error: null
          }
        });
        console.log('✅ Status resetado. A gravação será reprocessada.');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRecordingProcessing();