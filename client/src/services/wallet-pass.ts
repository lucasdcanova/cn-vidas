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

// Cores dos planos seguindo as diretrizes da Apple - Design Premium
const planColors: PlanColors = {
  basic: {
    backgroundColor: 'rgb(37, 99, 235)', // Azul vibrante
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(191, 219, 254)'
  },
  standard: {
    backgroundColor: 'rgb(147, 51, 234)', // Roxo vibrante
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(221, 214, 254)'
  },
  premium: {
    backgroundColor: 'rgb(245, 158, 11)', // Dourado premium
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(254, 243, 199)'
  },
  family_basic: {
    backgroundColor: 'rgb(34, 197, 94)', // Verde esmeralda
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(187, 247, 208)'
  },
  family_plus: {
    backgroundColor: 'rgb(236, 72, 153)', // Rosa vibrante
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(251, 207, 232)'
  },
  ultra_family: {
    backgroundColor: 'rgb(99, 102, 241)', // Índigo premium
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(224, 231, 255)'
  },
  medical: {
    backgroundColor: 'rgb(6, 182, 212)', // Ciano médico
    foregroundColor: 'rgb(255, 255, 255)',
    labelColor: 'rgb(207, 250, 254)'
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
      console.log('[WalletPass] Iniciando download do pass', {
        planName: passData.planName,
        userId: passData.userId,
        isNative: this.isNative,
        platform: Capacitor.getPlatform()
      });

      // Fazer chamada para o servidor para gerar o .pkpass
      const response = await fetch('/api/wallet/generate-pass', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Auth-Token': localStorage.getItem('authToken') || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          planName: passData.planName,
          qrCode: passData.qrCode
        })
      });

      console.log('[WalletPass] Resposta do servidor:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[WalletPass] Erro do servidor:', error);
        throw new Error(error.error || 'Erro ao gerar pass');
      }

      // Baixar o arquivo .pkpass
      const blob = await response.blob();
      console.log('[WalletPass] Blob recebido:', blob.size, 'bytes');
      
      // No iOS nativo, usar window.open para abrir o .pkpass
      if (this.isNative && Capacitor.getPlatform() === 'ios') {
        console.log('[WalletPass] Usando método iOS nativo com window.open');
        
        // Converter blob para base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        return new Promise<boolean>((resolve, reject) => {
          reader.onloadend = () => {
            try {
              const base64 = reader.result as string;
              console.log('[WalletPass] Base64 gerado, tamanho:', base64.length);
              
              // Remover o prefixo data:application/octet-stream;base64, se existir
              const base64Data = base64.split(',')[1] || base64;
              
              // Criar um novo data URL com o tipo MIME correto
              const pkpassDataUrl = `data:application/vnd.apple.pkpass;base64,${base64Data}`;
              
              console.log('[WalletPass] Abrindo pass com window.open...');
              
              // Usar window.open para abrir o arquivo
              // No iOS, isso deve abrir o diálogo do Wallet
              window.open(pkpassDataUrl, '_blank');
              
              resolve(true);
            } catch (err) {
              console.error('[WalletPass] Erro ao processar base64:', err);
              reject(err);
            }
          };
          
          reader.onerror = (err) => {
            console.error('[WalletPass] Erro ao ler blob:', err);
            reject(err);
          };
        });
      } else {
        // No navegador desktop, fazer download normal
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cnvidas-${passData.userId}.pkpass`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Limpar URL temporária
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao gerar wallet pass:', error);
      throw error;
    }
  }

  // Verificar se Wallet está disponível
  isAvailable(): boolean {
    // Wallet está disponível apenas no iOS
    return this.isNative && Capacitor.getPlatform() === 'ios';
  }

  // Adicionar à Wallet (método principal)
  async addToWallet(data: WalletPassData): Promise<boolean> {
    return this.downloadPass(data);
  }
}

export const walletPassService = new WalletPassService();