import { prisma } from '../lib/prisma';

async function fixDoctorProfiles() {
  try {
    console.log('🔍 Procurando por usuários médicos sem perfil...');
    
    // Busca todos os usuários com role 'doctor'
    const doctorUsers = await prisma.users.findMany({
      where: {
        role: 'doctor'
      },
      include: {
        doctors: true
      }
    });

    console.log(`✅ Encontrados ${doctorUsers.length} usuários médicos`);

    // Filtra apenas os que não têm perfil de médico
    const usersWithoutProfile = doctorUsers.filter(user => !user.doctors || user.doctors.length === 0);
    
    if (usersWithoutProfile.length === 0) {
      console.log('✅ Todos os médicos já possuem perfil!');
      return;
    }

    console.log(`⚠️  Encontrados ${usersWithoutProfile.length} médicos sem perfil`);

    // Cria o perfil para cada médico sem perfil
    for (const user of usersWithoutProfile) {
      console.log(`\n👤 Criando perfil para: ${user.username} (${user.email})`);
      
      try {
        const doctor = await prisma.doctors.create({
          data: {
            user_id: user.id,
            name: user.full_name || user.username,
            license_number: user.username, // CRM number
            license_state: 'SP', // Default para São Paulo
            specialties: [],
            bio: '',
            image: user.avatar || '',
            consultation_price: 150.00,
            consultation_duration: 30,
            is_available_for_consultation: false,
            onboarding_completed: false,
            can_prescribe: false,
            can_issue_documents: false,
            accepted_insurance: []
          }
        });
        
        console.log(`✅ Perfil criado com sucesso! ID do médico: ${doctor.id}`);
      } catch (error) {
        console.error(`❌ Erro ao criar perfil para ${user.username}:`, error);
      }
    }

    console.log('\n✅ Processo concluído!');
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa a função
fixDoctorProfiles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });