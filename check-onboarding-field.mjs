import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function checkOnboardingField() {
  try {
    console.log('🔍 Verificando estrutura da tabela doctors...\n');
    
    // Verificar as colunas da tabela doctors
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'doctors' 
      AND column_name IN ('onboarding_completed', 'welcome_completed')
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colunas encontradas:');
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
      });
    } else {
      console.log('  ❌ Nenhuma das colunas onboarding_completed ou welcome_completed foi encontrada!');
      console.log('\n⚠️  O campo onboarding_completed precisa ser adicionado à tabela doctors.');
      console.log('Execute a migração: node run-onboarding-migration.js');
    }
    
    // Verificar alguns registros
    console.log('\n📊 Verificando alguns registros de médicos:');
    const doctors = await db.execute(sql`
      SELECT id, user_id, onboarding_completed, welcome_completed 
      FROM doctors 
      LIMIT 5
    `);
    
    if (doctors.rows.length > 0) {
      doctors.rows.forEach(doc => {
        console.log(`  - Doctor ID ${doc.id} (user_id: ${doc.user_id}): onboarding_completed = ${doc.onboarding_completed}, welcome_completed = ${doc.welcome_completed}`);
      });
    } else {
      console.log('  Nenhum médico encontrado na tabela.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error.message);
    if (error.message.includes('column "onboarding_completed" does not exist')) {
      console.log('\n⚠️  O campo onboarding_completed não existe na tabela doctors!');
      console.log('Execute a migração: node run-onboarding-migration.js');
    }
  } finally {
    process.exit(0);
  }
}

checkOnboardingField();