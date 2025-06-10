import 'dotenv/config'; // Garantir que as variáveis de ambiente sejam carregadas primeiro
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import setupRoutes from './routes/index';
import { setupVite, serveStatic, log } from "./vite";
import { setupSubscriptionPlans } from "./migrations/plans-setup";
import { ensureJsonResponse } from "./middleware/json-response";
import { errorHandler } from "./middleware/error-handler";
import { verifyEmailConnection } from "./services/email";
import path from "path";
import { storage } from "./storage";
import { pool, db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

(async () => {
  const app = express();
  const server = createServer(app);

  // Configurações básicas
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());


  // Middleware global para processamento de tokens JWT
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as any;
    
    // Debug: log da requisição
    if (req.url.includes('/api/subscription/current') || req.url.includes('/api/admin/')) {
      console.log('🔍 Middleware JWT Global - Processando:', req.url);
      console.log('🔍 Cookies:', req.cookies);
      console.log('🔍 Headers auth:', req.headers.authorization);
      console.log('🔍 Header x-auth-token:', req.headers['x-auth-token']);
    }
    
    // Se já está autenticado via sessão, continuar
    if (authReq.user) {
      if (req.url.includes('/api/subscription/current') || req.url.includes('/api/admin/')) {
        console.log('✅ Já autenticado via sessão:', authReq.user.email);
      }
      return next();
    }
    
    // Verificar token JWT nos headers
    const authToken = req.headers['x-auth-token'] as string || 
                     (req.headers.authorization?.startsWith('Bearer ') 
                      ? req.headers.authorization.substring(7) 
                      : null);
    
    if (authToken) {
      if (req.url.includes('/api/subscription/current') || req.url.includes('/api/admin/')) {
        console.log('🔍 Token encontrado nos headers:', authToken.substring(0, 20) + '...');
      }
      try {
        const jwtSecret = process.env.JWT_SECRET || 'REDACTED_JWT_FALLBACK_PLACEHOLDER';
        if (req.url.includes('/api/subscription/current')) {
          console.log('🔍 Usando segredo JWT:', jwtSecret.substring(0, 10) + '...');
        }
        
        const decoded: any = jwt.verify(authToken, jwtSecret);
        if (req.url.includes('/api/subscription/current')) {
          console.log('🔍 Token decodificado:', decoded);
        }
        
        if (decoded && decoded.userId) {
          try {
            // Buscar dados completos do usuário do banco de dados
            const result = await db.select().from(users).where(eq(users.id, decoded.userId));
            const user = result[0];
            
            if (user) {
              authReq.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                username: user.username,
                emailVerified: user.emailVerified,
                subscriptionPlan: user.subscriptionPlan,
                subscriptionStatus: user.subscriptionStatus,
                emergencyConsultationsLeft: user.emergencyConsultationsLeft,
                emergencyConsultationsResetAt: user.emergencyConsultationsResetAt,
                profileImage: user.profileImage,
                phone: user.phone,
                cpf: user.cpf,
                cnpj: user.cnpj,
                city: user.city,
                state: user.state,
                address: user.address,
                zipcode: user.zipcode
              };
              console.log(`🔐 JWT: Usuário ${decoded.email} autenticado via header com plano ${user.subscriptionPlan}`);
            }
          } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            // Em caso de erro, usar dados básicos do token
            authReq.user = {
              id: decoded.userId,
              email: decoded.email,
              role: decoded.role,
              fullName: decoded.fullName || decoded.email,
              username: decoded.username || decoded.email,
              emailVerified: true
            };
          }
        }
      } catch (jwtError) {
        if (req.url.includes('/api/subscription/current')) {
          console.error('❌ Erro ao verificar token JWT:', jwtError.message);
        }
        // Token inválido - continuar sem autenticação
      }
    }
    
    // Verificar cookies de sessão se não encontrou token nos headers
    if (!authReq.user && req.cookies && req.cookies.auth_token) {
      if (req.url.includes('/api/subscription/current')) {
        console.log('🔍 Verificando cookie auth_token:', req.cookies.auth_token.substring(0, 20) + '...');
      }
      try {
        const jwtSecret = process.env.JWT_SECRET || 'REDACTED_JWT_FALLBACK_PLACEHOLDER';
        const decoded: any = jwt.verify(req.cookies.auth_token, jwtSecret);
        
        if (req.url.includes('/api/subscription/current')) {
          console.log('🔍 Cookie decodificado:', decoded);
        }
        
        if (decoded && decoded.userId) {
          try {
            // Buscar dados completos do usuário do banco de dados
            const result = await db.select().from(users).where(eq(users.id, decoded.userId));
            const user = result[0];
            
            if (user) {
              authReq.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                username: user.username,
                emailVerified: user.emailVerified,
                subscriptionPlan: user.subscriptionPlan,
                subscriptionStatus: user.subscriptionStatus,
                emergencyConsultationsLeft: user.emergencyConsultationsLeft,
                emergencyConsultationsResetAt: user.emergencyConsultationsResetAt,
                profileImage: user.profileImage,
                phone: user.phone,
                cpf: user.cpf,
                cnpj: user.cnpj,
                city: user.city,
                state: user.state,
                address: user.address,
                zipcode: user.zipcode
              };
              console.log(`🔐 JWT: Usuário ${decoded.email} autenticado via cookie com plano ${user.subscriptionPlan}`);
            }
          } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            // Em caso de erro, usar dados básicos do token
            authReq.user = {
              id: decoded.userId,
              email: decoded.email,
              role: decoded.role,
              fullName: decoded.fullName || decoded.email,
              username: decoded.username || decoded.email,
              emailVerified: true
            };
          }
        }
      } catch (jwtError) {
        if (req.url.includes('/api/subscription/current')) {
          console.error('❌ Erro ao verificar cookie JWT:', jwtError.message);
        }
        // Token inválido - continuar sem autenticação
      }
    }
    
    if (req.url.includes('/api/subscription/current')) {
      console.log('🔍 Final do middleware - Usuário autenticado?', !!authReq.user);
    }
    
    next();
  });

  // Health check route (before authentication)
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Middleware para garantir respostas JSON
  app.use(ensureJsonResponse);

  // Configurar todas as rotas
  await setupRoutes(app);

  // Middleware de tratamento de erros (deve ser o último)
  app.use(errorHandler);

  // Configuração do Vite em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Verificar conexão com email
  verifyEmailConnection().catch(console.error);

  // Configurar planos de assinatura
  // setupSubscriptionPlans().catch(console.error); // Temporariamente desabilitado devido ao timeout

  // Iniciar servidor
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    log(`Servidor rodando na porta ${PORT}`, 'server');
  });
})();