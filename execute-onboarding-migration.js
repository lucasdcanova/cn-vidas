import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Executando migração do campo onboarding_completed...\n');

try {
  // Ler o arquivo SQL
  const sqlPath = path.join(__dirname, 'add_onboarding_completed_field.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Arquivo SQL não encontrado:', sqlPath);
    process.exit(1);
  }

  console.log('📄 Arquivo SQL encontrado:', sqlPath);
  
  // Executar o comando npx drizzle-kit push para aplicar as mudanças
  console.log('\n🚀 Aplicando migração...');
  execSync('npm run db:push', { stdio: 'inherit' });
  
  console.log('\n✅ Migração executada com sucesso!');
  console.log('📋 O campo onboarding_completed foi adicionado à tabela doctors.');
  
} catch (error) {
  console.error('\n❌ Erro ao executar migração:', error.message);
  console.log('\n💡 Tente executar manualmente:');
  console.log('   npm run db:push');
  process.exit(1);
}