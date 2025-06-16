import { prisma } from '../lib/prisma';

async function checkDoctorData() {
  try {
    console.log('🔍 Verificando dados dos médicos no banco...\n');
    
    // Busca todos os médicos
    const doctors = await prisma.doctors.findMany({
      include: {
        users: true
      },
      orderBy: {
        id: 'desc'
      },
      take: 5 // Últimos 5 médicos
    });

    console.log(`📊 Total de médicos encontrados: ${doctors.length}\n`);

    for (const doctor of doctors) {
      console.log('═'.repeat(60));
      console.log(`👤 Médico ID: ${doctor.id}`);
      console.log(`📧 Email: ${doctor.users.email}`);
      console.log(`👤 Nome: ${doctor.users.full_name}`);
      console.log('\n📋 Dados do Perfil:');
      console.log(`  - Especialização: ${doctor.specialization || '❌ VAZIO'}`);
      console.log(`  - CRM (license_number): ${doctor.license_number || '❌ VAZIO'}`);
      console.log(`  - Biografia: ${doctor.biography ? '✅ Preenchida' : '❌ VAZIA'}`);
      console.log(`  - Educação: ${doctor.education || '❌ VAZIO'}`);
      console.log(`  - Anos de Experiência: ${doctor.experience_years || '❌ VAZIO'}`);
      console.log(`  - Valor da Consulta: ${doctor.consultation_fee || '❌ VAZIO'}`);
      console.log(`  - Onboarding Completo: ${doctor.onboarding_completed ? '✅ SIM' : '❌ NÃO'}`);
      console.log('\n💰 Dados Financeiros:');
      console.log(`  - Tipo Chave PIX: ${doctor.pix_key_type || '❌ VAZIO'}`);
      console.log(`  - Chave PIX: ${doctor.pix_key ? '✅ Preenchida' : '❌ VAZIA'}`);
      console.log(`  - Banco: ${doctor.bank_name || '❌ VAZIO'}`);
      console.log(`  - Tipo de Conta: ${doctor.account_type || '❌ VAZIO'}`);
      console.log('\n📅 Datas:');
      console.log(`  - Criado em: ${doctor.created_at}`);
      console.log(`  - Atualizado em: ${doctor.updated_at}`);
      console.log('═'.repeat(60));
      console.log('\n');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa a verificação
checkDoctorData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });