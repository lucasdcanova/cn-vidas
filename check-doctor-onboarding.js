const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { doctors, users } = require('./shared/schema');
const { eq, and } = require('drizzle-orm');

// Criar conexão com o banco
const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:pass.0_Q,U,u*k1}Z1234@db.tpbxkstxhvjuemvecgwj.supabase.co:5432/postgres');
const db = drizzle(sql);

async function checkDoctorOnboarding() {
  try {
    console.log('🔍 Verificando status de onboarding do Dr. Lucas Dickel Canova...\n');
    
    // Buscar o usuário
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, 'lucas@dickelcanova.com.br'))
      .limit(1);
    
    if (!user || user.length === 0) {
      console.log('❌ Usuário não encontrado com email: lucas@dickelcanova.com.br');
      return;
    }
    
    console.log('✅ Usuário encontrado:');
    console.log(`   ID: ${user[0].id}`);
    console.log(`   Nome: ${user[0].fullName}`);
    console.log(`   Email: ${user[0].email}`);
    console.log(`   Role: ${user[0].role}`);
    console.log('');
    
    // Buscar o perfil de médico
    const doctor = await db
      .select()
      .from(doctors)
      .where(eq(doctors.userId, user[0].id))
      .limit(1);
    
    if (!doctor || doctor.length === 0) {
      console.log('❌ Perfil de médico não encontrado para o usuário ID:', user[0].id);
      return;
    }
    
    console.log('📋 Perfil de médico encontrado:');
    console.log(`   Doctor ID: ${doctor[0].id}`);
    console.log(`   Especialização: ${doctor[0].specialization || 'NÃO DEFINIDA'}`);
    console.log(`   CRM: ${doctor[0].licenseNumber || 'NÃO DEFINIDO'}`);
    console.log(`   Educação: ${doctor[0].education || 'NÃO DEFINIDA'}`);
    console.log(`   Taxa de consulta: ${doctor[0].consultationFee || 'NÃO DEFINIDA'}`);
    console.log(`   Chave PIX: ${doctor[0].pixKey ? '***' + doctor[0].pixKey.slice(-4) : 'NÃO DEFINIDA'}`);
    console.log(`   Banco: ${doctor[0].bankName || 'NÃO DEFINIDO'}`);
    console.log(`   onboardingCompleted: ${doctor[0].onboardingCompleted}`);
    console.log(`   welcomeCompleted: ${doctor[0].welcomeCompleted}`);
    console.log('');
    
    // Verificar se todos os campos obrigatórios estão preenchidos
    const requiredFields = {
      specialization: doctor[0].specialization,
      licenseNumber: doctor[0].licenseNumber,
      education: doctor[0].education,
      consultationFee: doctor[0].consultationFee,
      pixKey: doctor[0].pixKey,
      bankName: doctor[0].bankName
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      console.log('⚠️  Campos obrigatórios faltando:', missingFields.join(', '));
    } else {
      console.log('✅ Todos os campos obrigatórios estão preenchidos');
    }
    
    // Se onboardingCompleted é false mas todos os campos estão preenchidos, sugerir correção
    if (!doctor[0].onboardingCompleted && missingFields.length === 0) {
      console.log('\n🔧 ATENÇÃO: O perfil está completo mas onboardingCompleted está como false!');
      console.log('   Isso está causando o redirecionamento para a tela de onboarding.');
      console.log('   Para corrigir, execute: npm run fix-doctor-onboarding');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar onboarding:', error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

checkDoctorOnboarding();