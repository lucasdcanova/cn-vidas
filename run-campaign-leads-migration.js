const { neon } = require('@neondatabase/serverless');

// Verificar DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL nao esta definida');
  process.exit(1);
}

// Configuracao do banco de dados usando Neon
const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Verificando/criando tabela campaign_leads...');

    // Verificar se a tabela ja existe
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'campaign_leads'
      );
    `;

    if (tableExists[0].exists) {
      console.log('Tabela campaign_leads ja existe.');
      return;
    }

    console.log('Criando tabela campaign_leads...');

    // Criar a tabela
    await sql`
      CREATE TABLE IF NOT EXISTS campaign_leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(20) NOT NULL,
        campaign VARCHAR(100) NOT NULL DEFAULT 'taquari-hospital-sao-jose',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `;

    console.log('Criando indice em campaign...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign ON campaign_leads(campaign)
    `;

    console.log('Criando indice em created_at...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_campaign_leads_created_at ON campaign_leads(created_at DESC)
    `;

    console.log('Tabela campaign_leads criada com sucesso!');

  } catch (error) {
    // Se o erro for que a tabela ja existe, tudo bem
    if (error.message?.includes('already exists')) {
      console.log('Tabela ou indice ja existe.');
    } else {
      console.error('Erro ao executar migration:', error);
      throw error;
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration concluida!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Falha na migration:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
