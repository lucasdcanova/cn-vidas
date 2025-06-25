import express from 'express';
import { PKPass } from 'passkit-generator';
import path from 'path';
import fs from 'fs/promises';
import { requireAuth } from '../middleware/auth-middleware';
import { User } from '@prisma/client';

const router = express.Router();

// Cores dos planos
const planColors: { [key: string]: { backgroundColor: string; foregroundColor: string; labelColor: string } } = {
  basic: {
    backgroundColor: 'rgb(59, 130, 246)',
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(219, 234, 254)'
  },
  standard: {
    backgroundColor: 'rgb(168, 85, 247)',
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(233, 213, 255)'
  },
  premium: {
    backgroundColor: 'rgb(251, 191, 36)',
    foregroundColor: 'rgb(0, 0, 0)',
    labelColor: 'rgb(92, 51, 23)'
  },
  family_basic: {
    backgroundColor: 'rgb(34, 197, 94)',
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(220, 252, 231)'
  },
  family_plus: {
    backgroundColor: 'rgb(236, 72, 153)',
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(252, 231, 243)'
  },
  ultra_family: {
    backgroundColor: 'rgb(79, 70, 229)',
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(224, 231, 255)'
  },
  medical: {
    backgroundColor: 'rgb(14, 165, 233)',
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(224, 242, 254)'
  }
};

const planDisplayNames: { [key: string]: string } = {
  basic: 'Básico',
  standard: 'Padrão',
  premium: 'Premium',
  family_basic: 'Familiar Básico',
  family_plus: 'Familiar Plus',
  ultra_family: 'Ultra Familiar',
  medical: 'Plano Médico'
};

// Gerar Apple Wallet Pass
router.post('/generate-pass', requireAuth, async (req, res) => {
  try {
    const user = req.user as User;
    const { planName, qrCode } = req.body;

    // Configurar cores do plano
    const colors = planColors[planName] || planColors.basic;
    const planDisplayName = planDisplayNames[planName] || 'Plano Básico';

    // Caminho dos certificados
    const certificatesPath = path.join(__dirname, '../wallet/certificates');
    
    // Verificar se os certificados existem
    const wwdrPath = path.join(certificatesPath, 'wwdr.pem');
    const signerCertPath = path.join(certificatesPath, 'signerCert.pem');
    const signerKeyPath = path.join(certificatesPath, 'signerKey.key');
    
    // Verificar existência dos arquivos
    try {
      await fs.access(wwdrPath);
      await fs.access(signerCertPath);
      await fs.access(signerKeyPath);
    } catch (error) {
      console.error('Certificados não encontrados:', error);
      return res.status(500).json({ 
        error: 'Certificados não configurados. Por favor, adicione os certificados Apple na pasta server/wallet/certificates/' 
      });
    }

    // Criar o pass
    const pass = new PKPass({
      'pass.json': {
        passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID || 'pass.com.cnvidas.membership',
        teamIdentifier: process.env.APPLE_TEAM_ID || 'YOUR_TEAM_ID',
        organizationName: 'CN Vidas',
        description: 'Cartão de Membro CN Vidas',
        serialNumber: `CNV-${user.id}-${Date.now()}`,
        logoText: 'CN Vidas',
        foregroundColor: colors.foregroundColor,
        backgroundColor: colors.backgroundColor,
        labelColor: colors.labelColor,
        
        // Estrutura do cartão genérico
        generic: {
          primaryFields: [
            {
              key: 'member',
              label: 'MEMBRO',
              value: user.fullName || user.username
            }
          ],
          secondaryFields: [
            {
              key: 'plan',
              label: 'PLANO',
              value: planDisplayName
            }
          ],
          auxiliaryFields: [
            {
              key: 'memberId',
              label: 'ID DO MEMBRO',
              value: `CNV${user.id.toString().padStart(6, '0')}`
            }
          ],
          backFields: [
            {
              key: 'email',
              label: 'E-mail',
              value: user.email
            },
            {
              key: 'website',
              label: 'Site',
              value: 'https://cnvidas.com.br'
            },
            {
              key: 'phone',
              label: 'Telefone',
              value: '0800 123 4567'
            },
            {
              key: 'terms',
              label: 'Termos de Uso',
              value: 'Este cartão é pessoal e intransferível. Apresente-o aos parceiros CN Vidas para validação de benefícios.'
            }
          ]
        },
        
        // QR Code
        barcode: {
          format: 'PKBarcodeFormatQR',
          message: qrCode,
          messageEncoding: 'iso-8859-1'
        },
        
        // Validade
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        
        // Localização (opcional - para notificações baseadas em localização)
        locations: []
      }
    }, {
      wwdr: await fs.readFile(wwdrPath),
      signerCert: await fs.readFile(signerCertPath),
      signerKey: {
        keyFile: await fs.readFile(signerKeyPath),
        passphrase: process.env.APPLE_PASS_KEY_PASSWORD || ''
      }
    });

    // Adicionar assets (ícones e logos)
    const assetsPath = path.join(__dirname, '../wallet/assets');
    
    // Adicionar ícones se existirem
    try {
      pass.addBuffer('icon.png', await fs.readFile(path.join(assetsPath, 'icon.png')));
      pass.addBuffer('icon@2x.png', await fs.readFile(path.join(assetsPath, 'icon@2x.png')));
      pass.addBuffer('logo.png', await fs.readFile(path.join(assetsPath, 'logo.png')));
      pass.addBuffer('logo@2x.png', await fs.readFile(path.join(assetsPath, 'logo@2x.png')));
    } catch (error) {
      console.log('Alguns assets não foram encontrados, usando padrões');
    }

    // Gerar o pass
    const buffer = await pass.generate();

    // Enviar o arquivo
    res.set({
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename=cnvidas-${user.id}.pkpass`
    });

    res.send(buffer);
  } catch (error) {
    console.error('Erro ao gerar wallet pass:', error);
    res.status(500).json({ error: 'Erro ao gerar pass' });
  }
});

export default router;