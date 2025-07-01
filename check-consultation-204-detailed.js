const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConsultation204() {
  try {
    console.log('🔍 Análise detalhada da consulta 204...\n');
    
    // Buscar consulta com todas as relações
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

    console.log('📋 Informações da Consulta:');
    console.log(`  ID: ${appointment.id}`);
    console.log(`  Status: ${appointment.status}`);
    console.log(`  Data: ${appointment.date}`);
    console.log(`  Tipo: ${appointment.appointment_type}`);
    console.log(`  Paciente: ${appointment.users.full_name} (ID: ${appointment.user_id})`);
    console.log(`  Médico: ${appointment.doctors?.users?.full_name || 'N/A'} (ID: ${appointment.doctor_id})`);
    console.log(`  Criada em: ${appointment.created_at}`);
    console.log(`  Atualizada em: ${appointment.updated_at}`);
    
    // Verificar se é consulta de emergência
    if (appointment.appointment_type === 'emergency') {
      console.log('\n🚨 É uma consulta de emergência');
    }
    
    // Verificar gravação
    console.log('\n🎙️ Status da Gravação:');
    if (appointment.consultation_recording) {
      console.log('  ✅ Gravação encontrada');
      console.log(`  ID: ${appointment.consultation_recording.id}`);
      console.log(`  Status: ${appointment.consultation_recording.transcription_status}`);
      console.log(`  URL do áudio: ${appointment.consultation_recording.audio_url || 'Não definido'}`);
      console.log(`  Erro de processamento: ${appointment.consultation_recording.processing_error || 'Nenhum'}`);
    } else {
      console.log('  ❌ Nenhuma gravação encontrada');
    }
    
    // Verificar prontuários
    console.log('\n📄 Prontuários Médicos:');
    console.log(`  Total: ${appointment.medical_records.length}`);
    appointment.medical_records.forEach((record, i) => {
      console.log(`  Prontuário ${i + 1}:`);
      console.log(`    ID: ${record.id}`);
      console.log(`    Status: ${record.status}`);
      console.log(`    Gerado por IA: ${record.ai_generated}`);
      console.log(`    Criado em: ${record.created_at}`);
    });
    
    // Verificar configurações do paciente
    console.log('\n⚙️ Verificando configurações do paciente...');
    const patientSettings = await prisma.user_settings.findFirst({
      where: { user_id: appointment.user_id }
    });
    
    if (patientSettings) {
      console.log('  Configurações encontradas:');
      console.log(`  Permite gravação: ${patientSettings.privacy?.allowConsultationRecording !== false}`);
    } else {
      console.log('  Nenhuma configuração encontrada (padrão: permite gravação)');
    }
    
    // Verificar configurações do médico
    if (appointment.doctor_id) {
      console.log('\n⚙️ Verificando configurações do médico...');
      const doctorSettings = await prisma.user_settings.findFirst({
        where: { user_id: appointment.doctor_id }
      });
      
      if (doctorSettings) {
        console.log('  Configurações encontradas:');
        console.log(`  Permite gravação: ${doctorSettings.privacy?.allowConsultationRecording !== false}`);
      } else {
        console.log('  Nenhuma configuração encontrada (padrão: permite gravação)');
      }
    }
    
    // Verificar outras gravações recentes para comparação
    console.log('\n📼 Últimas 5 gravações no sistema:');
    const recentRecordings = await prisma.consultation_recordings.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        appointments: {
          select: {
            id: true,
            appointment_type: true,
            status: true
          }
        }
      }
    });
    
    recentRecordings.forEach((rec, i) => {
      console.log(`  ${i + 1}. Consulta ${rec.appointment_id}:`);
      console.log(`     Tipo: ${rec.appointments.appointment_type}`);
      console.log(`     Status gravação: ${rec.transcription_status}`);
      console.log(`     Criada: ${rec.created_at}`);
    });
    
    // Verificar se há logs de erro relacionados
    console.log('\n🔍 Verificando possíveis erros no upload...');
    
    // Buscar uploads de arquivos recentes
    const recentUploads = await prisma.appointments.findMany({
      where: {
        status: 'completed',
        date: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24 horas
        }
      },
      select: {
        id: true,
        appointment_type: true,
        consultation_recording: {
          select: {
            id: true,
            transcription_status: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 10
    });
    
    console.log(`\n📊 Estatísticas das últimas 24h:`);
    const withRecording = recentUploads.filter(a => a.consultation_recording).length;
    const withoutRecording = recentUploads.filter(a => !a.consultation_recording).length;
    console.log(`  Consultas com gravação: ${withRecording}`);
    console.log(`  Consultas sem gravação: ${withoutRecording}`);
    console.log(`  Taxa de sucesso: ${withRecording > 0 ? ((withRecording / recentUploads.length) * 100).toFixed(1) : 0}%`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConsultation204();