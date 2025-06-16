require('dotenv').config();
const { Pool } = require('pg');

async function fixMissingDoctors() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Verificando médicos sem registro na tabela doctors...\n');

    // Primeiro, verificar quais médicos não têm registro
    const checkResult = await pool.query(`
      SELECT u.id, u.email, u.full_name, u.created_at
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor' AND d.id IS NULL
    `);

    if (checkResult.rows.length === 0) {
      console.log('✅ Todos os médicos já possuem registro na tabela doctors!');
      return;
    }

    console.log(`❌ Encontrados ${checkResult.rows.length} médicos sem registro na tabela doctors:\n`);
    checkResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Email: ${row.email}, Nome: ${row.full_name}`);
    });

    console.log('\n🔧 Criando registros faltantes...\n');

    // Inserir registros de médico faltantes
    const insertResult = await pool.query(`
      INSERT INTO doctors (
        user_id, 
        specialization, 
        license_number, 
        biography, 
        education, 
        experience_years, 
        available_for_emergency, 
        consultation_fee, 
        status,
        welcome_completed,
        onboarding_completed,
        created_at,
        updated_at
      )
      SELECT 
        u.id,
        '', -- specialization vazio para ser preenchido no onboarding
        'TEMP-' || u.id || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER, -- license_number temporário único
        '', -- biography vazio
        '', -- education vazio
        0,  -- experience_years
        false, -- available_for_emergency
        0, -- consultation_fee
        'active', -- status
        false, -- welcome_completed
        false, -- onboarding_completed
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor' AND d.id IS NULL
      RETURNING user_id
    `);

    console.log(`✅ Criados ${insertResult.rows.length} registros de médico!\n`);

    // Verificar o resultado final
    const finalResult = await pool.query(`
      SELECT 
        u.id as user_id, 
        u.email, 
        u.full_name,
        d.id as doctor_id,
        d.onboarding_completed,
        d.welcome_completed
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor'
      ORDER BY u.id
    `);

    console.log('📊 Status final de todos os médicos:\n');
    console.log('User ID | Doctor ID | Email                    | Nome                      | Onboarding');
    console.log('--------|-----------|-------------------------|---------------------------|------------');
    
    finalResult.rows.forEach(row => {
      const onboardingStatus = row.onboarding_completed ? '✅ Completo' : '❌ Pendente';
      console.log(
        `${row.user_id.toString().padEnd(7)} | ` +
        `${row.doctor_id.toString().padEnd(9)} | ` +
        `${row.email.padEnd(23)} | ` +
        `${row.full_name.padEnd(25)} | ` +
        `${onboardingStatus}`
      );
    });

    console.log('\n✅ Correção concluída com sucesso!');
    console.log('\n💡 Os médicos com onboarding pendente serão redirecionados para completar seu perfil ao fazer login.');

  } catch (err) {
    console.error('❌ Erro ao executar correção:', err);
    console.error('\nDetalhes do erro:', err.message);
  } finally {
    await pool.end();
  }
}

// Executar a correção
fixMissingDoctors();