import { Capacitor } from '@capacitor/core';

export interface WalletPassData {
  userId: number;
  userName: string;
  userEmail: string;
  planName: string;
  planColor: string;
  qrCode: string;
}

export interface PlanColors {
  [key: string]: {
    backgroundColor: string;
    foregroundColor: string;
    labelColor: string;
  };
}

// Cores dos planos seguindo as diretrizes da Apple
const planColors: PlanColors = {
  basic: {
    backgroundColor: 'rgb(59, 130, 246)', // Blue
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(219, 234, 254)'
  },
  standard: {
    backgroundColor: 'rgb(168, 85, 247)', // Purple
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(233, 213, 255)'
  },
  premium: {
    backgroundColor: 'rgb(251, 191, 36)', // Amber
    foregroundColor: 'rgb(0, 0, 0)',
    labelColor: 'rgb(92, 51, 23)'
  },
  family_basic: {
    backgroundColor: 'rgb(34, 197, 94)', // Green
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(220, 252, 231)'
  },
  family_plus: {
    backgroundColor: 'rgb(236, 72, 153)', // Pink
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(252, 231, 243)'
  },
  ultra_family: {
    backgroundColor: 'rgb(79, 70, 229)', // Indigo
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(224, 231, 255)'
  },
  medical: {
    backgroundColor: 'rgb(14, 165, 233)', // Sky
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(224, 242, 254)'
  }
};

// Mapear nomes dos planos para exibição
const planDisplayNames: { [key: string]: string } = {
  basic: 'Básico',
  standard: 'Padrão',
  premium: 'Premium',
  family_basic: 'Familiar Básico',
  family_plus: 'Familiar Plus',
  ultra_family: 'Ultra Familiar',
  medical: 'Plano Médico'
};

class WalletPassService {
  private isNative = Capacitor.isNativePlatform();

  getPlanColor(planType: string): typeof planColors.basic {
    return planColors[planType] || planColors.basic;
  }

  getPlanDisplayName(planType: string): string {
    return planDisplayNames[planType] || 'Plano Básico';
  }

  // Gerar dados do pass para enviar ao servidor
  generatePassData(data: WalletPassData) {
    const colors = this.getPlanColor(data.planName);
    
    return {
      passTypeIdentifier: 'pass.com.cnvidas.membership',
      teamIdentifier: 'YOUR_TEAM_ID', // Será substituído no servidor
      organizationName: 'CN Vidas',
      description: 'Cartão de Membro CN Vidas',
      logoText: 'CN Vidas',
      foregroundColor: colors.foregroundColor,
      backgroundColor: colors.backgroundColor,
      labelColor: colors.labelColor,
      
      // Estrutura do pass
      generic: {
        primaryFields: [
          {
            key: 'member',
            label: 'MEMBRO',
            value: data.userName
          }
        ],
        secondaryFields: [
          {
            key: 'plan',
            label: 'PLANO',
            value: this.getPlanDisplayName(data.planName)
          }
        ],
        auxiliaryFields: [
          {
            key: 'memberId',
            label: 'ID DO MEMBRO',
            value: `CNV${data.userId.toString().padStart(6, '0')}`
          }
        ],
        backFields: [
          {
            key: 'email',
            label: 'E-mail',
            value: data.userEmail
          },
          {
            key: 'website',
            label: 'Site',
            value: 'https://cnvidas.com.br'
          },
          {
            key: 'terms',
            label: 'Termos de Uso',
            value: 'Este cartão é pessoal e intransferível. Apresente-o aos parceiros CN Vidas para validação.'
          }
        ]
      },
      
      // QR Code
      barcode: {
        format: 'PKBarcodeFormatQR',
        message: data.qrCode,
        messageEncoding: 'iso-8859-1'
      },
      
      // Metadados
      relevantDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 ano
    };
  }

  // Fazer download do pass
  async downloadPass(passData: WalletPassData): Promise<boolean> {
    try {
      // Por enquanto, vamos criar um arquivo .pkpass simulado
      // Em produção, isso seria gerado no servidor com certificados da Apple
      
      if (this.isNative) {
        // No iOS, mostrar alerta informativo
        alert('Funcionalidade de Wallet em desenvolvimento.\n\nEm breve você poderá adicionar seu cartão CN Vidas à Wallet do iPhone!');
      } else {
        // No navegador, mostrar instruções
        alert('Para adicionar à Wallet:\n\n1. Acesse pelo seu iPhone\n2. Toque em "Ver QR Code"\n3. Toque em "Adicionar à Wallet"');
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao gerar wallet pass:', error);
      return false;
    }
  }
}

export const walletPassService = new WalletPassService();