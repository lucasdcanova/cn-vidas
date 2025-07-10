import express from 'express';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Rota de teste para verificar se o servidor está respondendo corretamente
router.get('/test-pkpass', async (req, res) => {
  try {
    console.log('[WalletTest] Teste de download de pkpass iniciado');
    
    // Criar um arquivo PKPass de teste simples
    const testData = Buffer.from('PKPass Test File');
    
    // Configurar headers
    res.set({
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': 'attachment; filename=test.pkpass',
      'Content-Length': testData.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    console.log('[WalletTest] Enviando arquivo de teste');
    res.send(testData);
  } catch (error) {
    console.error('[WalletTest] Erro:', error);
    res.status(500).json({ error: 'Erro no teste' });
  }
});

// Rota de debug para verificar certificados
router.get('/debug-certificates', async (req, res) => {
  try {
    console.log('[WalletDebug] Verificando certificados...');
    
    const environment = {
      NODE_ENV: process.env.NODE_ENV,
      hasPassTypeId: !!process.env.APPLE_PASS_TYPE_ID,
      passTypeId: process.env.APPLE_PASS_TYPE_ID ? 'Configurado' : 'Não configurado',
      hasTeamId: !!process.env.APPLE_TEAM_ID,
      teamId: process.env.APPLE_TEAM_ID ? 'Configurado' : 'Não configurado',
      hasSignerCert: !!process.env.WALLET_SIGNER_CERT_BASE64,
      hasSignerKey: !!process.env.WALLET_SIGNER_KEY_BASE64,
      hasWWDR: !!process.env.WALLET_WWDR_BASE64,
    };
    
    // Verificar se os certificados estão sendo decodificados corretamente
    let certificateInfo = {
      signerCertLength: 0,
      signerKeyLength: 0,
      wwdrLength: 0,
      signerCertValid: false,
      signerKeyValid: false,
      wwdrValid: false
    };
    
    if (process.env.WALLET_SIGNER_CERT_BASE64) {
      try {
        const cert = Buffer.from(process.env.WALLET_SIGNER_CERT_BASE64, 'base64').toString();
        certificateInfo.signerCertLength = cert.length;
        certificateInfo.signerCertValid = cert.includes('BEGIN CERTIFICATE');
      } catch (e) {
        console.error('Erro ao decodificar SIGNER_CERT:', e);
      }
    }
    
    if (process.env.WALLET_SIGNER_KEY_BASE64) {
      try {
        const key = Buffer.from(process.env.WALLET_SIGNER_KEY_BASE64, 'base64').toString();
        certificateInfo.signerKeyLength = key.length;
        certificateInfo.signerKeyValid = key.includes('BEGIN PRIVATE KEY') || key.includes('BEGIN RSA PRIVATE KEY');
      } catch (e) {
        console.error('Erro ao decodificar SIGNER_KEY:', e);
      }
    }
    
    if (process.env.WALLET_WWDR_BASE64) {
      try {
        const wwdr = Buffer.from(process.env.WALLET_WWDR_BASE64, 'base64').toString();
        certificateInfo.wwdrLength = wwdr.length;
        certificateInfo.wwdrValid = wwdr.includes('BEGIN CERTIFICATE');
      } catch (e) {
        console.error('Erro ao decodificar WWDR:', e);
      }
    }
    
    res.json({
      message: 'Debug de certificados',
      environment,
      certificateInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[WalletDebug] Erro:', error);
    res.status(500).json({ error: 'Erro ao verificar certificados' });
  }
});

export default router;