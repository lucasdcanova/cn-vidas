import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../db';
import { deviceTokens, DevicePlatform } from '../../db/schema/device-tokens';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Schema de validação para registro de token
const registerTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
  deviceInfo: z.object({
    model: z.string().optional(),
    osVersion: z.string().optional(),
    appVersion: z.string().optional(),
  }).optional(),
});

/**
 * POST /api/push-notifications/register
 * Registra ou atualiza token de dispositivo para push notifications
 */
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { token, platform, deviceInfo } = registerTokenSchema.parse(req.body);
    const userId = req.user!.id;

    console.log(`Registrando token para usuário ${userId} na plataforma ${platform}`);

    // Upsert: atualiza se existir, cria se não existir
    const [deviceToken] = await db
      .insert(deviceTokens)
      .values({
        userId,
        platform,
        token,
        deviceInfo: deviceInfo || {},
        isActive: true,
        lastUsedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [deviceTokens.userId, deviceTokens.platform],
        set: {
          token,
          deviceInfo: deviceInfo || {},
          isActive: true,
          updatedAt: new Date(),
          lastUsedAt: new Date(),
        },
      })
      .returning();

    console.log(`Token registrado com sucesso: ${deviceToken.id}`);

    res.json({
      success: true,
      message: 'Token registrado com sucesso',
      tokenId: deviceToken.id,
    });
  } catch (error) {
    console.error('Erro ao registrar token:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro ao registrar token de notificação',
    });
  }
});

/**
 * POST /api/push-notifications/unregister
 * Remove ou desativa token de dispositivo
 */
router.post('/unregister', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { platform } = req.body;

    console.log(`Removendo token do usuário ${userId}`);

    if (platform) {
      // Desativar token específico da plataforma
      await db
        .update(deviceTokens)
        .set({ 
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(deviceTokens.userId, userId),
            eq(deviceTokens.platform, platform)
          )
        );
    } else {
      // Desativar todos os tokens do usuário
      await db
        .update(deviceTokens)
        .set({ 
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(deviceTokens.userId, userId));
    }

    res.json({
      success: true,
      message: 'Token removido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover token:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao remover token de notificação',
    });
  }
});

/**
 * GET /api/push-notifications/status
 * Verifica status das notificações para o usuário
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    const tokens = await db
      .select()
      .from(deviceTokens)
      .where(
        and(
          eq(deviceTokens.userId, userId),
          eq(deviceTokens.isActive, true)
        )
      );

    const platformStatus = {
      ios: false,
      android: false,
      web: false,
    };

    tokens.forEach(token => {
      platformStatus[token.platform as keyof typeof platformStatus] = true;
    });

    res.json({
      success: true,
      enabled: tokens.length > 0,
      platforms: platformStatus,
      tokensCount: tokens.length,
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar status das notificações',
    });
  }
});

/**
 * DELETE /api/push-notifications/tokens/:platform
 * Remove token de uma plataforma específica
 */
router.delete('/tokens/:platform', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const platform = req.params.platform;

    if (!['ios', 'android', 'web'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'Plataforma inválida',
      });
    }

    await db
      .delete(deviceTokens)
      .where(
        and(
          eq(deviceTokens.userId, userId),
          eq(deviceTokens.platform, platform)
        )
      );

    res.json({
      success: true,
      message: `Token da plataforma ${platform} removido com sucesso`,
    });
  } catch (error) {
    console.error('Erro ao deletar token:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar token',
    });
  }
});

export default router;