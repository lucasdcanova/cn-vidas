import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

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
      
      // No iOS nativo, usar App.openUrl para abrir externamente
      if (this.isNative && Capacitor.getPlatform() === 'ios') {
        console.log('[WalletPass] Usando App.openUrl para iOS');
        
        try {
          // Criar URL completa com o servidor da API
          const apiUrl = 'https://www.homologacao.cnvidas.com.br';
          const authToken = localStorage.getItem('authToken');
          const downloadUrl = `${apiUrl}/api/wallet/download-pass?planName=${passData.planName}&qrCode=${encodeURIComponent(passData.qrCode)}&token=${authToken}`;
          
          console.log('[WalletPass] Abrindo URL externamente:', downloadUrl);
          
          // Usar App.openUrl para abrir no Safari externo
          // Isso força o Safari a baixar e processar o .pkpass
          await App.openUrl({ url: downloadUrl });
          
          console.log('[WalletPass] URL aberta com sucesso');
          return true;
        } catch (error) {
          console.error('[WalletPass] Erro ao abrir URL:', error);
          
          // Fallback 1: Tentar criar um link temporário e forçar download
          try {
            console.log('[WalletPass] Tentando fallback com link temporário');
            
            // Salvar o blob em base64
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            
            await new Promise((resolve) => {
              reader.onloadend = resolve;
            });
            
            const base64Data = reader.result as string;
            
            // Criar um botão visível para o usuário clicar
            const downloadButton = document.createElement('button');
            downloadButton.textContent = 'Baixar Cartão para Wallet';
            downloadButton.style.cssText = `
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              z-index: 999999;
              background: #007AFF;
              color: white;
              padding: 16px 32px;
              font-size: 18px;
              font-weight: bold;
              border: none;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            
            // Adicionar evento de clique
            downloadButton.onclick = async () => {
              // Tentar abrir a URL novamente
              const apiUrl = 'https://cnvidas.onrender.com';
              const authToken = localStorage.getItem('authToken');
              const downloadUrl = `${apiUrl}/api/wallet/download-pass?planName=${passData.planName}&qrCode=${encodeURIComponent(passData.qrCode)}&token=${authToken}`;
              
              window.location.href = downloadUrl;
              
              // Remover botão após clique
              setTimeout(() => {
                document.body.removeChild(downloadButton);
              }, 1000);
            };
            
            document.body.appendChild(downloadButton);
            
            // Remover botão após 10 segundos se não for clicado
            setTimeout(() => {
              if (document.body.contains(downloadButton)) {
                document.body.removeChild(downloadButton);
              }
            }, 10000);
            
            return true;
          } catch (fallbackError) {
            console.error('[WalletPass] Erro no fallback:', fallbackError);
            throw new Error('Não foi possível adicionar o cartão ao Wallet');
          }
        }
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