const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Aplicando migration para atualizar constraints de chave estrangeira...');
    
    // Ler o arquivo de migration
    const migrationFile = path.join(__dirname, 'db/migrations/0015_update_foreign_key_constraints.sql');
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    
    // Executar a migration
    await client.query('BEGIN');
    
    // Dividir em comandos separados (remover o COMMIT do final)
    const commands = migrationSQL
      .replace(/COMMIT;$/, '')
      .split(';')
      .filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'));
    
    for (const command of commands) {
      if (command.trim()) {
        console.log(`Executando: ${command.trim().substring(0, 80)}...`);
        await client.query(command.trim());
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ Migration aplicada com sucesso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao aplicar migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  applyMigration()
    .then(() => {
      console.log('🎉 Migration concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na migration:', error);
      process.exit(1);
    });
}

module.exports = { applyMigration };