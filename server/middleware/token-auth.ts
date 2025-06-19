import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { verifyToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types/authenticated-request';
import { toNumberOrThrow } from '../utils/id-converter';
import { storage } from '../storage';

/**
 * Middleware para autenticação via token
 * Este middleware verifica se existe um token de autenticação no header ou cookie
 * e autentica o usuário se o token for válido
 */
export const tokenAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new AppError('Token não fornecido', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      throw new AppError('Token inválido', 401);
    }

    const authReq = req as AuthenticatedRequest;
    const user = await storage.getUserById(toNumberOrThrow(decoded.id as string | number));
    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }
    // Map database user to AuthUser interface
    authReq.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      username: user.username || user.email,
      emailVerified: user.emailVerified,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      profileImage: user.profileImage,
      password: user.password,
      cpf: user.cpf,
      phone: user.phone,
      address: user.address,
      zipcode: user.zipcode,
      city: user.city,
      state: user.state,
      birthDate: user.birthDate,
      stripeCustomerId: user.stripeCustomerId,
      emergencyConsultationsLeft: user.emergencyConsultationsLeft,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      onboardingCompleted: user.onboardingCompleted,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      neighborhood: user.neighborhood,
      subscriptionChangedAt: user.subscriptionChangedAt,
      gender: user.gender,
      status: user.status,
      subscriptionPlanId: user.subscriptionPlanId,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      welcomeCompleted: user.welcomeCompleted,
      pixKeyType: user.pixKeyType,
      pixKey: user.pixKey,
      bankName: user.bankName,
      accountType: user.accountType
    };
    
    next();
  } catch (error) {
    next(new AppError('Token inválido', 401));
  }
};