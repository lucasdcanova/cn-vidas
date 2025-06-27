import 'dotenv/config';

console.log('=== Verificação de Configuração de Autenticação ===\n');

// Verificar variáveis de ambiente críticas
const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE_URL',
  'NODE_ENV'
];

const envStatus: Record<string, boolean> = {};

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const exists = !!value;
  envStatus[varName] = exists;
  
  console.log(`${varName}: ${exists ? '✅ Configurado' : '❌ NÃO CONFIGURADO'}`);
  
  if (varName === 'JWT_SECRET' && exists) {
    console.log(`  - Comprimento: ${value!.length} caracteres`);
    console.log(`  - Parece seguro: ${value!.length >= 32 ? 'Sim' : 'Não (recomendado >= 32 chars)'}`);
  }
});

console.log('\n=== Recomendações ===\n');

if (!envStatus.JWT_SECRET) {
  console.log('⚠️  JWT_SECRET não está configurado!');
  console.log('   Para gerar um seguro, execute:');
  console.log('   openssl rand -base64 32');
  console.log('   E adicione ao .env: JWT_SECRET=valor_gerado');
}

if (!envStatus.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL não está configurado!');
  console.log('   Configure a URL de conexão do PostgreSQL');
}

console.log('\n=== Valores Padrão (se não configurados) ===\n');
console.log(`JWT_SECRET padrão no código: ${!envStatus.JWT_SECRET ? 'REDACTED_JWT_FALLBACK_PLACEHOLDER' : 'N/A - usando valor do .env'}`);

console.log('\n=== Teste de Conexão ao Banco ===\n');

import { pool } from '../db';

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.log('❌ Erro ao conectar ao banco:', err.message);
  } else {
    console.log('✅ Conexão ao banco OK');
    console.log(`   Timestamp do servidor: ${result.rows[0].now}`);
  }
  
  // Encerrar o pool para o script terminar
  pool.end();
});