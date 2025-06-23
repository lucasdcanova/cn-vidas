import { Router, Request, Response } from 'express';
import { storage } from '../storage.js';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../db.js';
import { notifications } from '../../shared/schema.js';
import { eq, and, isNull } from 'drizzle-orm';

const cleanupRouter = Router();

cleanupRouter.post('/cleanup-old-emergency-notifications', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Only allow admin users
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    console.log('🧹 Limpando notificações de emergência antigas sem relatedId...');
    
    // Marcar todas as notificações de emergência sem relatedId como lidas
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.type, 'emergency'),
          isNull(notifications.relatedId)
        )
      )
      .returning();
    
    console.log(`✅ ${result.length} notificações antigas marcadas como lidas`);
    
    // Contar notificações de emergência não lidas atuais
    const currentNotifications = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.type, 'emergency'),
          eq(notifications.isRead, false)
        )
      );
    
    return res.json({
      success: true,
      cleaned: result.length,
      currentUnread: currentNotifications.length
    });
    
  } catch (error) {
    console.error('❌ Erro ao limpar notificações:', error);
    return res.status(500).json({ error: 'Erro ao limpar notificações' });
  }
});

export default cleanupRouter;