import { Router } from 'express';
import { db } from '../db';
import { remoteConsoleLogs } from '../../shared/schema';
import { eq, desc, gte, sql } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const RemoteLogSchema = z.object({
  level: z.enum(['log', 'warn', 'error', 'info', 'debug']),
  message: z.string(),
  timestamp: z.string(),
  userAgent: z.string(),
  platform: z.string(),
  appVersion: z.string(),
  stack: z.string().optional(),
  metadata: z.any().optional(),
});

const RemoteConsolePayloadSchema = z.object({
  logs: z.array(RemoteLogSchema),
  userId: z.number().optional(),
  sessionId: z.string(),
});

// Endpoint para receber logs remotos
router.post('/api/diagnostics/remote-console', async (req, res) => {
  try {
    const payload = RemoteConsolePayloadSchema.parse(req.body);
    
    // Salva logs no banco de dados
    const logsToInsert = payload.logs.map(log => ({
      userId: payload.userId || null,
      sessionId: payload.sessionId,
      level: log.level,
      message: log.message,
      timestamp: new Date(log.timestamp),
      userAgent: log.userAgent,
      platform: log.platform,
      appVersion: log.appVersion,
      stack: log.stack || null,
      metadata: log.metadata || {},
    }));
    
    await db.insert(remoteConsoleLogs).values(logsToInsert);
    
    res.json({ success: true, count: logsToInsert.length });
  } catch (error) {
    console.error('Error saving remote console logs:', error);
    res.status(400).json({ error: 'Invalid log format' });
  }
});

// Endpoint para visualizar logs (apenas admin)
router.get('/api/diagnostics/remote-console/:sessionId', async (req, res) => {
  try {
    // TODO: Adicionar autenticação de admin
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const logs = await db
      .select()
      .from(remoteConsoleLogs)
      .where(eq(remoteConsoleLogs.sessionId, sessionId))
      .orderBy(desc(remoteConsoleLogs.timestamp))
      .limit(limit);
    
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching remote console logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Endpoint para listar sessões ativas
router.get('/api/diagnostics/remote-console/sessions/active', async (req, res) => {
  try {
    // TODO: Adicionar autenticação de admin
    const recentSessions = await db
      .select({
        sessionId: remoteConsoleLogs.sessionId,
        userId: remoteConsoleLogs.userId,
        lastActivity: sql<Date>`MAX(${remoteConsoleLogs.timestamp})`,
        logCount: sql<number>`COUNT(*)::int`,
      })
      .from(remoteConsoleLogs)
      .where(
        gte(remoteConsoleLogs.timestamp, new Date(Date.now() - 24 * 60 * 60 * 1000))
      )
      .groupBy(remoteConsoleLogs.sessionId, remoteConsoleLogs.userId)
      .orderBy(desc(sql`MAX(${remoteConsoleLogs.timestamp})`));
    
    res.json({ sessions: recentSessions });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

export default router;