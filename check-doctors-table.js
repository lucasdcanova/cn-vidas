require('dotenv').config();
const { Pool } = require('pg');

async function checkDoctorsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Verificando estrutura da tabela doctors...\n');

    // Verificar colunas da tabela doctors
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'doctors'
      ORDER BY ordinal_position
    `);

    console.log('📊 Colunas da tabela doctors:\n');
    console.log('Nome da Coluna             | Tipo de Dados    | Nullable');
    console.log('---------------------------|------------------|----------');
    
    columnsResult.rows.forEach(row => {
      console.log(
        `${row.column_name.padEnd(26)} | ` +
        `${row.data_type.padEnd(16)} | ` +
        `${row.is_nullable}`
      );
    });

    // Verificar se campos do onboarding existem
    const requiredFields = [
      'onboarding_completed',
      'welcome_completed',
      'consultation_price_description',
      'full_bio',
      'areas_of_expertise',
      'languages_spoken',
      'achievements'
    ];

    console.log('\n🔍 Verificando campos do onboarding:\n');
    
    for (const field of requiredFields) {
      const fieldExists = columnsResult.rows.some(row => row.column_name === field);
      console.log(`${field}: ${fieldExists ? '✅ Existe' : '❌ NÃO EXISTE'}`);
    }

    // Verificar médico específico (ID 108)
    console.log('\n🔍 Verificando médico ID 108 (dr@lucascanova.com):\n');
    
    const doctorResult = await pool.query(`
      SELECT d.*, u.email, u.full_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE u.id = 108
    `);

    if (doctorResult.rows.length > 0) {
      const doctor = doctorResult.rows[0];
      console.log('✅ Registro encontrado!');
      console.log('Doctor ID:', doctor.id);
      console.log('User ID:', doctor.user_id);
      console.log('Email:', doctor.email);
      console.log('Nome:', doctor.full_name);
      console.log('License Number:', doctor.license_number);
      console.log('Onboarding Completed:', doctor.onboarding_completed);
      console.log('Welcome Completed:', doctor.welcome_completed);
    } else {
      console.log('❌ Registro NÃO encontrado!');
    }

  } catch (err) {
    console.error('❌ Erro ao verificar tabela:', err);
    console.error('\nDetalhes do erro:', err.message);
  } finally {
    await pool.end();
  }
}

// Executar verificação
checkDoctorsTable();