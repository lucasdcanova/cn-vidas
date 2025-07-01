const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRecording204() {
  try {
    console.log('🔍 Análise detalhada do problema de gravação da consulta 204...\n');
    
    // 1. Verificar a consulta
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
    
    if (!appointment) {
      console.log('❌ Consulta 204 não encontrada');
      return;
    }

    console.log('📋 DADOS DA CONSULTA:');
    console.log(`  ID: ${appointment.id}`);
    console.log(`  Status: ${appointment.status}`);
    console.log(`  Data: ${appointment.date}`);
    console.log(`  Paciente: ${appointment.users.full_name} (ID: ${appointment.user_id})`);
    console.log(`  Médico: ${appointment.doctors?.users?.full_name || 'N/A'} (ID: ${appointment.doctor_id})`);
    
    // 2. Verificar se há gravação
    console.log('\n🎙️ STATUS DA GRAVAÇÃO:');
    if (appointment.consultation_recording) {
      console.log('  ✅ Gravação encontrada!');
      console.log(`  ID: ${appointment.consultation_recording.id}`);
      console.log(`  Status: ${appointment.consultation_recording.transcription_status}`);
      console.log(`  URL: ${appointment.consultation_recording.audio_url}`);
      console.log(`  Criada em: ${appointment.consultation_recording.created_at}`);
    } else {
      console.log('  ❌ Nenhuma gravação encontrada para esta consulta');
    }
    
    // 3. Verificar logs de upload recentes
    console.log('\n📤 VERIFICANDO UPLOADS RECENTES:');
    
    // Buscar todas as gravações criadas no mesmo dia
    const startOfDay = new Date(appointment.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointment.date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const recordingsOnSameDay = await prisma.consultation_recordings.findMany({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        appointments: {
          select: {
            id: true,
            doctor_id: true
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });
    
    console.log(`  Total de gravações no dia ${appointment.date.toLocaleDateString()}: ${recordingsOnSameDay.length}`);
    recordingsOnSameDay.forEach((rec, i) => {
      console.log(`  ${i + 1}. Consulta ${rec.appointment_id} - Criada às ${rec.created_at.toLocaleTimeString()}`);
    });
    
    // 4. Verificar se o médico tem outras gravações
    console.log('\n👨‍⚕️ GRAVAÇÕES DO MÉDICO:');
    const doctorRecordings = await prisma.consultation_recordings.findMany({
      where: {
        appointments: {
          doctor_id: appointment.doctor_id
        }
      },
      select: {
        id: true,
        appointment_id: true,
        created_at: true,
        transcription_status: true
      },
      orderBy: { created_at: 'desc' },
      take: 5
    });
    
    console.log(`  Total de gravações do médico: ${doctorRecordings.length}`);
    doctorRecordings.forEach((rec, i) => {
      console.log(`  ${i + 1}. Consulta ${rec.appointment_id} - ${rec.created_at.toLocaleString()} - Status: ${rec.transcription_status}`);
    });
    
    // 5. Verificar configurações de privacidade
    console.log('\n⚙️ CONFIGURAÇÕES DE PRIVACIDADE:');
    
    // Paciente
    const patientSettings = await prisma.user_settings.findFirst({
      where: { user_id: appointment.user_id }
    });
    console.log(`  Paciente permite gravação: ${!patientSettings || patientSettings.privacy?.allowConsultationRecording !== false}`);
    
    // Médico
    const doctorSettings = await prisma.user_settings.findFirst({
      where: { user_id: appointment.doctors?.user_id }
    });
    console.log(`  Médico permite gravação: ${!doctorSettings || doctorSettings.privacy?.allowConsultationRecording !== false}`);
    
    // 6. Possíveis causas
    console.log('\n🔎 POSSÍVEIS CAUSAS DO PROBLEMA:');
    
    if (!appointment.consultation_recording) {
      console.log('  1. A gravação pode não ter sido iniciada:');
      console.log('     - Problema com permissões do navegador');
      console.log('     - Erro JavaScript no frontend');
      console.log('     - Componente RecordingControls não renderizado');
      console.log('     - Condição shouldAutoRecord retornou false');
      
      console.log('\n  2. A gravação foi iniciada mas não foi salva:');
      console.log('     - Erro no upload do arquivo');
      console.log('     - Falha na requisição HTTP');
      console.log('     - Timeout durante o upload');
      console.log('     - Erro de autenticação');
      
      console.log('\n  3. Upload foi feito mas falhou no servidor:');
      console.log('     - Erro ao salvar no banco de dados');
      console.log('     - Falha ao mover arquivo para storage');
      console.log('     - Validação falhou (ex: consulta já tem gravação)');
    }
    
    // 7. Recomendações
    console.log('\n💡 RECOMENDAÇÕES PARA DEBUG:');
    console.log('  1. Verificar o console do navegador durante a consulta');
    console.log('  2. Procurar por logs com "[RecordingControls]" ou "[Recording Upload]"');
    console.log('  3. Verificar a aba Network para requisições POST para /api/consultation-recordings/upload');
    console.log('  4. Verificar se o componente RecordingControls está sendo renderizado');
    console.log('  5. Confirmar que autoStart=true está sendo passado para o componente');
    console.log('  6. Verificar logs do servidor para erros de upload');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRecording204();