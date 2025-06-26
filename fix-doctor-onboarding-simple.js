const postgres = require('postgres');

// Criar conexão com o banco
const sql = postgres('postgresql://neondb_owner:npg_h9JvDZzKpIw6@ep-wandering-dawn-acwbhdh4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function fixDoctorOnboarding() {
  try {
    console.log('🔧 Corrigindo status de onboarding do Dr. Lucas Dickel Canova...\n');
    
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
      console.log('⚠️  Não é possível marcar onboarding como completo.');
      console.log('   Campos obrigatórios faltando:', missingFields.join(', '));
      return;
    }
    
    // Se já está marcado como completo, avisar
    if (doctor.onboarding_completed) {
      console.log('✅ Onboarding já está marcado como completo!');
      return;
    }
    
    // Atualizar onboarding_completed para true
    console.log('📝 Atualizando onboarding_completed para true...');
    
    await sql`
      UPDATE doctors 
      SET 
        onboarding_completed = true,
        updated_at = NOW()
      WHERE id = ${doctor.id}
    `;
    
    console.log('✅ Status de onboarding atualizado com sucesso!');
    console.log('   O Dr. Lucas não deve mais ser redirecionado para a tela de onboarding.');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir onboarding:', error);
  } finally {
    await sql.end();
  }
}

fixDoctorOnboarding();