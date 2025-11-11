// @ts-nocheck
import { db } from '../db';
import { users } from '../../shared/schema';
import { hashPassword } from '../auth';
import { eq } from 'drizzle-orm';

export async function createAdminUsers() {
  try {
    console.log('🔧 Criando usuários admin de teste...');

    const adminUsers = [
      {
        email: 'admin@cnvidas.com',
        username: 'admin',
        password: 'admin123',
        fullName: 'Administrador CN Vidas',
        role: 'admin'
      },
      {
        email: 'lucas.canova@icloud.com',
        username: 'lucas.admin',
        password: 'test123',
        fullName: 'Lucas Canova',
        role: 'admin'
      },
      {
        email: 'test@admin.com',
        username: 'testadmin',
        password: 'admin456',
        fullName: 'Test Admin',
        role: 'admin'
      }
    ];

    for (const adminData of adminUsers) {
      // Verificar se usuário já existe
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, adminData.email));

      if (existingUser) {
        console.log(`✅ Usuário ${adminData.email} já existe`);
        continue;
      }

      // Criar hash da senha
      const hashedPassword = await hashPassword(adminData.password);

      // Criar usuário admin
      const [newUser] = await db
        .insert(users)
        .values({
          email: adminData.email,
          username: adminData.username,
          password: hashedPassword,
          fullName: adminData.fullName,
          role: adminData.role as 'admin',
          emailVerified: true,
          isActive: true
        })
        .returning();

      console.log(`✅ Usuário admin criado: ${newUser.email}`);
    }

    console.log('🎉 Setup de usuários admin concluído!');
  } catch (error) {
    console.error('❌ Erro ao criar usuários admin:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createAdminUsers()
    .then(() => {
      console.log('Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro ao executar script:', error);
      process.exit(1);
    });
} 
