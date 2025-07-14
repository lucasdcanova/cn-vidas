import { sql } from "drizzle-orm";
import { db } from "./server/db";
import { 
  partners, 
  partnerSubscriptionPlans,
  partnerSubscriptions,
  partnerCollaborators,
  partnerBillingHistory 
} from "./shared/schema";
import fs from "fs";
import path from "path";

async function runMigration() {
  console.log("🚀 Iniciando migração B2B para parceiros...");
  
  try {
    // 1. Ler e executar o arquivo SQL de migração
    const migrationPath = path.join(__dirname, "db/migrations/0002_add_partner_b2b_tables.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    
    console.log("📄 Executando SQL de migração...");
    await db.execute(sql.raw(migrationSQL));
    console.log("✅ Tabelas B2B criadas com sucesso!");
    
    // 2. Verificar se os planos foram criados
    const plans = await db.select().from(partnerSubscriptionPlans);
    console.log(`📋 ${plans.length} planos empresariais encontrados`);
    
    if (plans.length === 0) {
      console.log("❌ Nenhum plano encontrado. Verifique a migração.");
      return;
    }
    
    // 3. Mostrar informações dos planos
    console.log("\n📊 Planos empresariais disponíveis:");
    for (const plan of plans) {
      console.log(`- ${plan.planName} (${plan.planType}): R$ ${plan.monthlyPrice}/mês`);
      console.log(`  Max colaboradores: ${plan.maxCollaborators || 'Ilimitado'}`);
      console.log(`  Taxa de comissão: ${plan.commissionRate}%`);
      console.log(`  Recursos: ${JSON.stringify(plan.features)}`);
      console.log("");
    }
    
    // 4. Verificar estrutura das tabelas
    console.log("\n🔍 Verificando estrutura das tabelas criadas...");
    
    const tableChecks = [
      { name: "partner_subscription_plans", query: "SELECT * FROM partner_subscription_plans LIMIT 1" },
      { name: "partner_subscriptions", query: "SELECT * FROM partner_subscriptions LIMIT 1" },
      { name: "partner_collaborators", query: "SELECT * FROM partner_collaborators LIMIT 1" },
      { name: "partner_billing_history", query: "SELECT * FROM partner_billing_history LIMIT 1" }
    ];
    
    for (const check of tableChecks) {
      try {
        await db.execute(sql.raw(check.query));
        console.log(`✅ Tabela ${check.name} criada com sucesso`);
      } catch (error) {
        console.log(`❌ Erro ao verificar tabela ${check.name}:`, error);
      }
    }
    
    // 5. Verificar alterações na tabela partners
    console.log("\n🔍 Verificando campos B2B na tabela partners...");
    const partnerColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'partners' 
      AND column_name IN ('is_enterprise', 'company_name', 'company_document', 'billing_email', 'collaborator_count')
    `);
    
    console.log(`✅ ${partnerColumns.rows.length} campos B2B encontrados na tabela partners`);
    
    console.log("\n✅ Migração B2B para parceiros concluída com sucesso!");
    console.log("\n📝 Próximos passos:");
    console.log("1. Implementar APIs de gestão de colaboradores");
    console.log("2. Criar interface de seleção de planos");
    console.log("3. Adicionar página de colaboradores no dashboard");
    console.log("4. Implementar sistema de convites por email");
    console.log("5. Configurar integração com Stripe para cobrança");
    
  } catch (error) {
    console.error("❌ Erro durante a migração:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Executar a migração
runMigration().catch(console.error);