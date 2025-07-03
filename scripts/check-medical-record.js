const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const appointmentId = process.argv[2] || 238;

async function check() {
  const record = await prisma.medical_records.findFirst({
    where: { appointment_id: parseInt(appointmentId) }
  });
  
  console.log(`\n🔍 Verificando prontuário para consulta ${appointmentId}...`);
  console.log('Prontuário encontrado:', record ? '✅ SIM' : '❌ NÃO');
  
  if (record) {
    console.log('\n📋 Detalhes do prontuário:');
    console.log('  ID:', record.id);
    console.log('  Status:', record.status);
    console.log('  Doctor ID:', record.doctor_id);
    console.log('  Patient ID:', record.patient_id);
    console.log('  Criado em:', record.created_at);
    console.log('  Conteúdo:', record.content ? record.content.substring(0, 100) + '...' : 'Vazio');
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());