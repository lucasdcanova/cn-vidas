const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { doctors, users } = require('./shared/schema');
const { eq, and } = require('drizzle-orm');

// Criar conexão com o banco
const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:pass.0_Q,U,u*k1}Z1234@db.tpbxkstxhvjuemvecgwj.supabase.co:5432/postgres');
const db = drizzle(sql);

async function fixDoctorOnboarding() {
  try {
    console.log('🔧 Corrigindo status de onboarding do Dr. Lucas Dickel Canova...\n');
    
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
      console.log('⚠️  Não é possível marcar onboarding como completo.');
      console.log('   Campos obrigatórios faltando:', missingFields.join(', '));
      return;
    }
    
    // Se já está marcado como completo, avisar
    if (doctor[0].onboardingCompleted) {
      console.log('✅ Onboarding já está marcado como completo!');
      return;
    }
    
    // Atualizar onboardingCompleted para true
    console.log('📝 Atualizando onboardingCompleted para true...');
    
    await db
      .update(doctors)
      .set({ 
        onboardingCompleted: true,
        updatedAt: new Date()
      })
      .where(eq(doctors.id, doctor[0].id));
    
    console.log('✅ Status de onboarding atualizado com sucesso!');
    console.log('   O Dr. Lucas não deve mais ser redirecionado para a tela de onboarding.');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir onboarding:', error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

fixDoctorOnboarding();