import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const MOCK_EMAIL = 'modelo@cnvidas.com.br';
const MOCK_PASSWORD = 'SenhaModelo2026!';
const MOCK_NAME = 'Carlos Eduardo Silva';
const MOCK_PROFILE_IMAGE = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop';
const MOCK_PHONE = '(11) 98765-4321';
const MOCK_CPF = '12345678901';

async function createMockPatient() {
  try {
    console.log('🔧 Criando usuário modelo para App Store...');

    // Check if mock user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, MOCK_EMAIL))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('✅ Usuário modelo já existe:', MOCK_EMAIL);
      // Let's update it to ensure it has the best plan and the photo
      await db.update(users).set({
        fullName: MOCK_NAME,
        profileImage: MOCK_PROFILE_IMAGE,
        subscriptionPlan: 'ultra_family',
        subscriptionStatus: 'active',
        phone: MOCK_PHONE,
        cpf: MOCK_CPF,
      }).where(eq(users.email, MOCK_EMAIL));
      console.log('✅ Usuário modelo atualizado com os melhores dados e plano.');
      console.log('🔑 Email:', MOCK_EMAIL);
      console.log('🔑 Senha:', MOCK_PASSWORD);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(MOCK_PASSWORD, 10);

    // Create new mock user
    const mockUser = await db.insert(users).values({
      email: MOCK_EMAIL,
      username: 'carlos_modelo',
      password: hashedPassword,
      fullName: MOCK_NAME,
      role: 'patient',
      emailVerified: true,
      subscriptionPlan: 'ultra_family',
      subscriptionStatus: 'active',
      profileImage: MOCK_PROFILE_IMAGE,
      phone: MOCK_PHONE,
      cpf: MOCK_CPF,
      welcomeCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      status: 'active'
    }).returning();

    console.log('✅ Usuário modelo criado com sucesso!');
    console.log('📧 Email:', MOCK_EMAIL);
    console.log('🔑 Senha:', MOCK_PASSWORD);
    console.log('👤 ID:', mockUser[0].id);

  } catch (error) {
    console.error('❌ Erro ao criar usuário modelo:', error.message);
  }
}

createMockPatient().then(() => {
  console.log('🎯 Processo concluído.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
