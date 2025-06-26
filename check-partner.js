const postgres = require('postgres');

// Criar conexão com o banco
const sql = postgres('postgresql://neondb_owner:npg_h9JvDZzKpIw6@ep-wandering-dawn-acwbhdh4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function checkPartner() {
  try {
    console.log('🔍 Verificando parceiro Lucas Canova...\n');
    
    // Buscar o usuário
    const users = await sql`
      SELECT * FROM users 
      WHERE email = 'lucas.canova@me.com' 
      LIMIT 1
    `;
    
    if (!users || users.length === 0) {
      console.log('❌ Usuário não encontrado com email: lucas.canova@me.com');
      return;
    }
    
    const user = users[0];
    console.log('✅ Usuário encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.full_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log('');
    
    // Buscar o perfil de parceiro
    const partners = await sql`
      SELECT * FROM partners 
      WHERE user_id = ${user.id} 
      LIMIT 1
    `;
    
    if (!partners || partners.length === 0) {
      console.log('❌ Perfil de parceiro não encontrado para o usuário ID:', user.id);
      console.log('\n🔧 Para corrigir, execute: npm run create-partner');
      return;
    }
    
    const partner = partners[0];
    console.log('📋 Perfil de parceiro encontrado:');
    console.log(`   Partner ID: ${partner.id}`);
    console.log(`   User ID: ${partner.user_id}`);
    console.log(`   Razão Social: ${partner.business_name || 'NÃO DEFINIDA'}`);
    console.log(`   Nome Fantasia: ${partner.trading_name || 'NÃO DEFINIDO'}`);
    console.log(`   CNPJ: ${partner.cnpj || 'NÃO DEFINIDO'}`);
    console.log(`   Status: ${partner.status || 'NÃO DEFINIDO'}`);
    console.log(`   Criado em: ${partner.created_at}`);
    console.log('');
    
    // Buscar serviços do parceiro
    const services = await sql`
      SELECT COUNT(*) as total FROM partner_services 
      WHERE partner_id = ${partner.id}
    `;
    
    console.log(`📦 Total de serviços cadastrados: ${services[0].total}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar parceiro:', error);
  } finally {
    await sql.end();
  }
}

checkPartner();