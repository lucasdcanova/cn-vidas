const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://cnvidas_user:Y5uZjdOAHtQ6JWahSBNm5qvwQIbyuxKv@dpg-ct9u3ctds78s73e0s980-a.oregon-postgres.render.com/cnvidas',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkPartnerComplete() {
  try {
    console.log('🔍 Verificando dados completos do parceiro...\n');

    // 1. Buscar parceiro
    const partnerResult = await pool.query(`
      SELECT id, user_id, business_name, trading_name, business_type, cnpj, phone, status
      FROM partners 
      WHERE user_id = 6
    `);
    
    if (partnerResult.rows.length === 0) {
      console.log('❌ Parceiro não encontrado');
      return;
    }

    const partner = partnerResult.rows[0];
    console.log('✅ Parceiro encontrado:', partner);

    // Verificar campos obrigatórios para onboarding
    const isProfileIncomplete = !partner.business_name || 
                               !partner.business_type || 
                               !partner.cnpj ||
                               !partner.phone;
    
    console.log('\n📋 Verificação de campos obrigatórios:');
    console.log('- business_name:', partner.business_name ? '✅' : '❌');
    console.log('- business_type:', partner.business_type ? '✅' : '❌');
    console.log('- cnpj:', partner.cnpj ? '✅' : '❌');
    console.log('- phone:', partner.phone ? '✅' : '❌');
    console.log('Perfil incompleto?', isProfileIncomplete);

    // 2. Buscar endereços
    const addressResult = await pool.query(`
      SELECT id, name, city, state, is_primary
      FROM partner_addresses 
      WHERE partner_id = $1
    `, [partner.id]);

    console.log(`\n📍 Endereços encontrados: ${addressResult.rows.length}`);
    addressResult.rows.forEach((addr, i) => {
      console.log(`Endereço ${i+1}:`, addr);
    });

    // 3. Buscar serviços ativos
    const servicesResult = await pool.query(`
      SELECT id, name, is_active
      FROM partner_services 
      WHERE partner_id = $1
    `, [partner.id]);

    console.log(`\n📦 Serviços encontrados: ${servicesResult.rows.length}`);
    const activeServices = servicesResult.rows.filter(s => s.is_active);
    console.log(`📦 Serviços ativos: ${activeServices.length}`);
    
    servicesResult.rows.forEach((service, i) => {
      console.log(`Serviço ${i+1}:`, service);
    });

    // Resumo
    console.log('\n🎯 RESUMO DO ONBOARDING:');
    console.log('- Perfil completo:', !isProfileIncomplete ? '✅' : '❌');
    console.log('- Tem endereços:', addressResult.rows.length > 0 ? '✅' : '❌');
    console.log('- Tem serviços ativos:', activeServices.length > 0 ? '✅' : '❌');
    
    const needsOnboarding = isProfileIncomplete || addressResult.rows.length === 0 || activeServices.length === 0;
    console.log('\n🚦 Precisa fazer onboarding?', needsOnboarding ? 'SIM ❌' : 'NÃO ✅');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

checkPartnerComplete();