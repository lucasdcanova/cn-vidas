import 'dotenv/config'; // Garantir que as variáveis de ambiente sejam carregadas primeiro
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from 'http';
import setupRoutes from './routes/index';
import { setupVite, serveStatic, log } from "./vite";
import { setupSubscriptionPlans } from "./migrations/plans-setup";
import { ensureJsonResponse } from "./middleware/json-response";
import { errorHandler } from "./middleware/error-handler";
import { verifyEmailConnection } from "./services/email";
import path from "path";
import { storage } from "./storage";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import { setupAuth } from "./auth";
import { pool, db } from "./db";
import connectPg from "connect-pg-simple";
import jwt from "jsonwebtoken";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

(async () => {
  const app = express();
  const server = createServer(app);

  // Configurações básicas
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }));

  // Configuração de sessão
  app.use(session({
    store: new (connectPg(session))({
      pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'cn-vidas-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
  }));

  // Configuração do Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configurar autenticação
  setupAuth(app);

  // Middleware global para processamento de tokens JWT
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as any;
    
    // Debug: log da requisição
    if (req.url.includes('/api/subscription/current')) {
      console.log('🔍 Middleware JWT Global - Processando:', req.url);
      console.log('🔍 Cookies:', req.cookies);
      console.log('🔍 Headers auth:', req.headers.authorization);
      console.log('🔍 Header x-auth-token:', req.headers['x-auth-token']);
    }
    
    // Se já está autenticado via sessão, continuar
    if (authReq.user) {
      if (req.url.includes('/api/subscription/current')) {
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
      if (req.url.includes('/api/subscription/current')) {
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
          // Usar dados do token JWT diretamente (evitar consulta ao banco)
          authReq.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            fullName: decoded.fullName || decoded.email,
            username: decoded.username || decoded.email,
            emailVerified: true
          };
          console.log(`🔐 JWT: Usuário ${decoded.email} autenticado via header`);
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
          // Usar dados do token JWT diretamente (evitar consulta ao banco)
          authReq.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            fullName: decoded.fullName || decoded.email,
            username: decoded.username || decoded.email,
            emailVerified: true
          };
          console.log(`🔐 JWT: Usuário ${decoded.email} autenticado via cookie`);
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