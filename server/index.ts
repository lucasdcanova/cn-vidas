import 'dotenv/config'; // Garantir que as variáveis de ambiente sejam carregadas primeiro
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
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
import fs from 'fs';

(async () => {
  const app = express();
  const server = createServer(app);

  // Configuração de CORS
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://cnvidas.com', 'https://www.cnvidas.com']
      : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Auth-Token', 'X-Session-ID'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 horas
  };
  
  app.use(cors(corsOptions));

  // Configurações básicas
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser());

  // Configurar timeout para uploads
  app.use('/api/*/profile-image', (req, res, next) => {
    req.setTimeout(120000); // 2 minutos para uploads
    res.setTimeout(120000);
    next();
  });

  app.use('/api/profile/upload-image', (req, res, next) => {
    req.setTimeout(120000); // 2 minutos para uploads
    res.setTimeout(120000);
    next();
  });


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

  // Servir arquivos estáticos do diretório public (incluindo uploads) - ANTES do middleware JSON
  console.log('🖼️ Configurando diretório de arquivos estáticos...');
  const publicPath = path.join(process.cwd(), 'public');
  
  // Adicionar handler específico para uploads com CORS
  app.use('/uploads', (req, res, next) => {
    // Adicionar headers CORS para imagens
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Cache-Control', 'public, max-age=86400'); // Cache de 1 dia
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });
  
  // Middleware específico para verificar se arquivos de upload existem
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(publicPath, req.url);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Arquivo de upload não encontrado: ${req.url}`);
      
      // Se for uma imagem de perfil, retornar 404 com informação útil
      if (req.url.includes('profile-')) {
        return res.status(404).json({
          error: 'Imagem de perfil não encontrada',
          message: 'A imagem solicitada não existe no servidor',
          path: req.url,
          timestamp: new Date().toISOString()
        });
      }
      
      // Para outros arquivos, retornar 404 padrão
      return res.status(404).json({
        error: 'Arquivo não encontrado',
        path: req.url
      });
    }
    
    next();
  });
  
  app.use(express.static(publicPath, {
    maxAge: '1d', // Cache de 1 dia para imagens
    etag: true,
    lastModified: true,
    index: false // Não servir index.html automaticamente
  }));
  console.log(`✅ Arquivos estáticos servidos de: ${publicPath}`);

  // Middleware para garantir respostas JSON (APENAS para rotas da API)
  app.use('/api', ensureJsonResponse);

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
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, '0.0.0.0', () => {
    log(`Servidor rodando na porta ${PORT}`, 'server');
    console.log(`Acesse: http://localhost:${PORT}`);
    console.log(`Ou: http://127.0.0.1:${PORT}`);
  });
})();