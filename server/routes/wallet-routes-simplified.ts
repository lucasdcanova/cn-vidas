import express from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { generateQRCode } from '../utils/qr-code';

const router = express.Router();

// Por enquanto, vamos simplificar a geração do pass
// até que os certificados estejam configurados
router.post('/generate-pass', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Por enquanto, retornar erro informativo
    res.status(501).json({ 
      error: 'Funcionalidade em desenvolvimento',
      message: 'A geração de passes para Apple Wallet será habilitada em breve. Por favor, configure os certificados Apple primeiro.'
    });
  } catch (error) {
    console.error('Erro ao gerar wallet pass:', error);
    res.status(500).json({ error: 'Erro ao gerar pass' });
  }
});

export default router;