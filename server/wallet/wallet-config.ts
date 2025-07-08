import * as path from 'path';
import * as fs from 'fs';

/**
 * Configuração do Apple Wallet
 */
export const walletConfig = {
  // Pass Type Identifier
  passTypeId: process.env.APPLE_PASS_TYPE_ID || 'pass.com.cnvidas.membership',
  teamId: process.env.APPLE_TEAM_ID || '',
  
  // Obter certificados (suporta Base64 para produção)
  async getCertificates() {
    // Se tiver certificados em Base64 (produção)
    if (process.env.WALLET_SIGNER_CERT_BASE64) {
      return {
        wwdr: Buffer.from(process.env.WALLET_WWDR_BASE64 || '', 'base64'),
        signerCert: Buffer.from(process.env.WALLET_SIGNER_CERT_BASE64, 'base64'),
        signerKey: {
          keyFile: Buffer.from(process.env.WALLET_SIGNER_KEY_BASE64 || '', 'base64'),
          passphrase: process.env.APPLE_PASS_KEY_PASSWORD || ''
        }
      };
    }
    
    // Caso contrário, ler dos arquivos locais
    const certificatesPath = path.join(__dirname, './certificates');
    
    return {
      wwdr: await fs.promises.readFile(path.join(certificatesPath, 'wwdr.pem')),
      signerCert: await fs.promises.readFile(path.join(certificatesPath, 'signerCert.pem')),
      signerKey: {
        keyFile: await fs.promises.readFile(path.join(certificatesPath, 'signerKey.key')),
        passphrase: process.env.APPLE_PASS_KEY_PASSWORD || ''
      }
    };
  },
  
  // Verificar se certificados estão configurados
  async isConfigured(): Promise<boolean> {
    // Verificar Base64 primeiro
    if (process.env.WALLET_SIGNER_CERT_BASE64) {
      return true;
    }
    
    // Verificar arquivos locais
    const certificatesPath = path.join(__dirname, './certificates');
    try {
      await fs.promises.access(path.join(certificatesPath, 'wwdr.pem'));
      await fs.promises.access(path.join(certificatesPath, 'signerCert.pem'));
      await fs.promises.access(path.join(certificatesPath, 'signerKey.key'));
      return true;
    } catch {
      return false;
    }
  }
};