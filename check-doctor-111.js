const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://cnvidas_user:Y5uZjdOAHtQ6JWahSBNm5qvwQIbyuxKv@dpg-ct9u3ctds78s73e0s980-a.oregon-postgres.render.com/cnvidas',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDoctor() {
  try {
    console.log('🔍 Verificando médico com userId 111...\n');

    // 1. Buscar usuário
    const userResult = await pool.query(`
      SELECT id, email, role, full_name 
      FROM users 
      WHERE id = 111
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário ID 111 não encontrado');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ Usuário encontrado:', user);

    // 2. Buscar perfil de médico
    const doctorResult = await pool.query(`
      SELECT id, user_id, specialization, license_number, onboarding_completed, welcome_completed, status
      FROM doctors 
      WHERE user_id = 111
    `);

    if (doctorResult.rows.length === 0) {
      console.log('❌ Perfil de médico não encontrado para userId 111');
      
      // Verificar se existe algum médico com email similar
      const similarDoctors = await pool.query(`
        SELECT d.*, u.email, u.id as user_id_real
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE u.email LIKE '%lucascanova%'
        ORDER BY d.id
      `);
      
      console.log('\n🔍 Médicos com email similar:');
      similarDoctors.rows.forEach(doc => {
        console.log(`- User ID: ${doc.user_id_real}, Email: ${doc.email}, Doctor ID: ${doc.id}, Onboarding: ${doc.onboarding_completed}`);
      });
      
      return;
    }

    const doctor = doctorResult.rows[0];
    console.log('\n✅ Médico encontrado:', doctor);

    // 3. Informações detalhadas
    console.log('\n📋 Status do onboarding:');
    console.log('- onboarding_completed:', doctor.onboarding_completed);
    console.log('- welcome_completed:', doctor.welcome_completed);
    console.log('- status:', doctor.status);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

checkDoctor();