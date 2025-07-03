const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const appointmentId = process.argv[2] || 238;

async function check() {
  const appointment = await prisma.appointments.findUnique({
    where: { id: parseInt(appointmentId) }
  });
  
  console.log(`\n🔍 Verificando consulta ${appointmentId}...`);
  
  if (!appointment) {
    console.log('❌ Consulta não encontrada');
    return;
  }
  
  console.log('✅ Consulta encontrada:');
  console.log('  User ID (paciente):', appointment.user_id);
  console.log('  Doctor ID:', appointment.doctor_id);
  console.log('  Date:', appointment.date);
  console.log('  Type:', appointment.type);
  console.log('  Status:', appointment.status);
  
  // Verificar se o doctor_id existe como usuário
  if (appointment.doctor_id) {
    const doctorUser = await prisma.users.findUnique({
      where: { id: appointment.doctor_id }
    });
    
    console.log('\n🩺 Verificando médico:');
    console.log('  Médico encontrado:', doctorUser ? 'SIM' : 'NÃO');
    if (doctorUser) {
      console.log('  Nome:', doctorUser.full_name);
      console.log('  Email:', doctorUser.email);
      console.log('  Role:', doctorUser.role);
    }
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());