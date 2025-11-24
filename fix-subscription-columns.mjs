import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Carregar variáveis de ambiente
config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL não está definida');
}

const sql = neon(databaseUrl);

async function fixSubscriptionColumns() {
  try {
    console.log('🔧 Corrigindo colunas de assinatura...\n');
    
    // user_subscriptions
    console.log('📋 Verificando tabela user_subscriptions...');
    
    try {
      await sql`ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false NOT NULL`;
      console.log('✅ cancel_at_period_end');
    } catch (err) {
      console.log('ℹ️  cancel_at_period_end:', err.message);
    }

    try {
      await sql`ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS scheduled_plan_id INTEGER REFERENCES subscription_plans(id)`;
      console.log('✅ scheduled_plan_id');
    } catch (err) {
      console.log('ℹ️  scheduled_plan_id:', err.message);
    }

    try {
      await sql`ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS scheduled_plan_applied BOOLEAN DEFAULT false NOT NULL`;
      console.log('✅ scheduled_plan_applied');
    } catch (err) {
      console.log('ℹ️  scheduled_plan_applied:', err.message);
    }

    // subscription_plans
    console.log('\n📋 Verificando tabela subscription_plans...');
    try {
      await sql`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false`;
      console.log('✅ is_default');
    } catch (err) {
      console.log('ℹ️  is_default:', err.message);
    }
    
    console.log('\n🎉 Correções concluídas!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixSubscriptionColumns();
