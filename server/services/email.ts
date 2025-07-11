import nodemailer from 'nodemailer';
import { verificationEmailTemplate, passwordResetEmailTemplate } from './email-templates';

// Verificar se todas as variáveis de ambiente necessárias estão definidas
if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
  console.error('Erro: Variáveis de ambiente de email não estão configuradas corretamente.');
  console.error('Por favor, defina EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME e EMAIL_PASSWORD');
}

// Configurações de email
const emailConfig = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Aceita certificados auto-assinados (apenas para desenvolvimento)
  }
};

// Criar o transportador de email
const transporter = nodemailer.createTransport(emailConfig);

// Verificar a conexão com o servidor de email
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
      console.error('Não foi possível verificar a conexão com o servidor de email: variáveis de ambiente incompletas');
      return false;
    }
    
    const verification = await transporter.verify();
    console.log('Configuração de email carregada. Serviço de email disponível.');
    return true;
  } catch (error) {
    console.error('Erro ao verificar conexão com servidor de email:', error);
    return false;
  }
}

// Interface para options do email
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Função para enviar email
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"CN Vidas" <${process.env.EMAIL_USERNAME}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado com sucesso:', info.messageId);
    return true;
  } catch (error: any) {
    // Tratar erro de DKIM especificamente
    if (error.code === 'EENVELOPE' && error.response?.includes('DKIM')) {
      console.warn('⚠️ Aviso: DKIM não configurado no DNS. Email não enviado, mas o registro continua.');
      console.warn('Para resolver: Configure o registro DKIM no DNS do domínio.');
    } else {
      console.error('Erro ao enviar email:', error);
    }
    return false;
  }
}

// Função para enviar email de verificação
export async function sendVerificationEmail(to: string, token: string): Promise<boolean> {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verificar-email?token=${token}`;
  const html = verificationEmailTemplate(verificationLink);

  return sendEmail({
    to,
    subject: '✨ Verifique seu email - CN Vidas',
    html
  });
}

// Função para enviar email de redefinição de senha
export async function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/redefinir-senha?token=${token}`;
  const html = passwordResetEmailTemplate(resetLink);

  return sendEmail({
    to,
    subject: '🔐 Redefinição de Senha - CN Vidas',
    html
  });
}