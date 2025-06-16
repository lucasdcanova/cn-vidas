const { Client } = require('pg');

async function checkUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/cnvidas'
  });

  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT id, full_name, email, subscription_plan, subscription_status FROM users WHERE email = $1',
      ['lucas.canova@hotmail.com']
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Usuário encontrado:');
      console.log('ID:', user.id);
      console.log('Nome:', user.full_name);
      console.log('Email:', user.email);
      console.log('Plano:', user.subscription_plan);
      console.log('Status:', user.subscription_status);
    } else {
      console.log('❌ Usuário não encontrado');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkUser(); 