import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const MOCK_EMAIL = 'modelo@cnvidas.com.br';
const MOCK_PASSWORD = 'SenhaModelo2026!';

async function testLogin() {
    try {
        console.log('🔍 Verificando o login do usuário modelo...');

        // Busca o usuário
        const user = await db.select().from(users).where(eq(users.email, MOCK_EMAIL)).limit(1);

        if (user.length === 0) {
            console.error('❌ Usuário não encontrado no banco de dados!');
            process.exit(1);
        }

        const foundUser = user[0];
        console.log(`✅ Usuário encontrado: ${foundUser.fullName} (${foundUser.email})`);

        // Verifica a senha
        const isValid = await bcrypt.compare(MOCK_PASSWORD, foundUser.password);

        if (isValid) {
            console.log('✅ A senha está 100% CORRETA e o login vai funcionar!');
            console.log('Status da conta:', foundUser.status);
            console.log('Plano da conta:', foundUser.subscriptionPlan);
            console.log('Role:', foundUser.role);
        } else {
            console.error('❌ A senha armazenada NÃO BATE com a senha gerada!');
        }

    } catch (err) {
        console.error('❌ Erro durante o teste de login:', err.message);
    } finally {
        process.exit(0);
    }
}

testLogin();
