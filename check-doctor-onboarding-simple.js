const postgres = require('postgres');

// Criar conexão com o banco
const sql = postgres('postgresql://neondb_owner:npg_h9JvDZzKpIw6@ep-wandering-dawn-acwbhdh4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function checkDoctorOnboarding() {
  try {
    console.log('🔍 Verificando status de onboarding do Dr. Lucas Dickel Canova...\n');
    
    // Buscar o usuário
    const users = await sql`
      SELECT * FROM users 
      WHERE email = 'dr@lucascanova.com' 
      LIMIT 1
    `;
    
    if (!users || users.length === 0) {
      console.log('❌ Usuário não encontrado com email: dr@lucascanova.com');
      return;
    }
    
    const user = users[0];
    console.log('✅ Usuário encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.full_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log('');
    
    // Buscar o perfil de médico
    const doctors = await sql`
      SELECT * FROM doctors 
      WHERE user_id = ${user.id} 
      LIMIT 1
    `;
    
    if (!doctors || doctors.length === 0) {
      console.log('❌ Perfil de médico não encontrado para o usuário ID:', user.id);
      return;
    }
    
    const doctor = doctors[0];
    console.log('📋 Perfil de médico encontrado:');
    console.log(`   Doctor ID: ${doctor.id}`);
    console.log(`   Especialização: ${doctor.specialization || 'NÃO DEFINIDA'}`);
    console.log(`   CRM: ${doctor.license_number || 'NÃO DEFINIDO'}`);
    console.log(`   Educação: ${doctor.education || 'NÃO DEFINIDA'}`);
    console.log(`   Taxa de consulta: ${doctor.consultation_fee || 'NÃO DEFINIDA'}`);
    console.log(`   Chave PIX: ${doctor.pix_key ? '***' + doctor.pix_key.slice(-4) : 'NÃO DEFINIDA'}`);
    console.log(`   Banco: ${doctor.bank_name || 'NÃO DEFINIDO'}`);
    console.log(`   onboarding_completed: ${doctor.onboarding_completed}`);
    console.log(`   welcome_completed: ${doctor.welcome_completed}`);
    console.log('');
    
    // Verificar se todos os campos obrigatórios estão preenchidos
    const requiredFields = {
      specialization: doctor.specialization,
      license_number: doctor.license_number,
      education: doctor.education,
      consultation_fee: doctor.consultation_fee,
      pix_key: doctor.pix_key,
      bank_name: doctor.bank_name
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      console.log('⚠️  Campos obrigatórios faltando:', missingFields.join(', '));
    } else {
      console.log('✅ Todos os campos obrigatórios estão preenchidos');
    }
    
    // Se onboarding_completed é false mas todos os campos estão preenchidos, sugerir correção
    if (!doctor.onboarding_completed && missingFields.length === 0) {
      console.log('\n🔧 ATENÇÃO: O perfil está completo mas onboarding_completed está como false!');
      console.log('   Isso está causando o redirecionamento para a tela de onboarding.');
      console.log('   Para corrigir, execute: npm run fix-doctor-onboarding');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar onboarding:', error);
  } finally {
    await sql.end();
  }
}

checkDoctorOnboarding();