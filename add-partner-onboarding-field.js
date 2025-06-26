const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://cnvidas_user:REDACTED_RENDER_POSTGRES_PASSWORD@dpg-ct9u3ctds78s73e0s980-a.oregon-postgres.render.com/cnvidas',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addPartnerOnboardingField() {
  try {
    console.log('🔍 Verificando e adicionando campo onboardingCompleted...\n');

    // 1. Verificar se o campo já existe
    const checkField = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'partners' AND column_name = 'onboarding_completed'
    `);

    if (checkField.rows.length === 0) {
      console.log('📝 Adicionando campo onboarding_completed...');
      await pool.query(`
        ALTER TABLE partners 
        ADD COLUMN onboarding_completed BOOLEAN DEFAULT false NOT NULL
      `);
      console.log('✅ Campo adicionado com sucesso!');
    } else {
      console.log('✅ Campo onboarding_completed já existe');
    }

    // 2. Atualizar parceiro existente (Lucas Canova) que já completou o onboarding
    console.log('\n🔧 Atualizando parceiro existente...');
    
    const updateResult = await pool.query(`
      UPDATE partners 
      SET onboarding_completed = true 
      WHERE user_id = 6
      RETURNING id, user_id, business_name, onboarding_completed
    `);

    if (updateResult.rows.length > 0) {
      console.log('✅ Parceiro atualizado:', updateResult.rows[0]);
    }

    // 3. Verificar todos os parceiros
    console.log('\n📊 Status de todos os parceiros:');
    const allPartners = await pool.query(`
      SELECT p.id, p.user_id, p.business_name, p.onboarding_completed, u.email
      FROM partners p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.id
    `);

    allPartners.rows.forEach(partner => {
      console.log(`- ${partner.business_name} (${partner.email}): onboarding_completed = ${partner.onboarding_completed}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

addPartnerOnboardingField();