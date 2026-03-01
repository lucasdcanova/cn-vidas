const postgres = require('postgres');
const crypto = require('crypto');
const { scrypt, randomBytes } = crypto;
const { promisify } = require('util');
const scryptAsync = promisify(scrypt);

// Conexão com o banco
const sql = postgres('postgresql://neondb_owner:npg_h9JvDZzKpIw6@ep-wandering-dawn-acwbhdh4-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require');

async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString('hex')}.${salt}`;
}

async function setupHCSR() {
    try {
        console.log('🏥 ============================================');
        console.log('🏥 SETUP: Hospital de Caridade Santa Rita (HCSR)');
        console.log('🏥 ============================================\n');

        // ==========================================
        // 1. Criar usuário com role "partner"
        // ==========================================
        console.log('👤 Passo 1: Criando usuário para o Hospital...');

        const email = 'contato@hospitalsantaritatriunfo.com.br';
        const username = 'hcsr_triunfo';
        const password = await hashPassword('HCSR@CNVidas2026');

        // Verificar se o email já existe
        const existingUser = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;

        let userId;

        if (existingUser.length > 0) {
            userId = existingUser[0].id;
            console.log(`   ⚠️ Usuário já existe com ID: ${userId}`);
            // Atualizar role para partner caso não esteja
            await sql`UPDATE users SET role = 'partner', updated_at = NOW() WHERE id = ${userId}`;
            console.log(`   ✅ Role atualizado para "partner"`);
        } else {
            const newUser = await sql`
        INSERT INTO users (
          email, username, password, full_name, role,
          phone, address, city, state, zipcode,
          is_active, email_verified, created_at, updated_at
        ) VALUES (
          ${email},
          ${username},
          ${password},
          'Hospital de Caridade Santa Rita',
          'partner',
          '(51) 3654-1210',
          'R. Osvaldo Aranha, 128 - Centro',
          'Triunfo',
          'RS',
          '95840000',
          true,
          true,
          NOW(),
          NOW()
        )
        RETURNING id
      `;
            userId = newUser[0].id;
            console.log(`   ✅ Usuário criado com ID: ${userId}`);
        }

        // ==========================================
        // 2. Criar perfil de parceiro (partner)
        // ==========================================
        console.log('\n🏢 Passo 2: Criando perfil de empresa parceira...');

        // Verificar se já existe partner para este userId
        const existingPartner = await sql`SELECT id FROM partners WHERE user_id = ${userId} LIMIT 1`;

        let partnerId;

        if (existingPartner.length > 0) {
            partnerId = existingPartner[0].id;
            console.log(`   ⚠️ Parceiro já existe com ID: ${partnerId}`);
            // Atualizar dados
            await sql`
        UPDATE partners SET
          business_name = 'Associação Hospital de Caridade Santa Rita',
          trading_name = 'HCSR - Hospital de Caridade Santa Rita',
          business_type = 'hospital',
          description = 'O Hospital de Caridade Santa Rita (HCSR) é uma instituição de referência em saúde na cidade de Triunfo/RS. Com atendimento humanizado e estrutura completa, o hospital oferece serviços de internação, exames de imagem (tomografia, ultrassonografia e raio-x) e atendimentos ambulatoriais. Parceiro oficial do CNVidas com descontos exclusivos para beneficiários.',
          website = 'https://hospitalsantaritatriunfo.com.br/',
          address = 'R. Osvaldo Aranha, 128 - Centro',
          street = 'R. Osvaldo Aranha',
          number = '128',
          neighborhood = 'Centro',
          city = 'Triunfo',
          state = 'RS',
          zipcode = '95840000',
          postal_code = '95840-000',
          phone = '(51) 3654-1210',
          cnpj = '98.227.986/0001-31',
          profile_image = '/icon-master-teal.png',
          nationwide_service = false,
          onboarding_completed = true,
          status = 'active',
          updated_at = NOW()
        WHERE id = ${partnerId}
      `;
            console.log(`   ✅ Dados do parceiro atualizados`);
        } else {
            const newPartner = await sql`
        INSERT INTO partners (
          user_id, business_name, trading_name, business_type,
          description, website, address, street, number,
          neighborhood, city, state, zipcode, postal_code,
          phone, cnpj, profile_image, nationwide_service,
          onboarding_completed, status, created_at, updated_at
        ) VALUES (
          ${userId},
          'Associação Hospital de Caridade Santa Rita',
          'HCSR - Hospital de Caridade Santa Rita',
          'hospital',
          'O Hospital de Caridade Santa Rita (HCSR) é uma instituição de referência em saúde na cidade de Triunfo/RS. Com atendimento humanizado e estrutura completa, o hospital oferece serviços de internação, exames de imagem (tomografia, ultrassonografia e raio-x) e atendimentos ambulatoriais. Parceiro oficial do CNVidas com descontos exclusivos para beneficiários.',
          'https://hospitalsantaritatriunfo.com.br/',
          'R. Osvaldo Aranha, 128 - Centro',
          'R. Osvaldo Aranha',
          '128',
          'Centro',
          'Triunfo',
          'RS',
          '95840000',
          '95840-000',
          '(51) 3654-1210',
          '98.227.986/0001-31',
          '/icon-master-teal.png',
          false,
          true,
          'active',
          NOW(),
          NOW()
        )
        RETURNING id
      `;
            partnerId = newPartner[0].id;
            console.log(`   ✅ Parceiro criado com ID: ${partnerId}`);
        }

        // ==========================================
        // 3. Remover serviços antigos se existirem
        // ==========================================
        console.log('\n🧹 Passo 3: Limpando serviços antigos (se houver)...');
        const deleted = await sql`DELETE FROM partner_services WHERE partner_id = ${partnerId} RETURNING id`;
        console.log(`   ✅ ${deleted.length} serviços antigos removidos`);

        // ==========================================
        // 4. Cadastrar todos os serviços setorizados
        // ==========================================
        console.log('\n📋 Passo 4: Cadastrando serviços com descontos...\n');

        // Preços são armazenados em centavos no banco de dados
        // Os preços regulares são estimativas de mercado para a região

        const services = [
            // ===========================================
            // SERVIÇOS DE INTERNAÇÃO - Até 30% de desconto
            // ===========================================
            {
                name: 'Internação Clínica',
                description: 'Internação para tratamento clínico com acompanhamento médico 24h. Inclui leito, alimentação e cuidados de enfermagem.',
                category: 'Internação',
                regularPrice: 80000, // R$ 800,00
                discountPrice: 56000, // R$ 560,00
                discountPercentage: 30,
                isFeatured: true,
                isActive: true,
                isNational: false
            },
            {
                name: 'Internação Cirúrgica',
                description: 'Internação para procedimentos cirúrgicos eletivos e de urgência. Inclui leito, centro cirúrgico, equipe e recuperação pós-operatória.',
                category: 'Internação',
                regularPrice: 150000, // R$ 1.500,00
                discountPrice: 105000, // R$ 1.050,00
                discountPercentage: 30,
                isFeatured: true,
                isActive: true,
                isNational: false
            },
            {
                name: 'Internação Pediátrica',
                description: 'Internação especializada para pacientes pediátricos com estrutura adaptada e atendimento humanizado para crianças.',
                category: 'Internação',
                regularPrice: 90000, // R$ 900,00
                discountPrice: 63000, // R$ 630,00
                discountPercentage: 30,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Internação em UTI',
                description: 'Internação em Unidade de Terapia Intensiva (UTI) com monitoramento contínuo e equipe multidisciplinar especializada.',
                category: 'Internação',
                regularPrice: 250000, // R$ 2.500,00
                discountPrice: 175000, // R$ 1.750,00
                discountPercentage: 30,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Diária de Internação - Quarto Coletivo',
                description: 'Diária de internação em quarto coletivo (enfermaria). Inclui leito, alimentação e cuidados de enfermagem.',
                category: 'Internação',
                regularPrice: 45000, // R$ 450,00
                discountPrice: 31500, // R$ 315,00
                discountPercentage: 30,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Diária de Internação - Quarto Individual',
                description: 'Diária de internação em quarto individual (apartamento). Inclui leito, alimentação, cuidados de enfermagem e maior privacidade.',
                category: 'Internação',
                regularPrice: 65000, // R$ 650,00
                discountPrice: 45500, // R$ 455,00
                discountPercentage: 30,
                isFeatured: false,
                isActive: true,
                isNational: false
            },

            // ====================================================
            // EXAMES DE IMAGEM - TOMOGRAFIA - 25% de desconto
            // ====================================================
            {
                name: 'Tomografia de Crânio',
                description: 'Tomografia computadorizada do crânio para avaliação de estruturas cerebrais, detecção de lesões, hemorragias e outras alterações.',
                category: 'Exames de Imagem - Tomografia',
                regularPrice: 45000, // R$ 450,00
                discountPrice: 33750, // R$ 337,50
                discountPercentage: 25,
                isFeatured: true,
                isActive: true,
                isNational: false
            },
            {
                name: 'Tomografia de Tórax',
                description: 'Tomografia computadorizada do tórax para avaliação dos pulmões, mediastino e estruturas torácicas.',
                category: 'Exames de Imagem - Tomografia',
                regularPrice: 50000, // R$ 500,00
                discountPrice: 37500, // R$ 375,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Tomografia de Abdômen',
                description: 'Tomografia computadorizada do abdômen para avaliação de órgãos abdominais como fígado, rins, pâncreas e baço.',
                category: 'Exames de Imagem - Tomografia',
                regularPrice: 55000, // R$ 550,00
                discountPrice: 41250, // R$ 412,50
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Tomografia de Coluna',
                description: 'Tomografia computadorizada da coluna (cervical, torácica ou lombar) para avaliação de discos, vértebras e canal medular.',
                category: 'Exames de Imagem - Tomografia',
                regularPrice: 48000, // R$ 480,00
                discountPrice: 36000, // R$ 360,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Tomografia de Pelve',
                description: 'Tomografia computadorizada da pelve para avaliação de estruturas pélvicas, bexiga e órgãos reprodutivos.',
                category: 'Exames de Imagem - Tomografia',
                regularPrice: 50000, // R$ 500,00
                discountPrice: 37500, // R$ 375,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Tomografia de Seios da Face',
                description: 'Tomografia computadorizada dos seios paranasais para investigação de sinusite, pólipos e alterações anatômicas.',
                category: 'Exames de Imagem - Tomografia',
                regularPrice: 35000, // R$ 350,00
                discountPrice: 26250, // R$ 262,50
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Tomografia de Membros',
                description: 'Tomografia computadorizada de membros superiores ou inferiores para avaliação de fraturas, lesões articulares e musculares.',
                category: 'Exames de Imagem - Tomografia',
                regularPrice: 42000, // R$ 420,00
                discountPrice: 31500, // R$ 315,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },

            // ====================================================
            // EXAMES DE IMAGEM - ULTRASSONOGRAFIA - 25% de desconto
            // ====================================================
            {
                name: 'Ultrassonografia Abdominal Total',
                description: 'Ultrassonografia abdominal para avaliação de fígado, vesícula biliar, pâncreas, baço, rins e grandes vasos abdominais.',
                category: 'Exames de Imagem - Ultrassonografia',
                regularPrice: 25000, // R$ 250,00
                discountPrice: 18750, // R$ 187,50
                discountPercentage: 25,
                isFeatured: true,
                isActive: true,
                isNational: false
            },
            {
                name: 'Ultrassonografia Pélvica',
                description: 'Ultrassonografia pélvica para avaliação de útero, ovários e bexiga (mulheres) ou próstata e bexiga (homens).',
                category: 'Exames de Imagem - Ultrassonografia',
                regularPrice: 22000, // R$ 220,00
                discountPrice: 16500, // R$ 165,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Ultrassonografia Obstétrica',
                description: 'Ultrassonografia obstétrica para acompanhamento da gestação, avaliação do desenvolvimento fetal e líquido amniótico.',
                category: 'Exames de Imagem - Ultrassonografia',
                regularPrice: 28000, // R$ 280,00
                discountPrice: 21000, // R$ 210,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Ultrassonografia de Tireoide',
                description: 'Ultrassonografia da tireoide para avaliação de nódulos, cistos e alterações da glândula tireoide.',
                category: 'Exames de Imagem - Ultrassonografia',
                regularPrice: 20000, // R$ 200,00
                discountPrice: 15000, // R$ 150,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Ultrassonografia de Mama',
                description: 'Ultrassonografia mamária bilateral para avaliação complementar de nódulos, cistos e alterações na mama.',
                category: 'Exames de Imagem - Ultrassonografia',
                regularPrice: 22000, // R$ 220,00
                discountPrice: 16500, // R$ 165,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Ultrassonografia de Próstata',
                description: 'Ultrassonografia da próstata via abdominal para avaliação do tamanho, forma e possíveis alterações prostáticas.',
                category: 'Exames de Imagem - Ultrassonografia',
                regularPrice: 22000, // R$ 220,00
                discountPrice: 16500, // R$ 165,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Ultrassonografia de Vias Urinárias',
                description: 'Ultrassonografia de rins e vias urinárias para avaliação de cálculos, cistos, hidronefrose e outras alterações renais.',
                category: 'Exames de Imagem - Ultrassonografia',
                regularPrice: 22000, // R$ 220,00
                discountPrice: 16500, // R$ 165,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Ultrassonografia Articular',
                description: 'Ultrassonografia de articulações (ombro, joelho, tornozelo, etc.) para avaliação de tendões, ligamentos e derrames articulares.',
                category: 'Exames de Imagem - Ultrassonografia',
                regularPrice: 22000, // R$ 220,00
                discountPrice: 16500, // R$ 165,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Ultrassonografia com Doppler Vascular',
                description: 'Ultrassonografia com Doppler para avaliação do fluxo sanguíneo em artérias e veias (carótidas, membros inferiores, etc.).',
                category: 'Exames de Imagem - Ultrassonografia',
                regularPrice: 30000, // R$ 300,00
                discountPrice: 22500, // R$ 225,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },

            // ==============================================
            // EXAMES DE IMAGEM - RAIO-X - 25% de desconto
            // ==============================================
            {
                name: 'Raio-X de Tórax',
                description: 'Radiografia digital do tórax (PA e perfil) para avaliação de pulmões, coração e estruturas torácicas.',
                category: 'Exames de Imagem - Raio-X',
                regularPrice: 12000, // R$ 120,00
                discountPrice: 9000, // R$ 90,00
                discountPercentage: 25,
                isFeatured: true,
                isActive: true,
                isNational: false
            },
            {
                name: 'Raio-X de Coluna Cervical',
                description: 'Radiografia digital da coluna cervical para avaliação de vértebras, alinhamento e possíveis lesões.',
                category: 'Exames de Imagem - Raio-X',
                regularPrice: 12000, // R$ 120,00
                discountPrice: 9000, // R$ 90,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Raio-X de Coluna Lombar',
                description: 'Radiografia digital da coluna lombar para avaliação de vértebras lombossacrais, discos e alinhamento.',
                category: 'Exames de Imagem - Raio-X',
                regularPrice: 12000, // R$ 120,00
                discountPrice: 9000, // R$ 90,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Raio-X de Membros Superiores',
                description: 'Radiografia digital de mão, punho, antebraço, cotovelo, braço ou ombro para avaliação de fraturas e lesões ósseas.',
                category: 'Exames de Imagem - Raio-X',
                regularPrice: 10000, // R$ 100,00
                discountPrice: 7500, // R$ 75,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Raio-X de Membros Inferiores',
                description: 'Radiografia digital de pé, tornozelo, perna, joelho ou coxa para avaliação de fraturas, lesões ósseas e articulares.',
                category: 'Exames de Imagem - Raio-X',
                regularPrice: 10000, // R$ 100,00
                discountPrice: 7500, // R$ 75,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Raio-X de Seios da Face',
                description: 'Radiografia digital dos seios paranasais para avaliação de sinusite e outras alterações.',
                category: 'Exames de Imagem - Raio-X',
                regularPrice: 10000, // R$ 100,00
                discountPrice: 7500, // R$ 75,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Raio-X de Abdômen',
                description: 'Radiografia digital do abdômen para avaliação de alças intestinais, obstruções e calcificações.',
                category: 'Exames de Imagem - Raio-X',
                regularPrice: 12000, // R$ 120,00
                discountPrice: 9000, // R$ 90,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Raio-X de Bacia / Quadril',
                description: 'Radiografia digital da bacia e quadril para avaliação de articulação coxofemoral, fraturas e displasia.',
                category: 'Exames de Imagem - Raio-X',
                regularPrice: 12000, // R$ 120,00
                discountPrice: 9000, // R$ 90,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Raio-X Panorâmico de Coluna',
                description: 'Radiografia digital panorâmica da coluna total para avaliação de escoliose, alinhamento vertebral e lordose/cifose.',
                category: 'Exames de Imagem - Raio-X',
                regularPrice: 15000, // R$ 150,00
                discountPrice: 11250, // R$ 112,50
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },

            // ===========================================================
            // ATENDIMENTOS AMBULATORIAIS - 25% de desconto
            // ===========================================================
            {
                name: 'Consulta Clínica Geral',
                description: 'Consulta médica de clínica geral para avaliação, diagnóstico e tratamento de doenças comuns e acompanhamento de saúde.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 25000, // R$ 250,00
                discountPrice: 18750, // R$ 187,50
                discountPercentage: 25,
                isFeatured: true,
                isActive: true,
                isNational: false
            },
            {
                name: 'Consulta Cardiologia',
                description: 'Consulta médica especializada em cardiologia para avaliação do coração e sistema cardiovascular.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 35000, // R$ 350,00
                discountPrice: 26250, // R$ 262,50
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Consulta Ortopedia',
                description: 'Consulta médica especializada em ortopedia para avaliação do sistema musculoesquelético, ossos e articulações.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 35000, // R$ 350,00
                discountPrice: 26250, // R$ 262,50
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Consulta Pediatria',
                description: 'Consulta médica especializada em pediatria para acompanhamento e tratamento da saúde de crianças e adolescentes.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 30000, // R$ 300,00
                discountPrice: 22500, // R$ 225,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Consulta Ginecologia',
                description: 'Consulta médica especializada em ginecologia para avaliação da saúde da mulher, prevenção e tratamento.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 30000, // R$ 300,00
                discountPrice: 22500, // R$ 225,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Consulta Urologia',
                description: 'Consulta médica especializada em urologia para avaliação do sistema urinário e reprodutor masculino.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 35000, // R$ 350,00
                discountPrice: 26250, // R$ 262,50
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Consulta Neurologia',
                description: 'Consulta médica especializada em neurologia para avaliação do sistema nervoso, cérebro e medula espinhal.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 38000, // R$ 380,00
                discountPrice: 28500, // R$ 285,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Consulta Dermatologia',
                description: 'Consulta médica especializada em dermatologia para avaliação e tratamento de doenças da pele, cabelos e unhas.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 30000, // R$ 300,00
                discountPrice: 22500, // R$ 225,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Consulta Otorrinolaringologia',
                description: 'Consulta médica especializada em otorrinolaringologia para avaliação de ouvido, nariz e garganta.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 35000, // R$ 350,00
                discountPrice: 26250, // R$ 262,50
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Consulta Oftalmologia',
                description: 'Consulta médica especializada em oftalmologia para avaliação da saúde ocular, acuidade visual e tratamento.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 30000, // R$ 300,00
                discountPrice: 22500, // R$ 225,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Consulta Endocrinologia',
                description: 'Consulta médica especializada em endocrinologia para avaliação hormonal, diabetes, tireoide e metabolismo.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 35000, // R$ 350,00
                discountPrice: 26250, // R$ 262,50
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Consulta Gastroenterologia',
                description: 'Consulta médica especializada em gastroenterologia para avaliação do sistema digestivo, estômago e intestino.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 35000, // R$ 350,00
                discountPrice: 26250, // R$ 262,50
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Consulta Pneumologia',
                description: 'Consulta médica especializada em pneumologia para avaliação do sistema respiratório e pulmões.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 35000, // R$ 350,00
                discountPrice: 26250, // R$ 262,50
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Consulta Psiquiatria',
                description: 'Consulta médica especializada em psiquiatria para avaliação e tratamento de transtornos mentais e emocionais.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 40000, // R$ 400,00
                discountPrice: 30000, // R$ 300,00
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Atendimento de Urgência / Emergência',
                description: 'Atendimento médico de urgência e emergência no pronto-socorro do hospital, com equipe de plantão 24h.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 35000, // R$ 350,00
                discountPrice: 26250, // R$ 262,50
                discountPercentage: 25,
                isFeatured: true,
                isActive: true,
                isNational: false
            },
            {
                name: 'Pequenos Procedimentos Ambulatoriais',
                description: 'Pequenos procedimentos realizados em ambulatório como suturas, curativos especiais, drenagens e biópsias de pele.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 25000, // R$ 250,00
                discountPrice: 18750, // R$ 187,50
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Eletrocardiograma (ECG)',
                description: 'Exame de eletrocardiograma para avaliação da atividade elétrica do coração e detecção de arritmias.',
                category: 'Atendimento Ambulatorial',
                regularPrice: 15000, // R$ 150,00
                discountPrice: 11250, // R$ 112,50
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
            {
                name: 'Coleta de Exames Laboratoriais',
                description: 'Coleta de sangue e demais materiais para exames laboratoriais (hemograma, glicemia, colesterol, hormônios, etc.).',
                category: 'Atendimento Ambulatorial',
                regularPrice: 5000, // R$ 50,00
                discountPrice: 3750, // R$ 37,50
                discountPercentage: 25,
                isFeatured: false,
                isActive: true,
                isNational: false
            },
        ];

        // Inserir todos os serviços
        let insertedCount = 0;
        for (const service of services) {
            await sql`
        INSERT INTO partner_services (
          partner_id, name, description, category,
          regular_price, discount_price, discount_percentage,
          is_featured, is_active, is_national,
          created_at, updated_at
        ) VALUES (
          ${partnerId},
          ${service.name},
          ${service.description},
          ${service.category},
          ${service.regularPrice},
          ${service.discountPrice},
          ${service.discountPercentage},
          ${service.isFeatured},
          ${service.isActive},
          ${service.isNational},
          NOW(),
          NOW()
        )
      `;
            insertedCount++;
            const priceRegular = (service.regularPrice / 100).toFixed(2);
            const priceDiscount = (service.discountPrice / 100).toFixed(2);
            console.log(`   ✅ [${insertedCount}/${services.length}] ${service.name} — De R$ ${priceRegular} por R$ ${priceDiscount} (${service.discountPercentage}% off)`);
        }

        // ==========================================
        // 5. Resumo final
        // ==========================================
        console.log('\n🎉 ============================================');
        console.log('🎉 SETUP CONCLUÍDO COM SUCESSO!');
        console.log('🎉 ============================================\n');
        console.log('📊 Resumo:');
        console.log(`   👤 User ID: ${userId}`);
        console.log(`   🏢 Partner ID: ${partnerId}`);
        console.log(`   📋 Serviços cadastrados: ${insertedCount}`);
        console.log('');
        console.log('🔑 Credenciais de Login:');
        console.log(`   📧 Email: ${email}`);
        console.log(`   🔒 Senha: HCSR@CNVidas2026`);
        console.log(`   👤 Role: partner`);
        console.log('');
        console.log('📋 Categorias de Serviços:');

        const categories = {};
        services.forEach(s => {
            if (!categories[s.category]) categories[s.category] = { count: 0, discount: s.discountPercentage };
            categories[s.category].count++;
        });
        Object.entries(categories).forEach(([cat, info]) => {
            console.log(`   📌 ${cat}: ${info.count} serviços (${info.discount}% de desconto)`);
        });

        console.log('');
        console.log('🏥 Informações do Hospital:');
        console.log('   Nome: Associação Hospital de Caridade Santa Rita');
        console.log('   CNPJ: 98.227.986/0001-31');
        console.log('   Endereço: R. Osvaldo Aranha, 128 - Centro, Triunfo/RS');
        console.log('   Telefone: (51) 3654-1210');
        console.log('   Website: https://hospitalsantaritatriunfo.com.br/');

    } catch (error) {
        console.error('\n❌ Erro durante setup:', error);
    } finally {
        await sql.end();
    }
}

setupHCSR();
