import * as path from 'path';
import * as fs from 'fs';

/**
 * Configuração do Apple Push Notification Service (APNs)
 */
export const apnsConfig = {
  // Certificados
  cert: process.env.APNS_CERT_PATH || path.join(__dirname, '../../certificates/apns-cert.pem'),
  key: process.env.APNS_KEY_PATH || path.join(__dirname, '../../certificates/apns-key.pem'),
  
  // Configurações do APNs
  production: process.env.NODE_ENV === 'production',
  topic: process.env.APNS_TOPIC || 'com.cnvidas.app', // Bundle ID do app
  
  // Team ID e Key ID (para autenticação por token - alternativa ao certificado)
  teamId: process.env.APNS_TEAM_ID,
  keyId: process.env.APNS_KEY_ID,
  
  // Verificar se os certificados existem
  validateCertificates(): boolean {
    if (this.teamId && this.keyId) {
      // Usando autenticação por token
      return true;
    }
    
    // Verificar certificados
    try {
      if (!fs.existsSync(this.cert)) {
        console.error('❌ Certificado APNs não encontrado:', this.cert);
        return false;
      }
      
      if (!fs.existsSync(this.key)) {
        console.error('❌ Chave privada APNs não encontrada:', this.key);
        return false;
      }
      
      console.log('✅ Certificados APNs encontrados');
      return true;
    } catch (error) {
      console.error('❌ Erro ao verificar certificados APNs:', error);
      return false;
    }
  }
};

/**
 * Instruções para configurar os certificados:
 * 
 * 1. Crie a pasta certificates na raiz do projeto:
 *    mkdir -p certificates
 * 
 * 2. Adicione os certificados convertidos:
 *    - certificates/apns-cert.pem (certificado público)
 *    - certificates/apns-key.pem (chave privada)
 * 
 * 3. IMPORTANTE: Adicione a pasta certificates ao .gitignore:
 *    echo "certificates/" >> .gitignore
 * 
 * 4. Configure as variáveis de ambiente no .env:
 *    APNS_TOPIC=com.cnvidas.app
 *    APNS_CERT_PATH=/path/to/apns-cert.pem
 *    APNS_KEY_PATH=/path/to/apns-key.pem
 * 
 * 5. Para produção, use autenticação por token (mais segura):
 *    APNS_TEAM_ID=XXXXXXXXXX
 *    APNS_KEY_ID=XXXXXXXXXX
 *    APNS_AUTH_KEY_PATH=/path/to/AuthKey_XXXXXXXXXX.p8
 */