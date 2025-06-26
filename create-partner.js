const postgres = require('postgres');

// Criar conexão com o banco
const sql = postgres('postgresql://neondb_owner:npg_h9JvDZzKpIw6@ep-wandering-dawn-acwbhdh4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function createPartner() {
  try {
    console.log('🔧 Criando perfil de parceiro para Lucas Canova...\n');
    
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
    console.log('✅ Usuário encontrado:', user.full_name);
    
    // Verificar se já existe parceiro
    const existingPartners = await sql`
      SELECT * FROM partners 
      WHERE user_id = ${user.id} 
      LIMIT 1
    `;
    
    if (existingPartners && existingPartners.length > 0) {
      console.log('⚠️ Já existe um perfil de parceiro para este usuário!');
      return;
    }
    
    // Criar perfil de parceiro
    console.log('📝 Criando perfil de parceiro...');
    
    const newPartner = await sql`
      INSERT INTO partners (
        user_id,
        business_name,
        trading_name,
        cnpj,
        phone,
        email,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${user.id},
        'Lucas Dickel Canova ME',
        'CN Vidas Parceiro',
        '00.000.000/0001-00',
        ${user.phone},
        ${user.email},
        'active',
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    
    console.log('✅ Perfil de parceiro criado com sucesso!');
    console.log('   Partner ID:', newPartner[0].id);
    console.log('   User ID:', newPartner[0].user_id);
    
  } catch (error) {
    console.error('❌ Erro ao criar parceiro:', error);
  } finally {
    await sql.end();
  }
}

createPartner();