const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Running doctor onboarding migration...');

try {
  // Check if the migration file exists
  const migrationPath = path.join(__dirname, 'add_onboarding_completed_field.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  // Run the migration
  execSync(`psql $DATABASE_URL < ${migrationPath}`, { stdio: 'inherit' });
  
  console.log('✅ Migration completed successfully!');
  console.log('📝 Database changes:');
  console.log('   - Added onboarding_completed field to doctors table');
  console.log('   - Added consultation_price_description field');
  console.log('   - Added full_bio field');
  console.log('   - Added areas_of_expertise array field');
  console.log('   - Added languages_spoken array field');
  console.log('   - Added achievements field');
  console.log('   - Updated existing doctors with welcomeCompleted=true to have onboardingCompleted=true');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}