import express from 'express';
import { PKPass } from 'passkit-generator';
import path from 'path';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../middleware/auth';
import { walletConfig } from '../wallet/wallet-config';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

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
router.post('/generate-pass', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const user = req.user;
    const { planName, qrCode } = req.body;

    // Configurar cores do plano
    const colors = planColors[planName] || planColors.basic;
    const planDisplayName = planDisplayNames[planName] || 'Plano Básico';

    // Verificar se os certificados estão configurados
    const isConfigured = await walletConfig.isConfigured();
    if (!isConfigured) {
      console.error('Certificados do Wallet não configurados');
      return res.status(500).json({ 
        error: 'Certificados não configurados. Por favor, configure os certificados do Apple Wallet.' 
      });
    }
    
    // Obter certificados
    const certificates = await walletConfig.getCertificates();
    
    console.log('[WalletPass] Certificados obtidos:', {
      hasWwdr: !!certificates.wwdr,
      hasSignerCert: !!certificates.signerCert,
      hasSignerKey: !!certificates.signerKey,
      wwdrLength: certificates.wwdr?.length,
      signerCertLength: certificates.signerCert?.length,
      signerKeyLength: certificates.signerKey?.length,
      hasPassphrase: !!certificates.signerKeyPassphrase
    });

    // Preparar certificados sem passphrase se não houver
    const cleanCertificates: any = {
      wwdr: certificates.wwdr,
      signerCert: certificates.signerCert,
      signerKey: certificates.signerKey
    };
    
    // Só adicionar passphrase se existir
    if (certificates.signerKeyPassphrase) {
      cleanCertificates.signerKeyPassphrase = certificates.signerKeyPassphrase;
    }

    // Criar o pass com a estrutura correta para passkit-generator v3
    const pass = new PKPass({
      model: {
        passTypeIdentifier: walletConfig.passTypeId,
        teamIdentifier: walletConfig.teamId,
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
              value: user.fullName || user.email
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
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      certificates: cleanCertificates
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
    console.log('[WalletPass] Gerando buffer do pass...');
    const buffer = await pass.generate();
    console.log('[WalletPass] Buffer gerado:', buffer.length, 'bytes');

    // Enviar o arquivo com headers apropriados para iOS
    res.set({
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename=cnvidas-${user.id}.pkpass`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.send(buffer);
  } catch (error: any) {
    console.error('[WalletPass] Erro detalhado:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Mensagem de erro mais específica
    let errorMessage = 'Erro ao gerar pass';
    if (error.message?.includes('certificate')) {
      errorMessage = 'Erro de certificado: ' + error.message;
    } else if (error.message?.includes('signing')) {
      errorMessage = 'Erro ao assinar pass: ' + error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// Rota de download direto (GET) para iOS
router.get('/download-pass', async (req: AuthenticatedRequest, res) => {
  try {
    // Verificar autenticação via token na query string ou middleware normal
    if (!req.user && req.query.token) {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'REDACTED_JWT_FALLBACK_PLACEHOLDER';
        const decoded: any = jwt.verify(req.query.token as string, jwtSecret);
        
        if (decoded && decoded.userId) {
          const result = await db.select().from(users).where(eq(users.id, decoded.userId));
          const user = result[0];
          
          if (user) {
            req.user = {
              id: user.id,
              email: user.email,
              role: user.role,
              fullName: user.fullName,
              username: user.username,
              emailVerified: user.emailVerified,
              subscriptionPlan: user.subscriptionPlan,
              subscriptionStatus: user.subscriptionStatus
            };
          }
        }
      } catch (error) {
        console.error('[WalletPass] Erro ao verificar token:', error);
      }
    }
    
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const user = req.user;
    const { planName, qrCode } = req.query;
    
    if (!planName || !qrCode) {
      return res.status(400).json({ error: 'Parâmetros faltando' });
    }

    // Configurar cores do plano
    const colors = planColors[planName as string] || planColors.basic;
    const planDisplayName = planDisplayNames[planName as string] || 'Plano Básico';

    // Verificar se os certificados estão configurados
    const isConfigured = await walletConfig.isConfigured();
    if (!isConfigured) {
      console.error('Certificados do Wallet não configurados');
      return res.status(500).json({ 
        error: 'Certificados não configurados. Por favor, configure os certificados do Apple Wallet.' 
      });
    }
    
    // Obter certificados
    const certificates = await walletConfig.getCertificates();
    
    console.log('[WalletPass] Certificados obtidos:', {
      hasWwdr: !!certificates.wwdr,
      hasSignerCert: !!certificates.signerCert,
      hasSignerKey: !!certificates.signerKey,
      wwdrLength: certificates.wwdr?.length,
      signerCertLength: certificates.signerCert?.length,
      signerKeyLength: certificates.signerKey?.length,
      hasPassphrase: !!certificates.signerKeyPassphrase
    });

    // Preparar certificados sem passphrase se não houver
    const cleanCertificates: any = {
      wwdr: certificates.wwdr,
      signerCert: certificates.signerCert,
      signerKey: certificates.signerKey
    };
    
    // Só adicionar passphrase se existir
    if (certificates.signerKeyPassphrase) {
      cleanCertificates.signerKeyPassphrase = certificates.signerKeyPassphrase;
    }

    // Criar o pass com a estrutura correta para passkit-generator v3
    const pass = new PKPass({
      model: {
        passTypeIdentifier: walletConfig.passTypeId,
        teamIdentifier: walletConfig.teamId,
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
              value: user.fullName || user.email
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
          message: qrCode as string,
          messageEncoding: 'iso-8859-1'
        },
        
        // Validade
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      certificates: cleanCertificates
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
    console.log('[WalletPass GET] Gerando buffer do pass...');
    const buffer = pass.getAsBuffer();
    console.log('[WalletPass GET] Buffer gerado:', buffer.length, 'bytes');

    // Enviar o arquivo com headers apropriados para iOS
    res.set({
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename=cnvidas-${user.id}.pkpass`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.send(buffer);
  } catch (error: any) {
    console.error('[WalletPass GET] Erro detalhado:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Mensagem de erro mais específica
    let errorMessage = 'Erro ao gerar pass';
    if (error.message?.includes('certificate')) {
      errorMessage = 'Erro de certificado: ' + error.message;
    } else if (error.message?.includes('signing')) {
      errorMessage = 'Erro ao assinar pass: ' + error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

export default router;