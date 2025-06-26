const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://cnvidas_user:Y5uZjdOAHtQ6JWahSBNm5qvwQIbyuxKv@dpg-ct9u3ctds78s73e0s980-a.oregon-postgres.render.com/cnvidas',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDoctor() {
  try {
    console.log('🔍 Verificando médico Dr. Lucas Dickel Canova (dr@lucascanova.com)...\n');

    // 1. Buscar usuário por email
    const userResult = await pool.query(`
      SELECT id, email, role, full_name, created_at
      FROM users 
      WHERE email = 'dr@lucascanova.com'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário com email dr@lucascanova.com não encontrado');
      
      // Listar todos os usuários com email contendo lucascanova
      const similarUsers = await pool.query(`
        SELECT id, email, role, full_name 
        FROM users 
        WHERE email LIKE '%lucascanova%'
        ORDER BY id
      `);
      
      console.log('\n🔍 Usuários com email similar:');
      similarUsers.rows.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Nome: ${user.full_name}`);
      });
      
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      createdAt: user.created_at
    });

    // 2. Buscar perfil de médico
    const doctorResult = await pool.query(`
      SELECT 
        id, 
        user_id, 
        specialization, 
        license_number, 
        onboarding_completed, 
        welcome_completed, 
        status,
        education,
        consultation_fee,
        pix_key,
        bank_name,
        created_at,
        updated_at
      FROM doctors 
      WHERE user_id = $1
    `, [user.id]);

    if (doctorResult.rows.length === 0) {
      console.log('\n❌ Perfil de médico não encontrado para este usuário');
      console.log('⚠️  Isso pode explicar o erro 404 ao buscar /api/doctors/profile');
      
      // Criar perfil de médico se não existir
      console.log('\n🔧 Criando perfil de médico...');
      
      const insertResult = await pool.query(`
        INSERT INTO doctors (
          user_id, 
          full_name, 
          email, 
          license_number,
          onboarding_completed,
          status
        ) 
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, user_id, onboarding_completed
      `, [
        user.id,
        user.full_name,
        user.email,
        'CRM-TO BE DEFINED',
        false,
        'active'
      ]);
      
      console.log('✅ Perfil de médico criado:', insertResult.rows[0]);
      return;
    }

    const doctor = doctorResult.rows[0];
    console.log('\n✅ Médico encontrado:', {
      id: doctor.id,
      userId: doctor.user_id,
      specialization: doctor.specialization,
      licenseNumber: doctor.license_number,
      status: doctor.status
    });

    // 3. Informações detalhadas sobre onboarding
    console.log('\n📋 Status do onboarding:');
    console.log('- onboarding_completed:', doctor.onboarding_completed, `(tipo: ${typeof doctor.onboarding_completed})`);
    console.log('- welcome_completed:', doctor.welcome_completed);
    console.log('- status:', doctor.status);
    
    console.log('\n📄 Campos do perfil:');
    console.log('- specialization:', doctor.specialization || '❌ VAZIO');
    console.log('- education:', doctor.education || '❌ VAZIO');
    console.log('- consultation_fee:', doctor.consultation_fee || '❌ VAZIO');
    console.log('- pix_key:', doctor.pix_key || '❌ VAZIO');
    console.log('- bank_name:', doctor.bank_name || '❌ VAZIO');
    
    const isProfileComplete = !!(
      doctor.specialization && 
      doctor.education &&
      doctor.consultation_fee &&
      doctor.pix_key &&
      doctor.bank_name
    );
    
    console.log('\n✅ Perfil completo?', isProfileComplete ? 'SIM' : 'NÃO');
    
    // 4. Atualizar onboarding_completed se necessário
    if (doctor.onboarding_completed !== true && isProfileComplete) {
      console.log('\n🔧 Atualizando onboarding_completed para true...');
      
      const updateResult = await pool.query(`
        UPDATE doctors 
        SET onboarding_completed = true, updated_at = NOW()
        WHERE id = $1
        RETURNING id, onboarding_completed
      `, [doctor.id]);
      
      console.log('✅ Onboarding atualizado:', updateResult.rows[0]);
    } else if (doctor.onboarding_completed === true) {
      console.log('\n✅ Onboarding já está marcado como completo');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

checkDoctor();