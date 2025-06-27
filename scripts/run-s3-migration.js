const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🚀 Executando migração para tabelas de storage seguro...\n');

    // Criar tabela secure_files
    await pool.query(`
      CREATE TABLE IF NOT EXISTS secure_files (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_key VARCHAR(500) NOT NULL UNIQUE,
        file_type VARCHAR(50) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        content_type VARCHAR(100) NOT NULL,
        size_bytes BIGINT NOT NULL,
        bucket_name VARCHAR(255) NOT NULL,
        storage_class VARCHAR(50),
        encryption_type VARCHAR(50),
        is_encrypted BOOLEAN DEFAULT false,
        lgpd_consent BOOLEAN DEFAULT false,
        consent_date TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `);
    console.log('✅ Tabela secure_files criada');

    // Criar tabela audit_logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        file_key VARCHAR(500),
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        metadata JSONB
      )
    `);
    console.log('✅ Tabela audit_logs criada');

    // Criar tabela lgpd_requests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lgpd_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        request_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        metadata JSONB
      )
    `);
    console.log('✅ Tabela lgpd_requests criada');

    // Criar índices
    console.log('\n📇 Criando índices...');
    
    // Índices para secure_files
    await pool.query('CREATE INDEX IF NOT EXISTS idx_secure_files_user_id ON secure_files(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_secure_files_file_type ON secure_files(file_type)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_secure_files_created_at ON secure_files(created_at)');
    console.log('✅ Índices secure_files criados');
    
    // Índices para audit_logs
    await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)');
    console.log('✅ Índices audit_logs criados');
    
    // Índices para lgpd_requests
    await pool.query('CREATE INDEX IF NOT EXISTS idx_lgpd_requests_user_id ON lgpd_requests(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_lgpd_requests_status ON lgpd_requests(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_lgpd_requests_requested_at ON lgpd_requests(requested_at)');
    console.log('✅ Índices lgpd_requests criados');

    console.log('\n✨ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar migração
runMigration().catch(console.error);