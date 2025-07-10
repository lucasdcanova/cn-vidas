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
    const certPath = path.join(__dirname, '../wallet/certificates');
    const files = await fs.readdir(certPath).catch(() => []);
    
    res.json({
      certificatesPath: certPath,
      filesFound: files,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasPassTypeId: !!process.env.PASS_TYPE_ID,
        hasTeamId: !!process.env.APPLE_TEAM_ID
      }
    });
  } catch (error) {
    console.error('[WalletDebug] Erro:', error);
    res.status(500).json({ error: 'Erro ao verificar certificados' });
  }
});

export default router;