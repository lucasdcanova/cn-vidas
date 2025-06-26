import { useState } from 'react';
import { QrCode, Wallet, Loader2, Shield, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { walletPassService } from '@/services/wallet-pass';
import QRCode from 'react-qr-code';
import { Capacitor } from '@capacitor/core';
import cnvidasLogo from '@/assets/cnvidas-logo-transparent.png';

interface WalletQRCardProps {
  userName: string;
  userEmail: string;
  userId: number;
  planType: string;
  qrCode: string;
}

// Função para ajustar brilho da cor
function adjustColor(color: string, amount: number): string {
  const rgb = color.match(/\d+/g);
  if (!rgb || rgb.length < 3) return color;
  
  const r = Math.max(0, Math.min(255, parseInt(rgb[0]) + amount));
  const g = Math.max(0, Math.min(255, parseInt(rgb[1]) + amount));
  const b = Math.max(0, Math.min(255, parseInt(rgb[2]) + amount));
  
  return `rgb(${r}, ${g}, ${b})`;
}

export function WalletQRCard({ userName, userEmail, userId, planType, qrCode }: WalletQRCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const isIOS = Capacitor.getPlatform() === 'ios';

  const planInfo = {
    name: walletPassService.getPlanDisplayName(planType),
    color: walletPassService.getPlanColor(planType)
  };

  const handleAddToWallet = async () => {
    setIsGenerating(true);
    try {
      const success = await walletPassService.downloadPass({
        userId,
        userName,
        userEmail,
        planName: planType,
        planColor: planInfo.color.backgroundColor,
        qrCode
      });

      if (success) {
        toast({
          title: isIOS ? 'Pass gerado' : 'Download iniciado',
          description: isIOS 
            ? 'O pass será aberto automaticamente. Toque em "Adicionar" para salvar na Wallet.'
            : 'O arquivo .pkpass foi baixado. Abra-o no seu iPhone para adicionar à Wallet.',
        });
        setIsOpen(false);
      } else {
        throw new Error('Falha ao gerar pass');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o pass para a Wallet.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Botão elegante com animação */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-all duration-200 hover:shadow-md"
      >
        <QrCode className="h-4 w-4" />
        <span>Ver Cartão</span>
        <Sparkles className="h-3 w-3 text-yellow-500" />
      </button>

      {/* Dialog com preview do Wallet Pass */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-gray-50 to-gray-100 border-0">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Adicionar à Apple Wallet
            </DialogTitle>
            <DialogDescription className="text-base">
              Tenha seu cartão CN Vidas sempre à mão no iPhone e Apple Watch
            </DialogDescription>
          </DialogHeader>

          {/* Preview do cartão - Design Premium */}
          <div className="relative">
            {/* Brilho decorativo */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-25 animate-pulse" />
            
            <Card 
              className="relative overflow-hidden shadow-2xl rounded-2xl border-0"
              style={{ 
                background: `linear-gradient(135deg, ${planInfo.color.backgroundColor} 0%, ${adjustColor(planInfo.color.backgroundColor, -20)} 100%)`,
                color: planInfo.color.foregroundColor 
              }}
            >
              {/* Padrão decorativo de fundo */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <circle cx="5" cy="5" r="1" fill="currentColor" />
                  </pattern>
                  <rect width="100" height="100" fill="url(#grid)" />
                </svg>
              </div>

              <div className="relative p-8 space-y-6">
                {/* Header Premium */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    {/* Logo com fundo branco para contraste */}
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 w-fit shadow-lg">
                      <img 
                        src={cnvidasLogo}
                        alt="CN Vidas" 
                        className="h-10 w-auto"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 opacity-80" />
                      <p className="text-sm font-medium opacity-90">Telemedicina Premium</p>
                    </div>
                  </div>
                  
                  {/* Badge do Plano com Design Premium */}
                  <div className="text-right space-y-1">
                    <Badge 
                      className="px-3 py-1 text-xs font-bold shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${planInfo.color.labelColor}40 0%, ${planInfo.color.labelColor}60 100%)`,
                        color: planInfo.color.foregroundColor,
                        border: `1px solid ${planInfo.color.labelColor}80`
                      }}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {planInfo.name.toUpperCase()}
                    </Badge>
                    {planType === 'ultra_family' && (
                      <div className="flex items-center justify-end gap-1 text-xs opacity-80">
                        <Star className="h-3 w-3 fill-current" />
                        <span>Plano VIP</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações do membro com estilo aprimorado */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold opacity-70 tracking-wider">TITULAR DO PLANO</p>
                  <p className="text-2xl font-bold tracking-tight">{userName}</p>
                  <p className="text-sm opacity-80">{userEmail}</p>
                </div>

                {/* QR Code com moldura premium */}
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-2xl shadow-xl">
                    <QRCode 
                      value={qrCode} 
                      size={140}
                      level="H"
                      fgColor="#1a1a1a"
                    />
                  </div>
                </div>

                {/* ID do membro com design moderno */}
                <div className="bg-black/10 backdrop-blur-sm rounded-xl p-4 text-center space-y-1">
                  <p className="text-xs font-semibold opacity-70 tracking-wider">IDENTIFICAÇÃO ÚNICA</p>
                  <p className="font-mono text-xl font-bold tracking-wider">
                    CNV{userId.toString().padStart(6, '0')}
                  </p>
                  <p className="text-xs opacity-70">Válido em toda rede credenciada</p>
                </div>

                {/* Benefícios do plano */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {planType === 'ultra_family' ? (
                    <>
                      <div className="text-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <p className="text-xs opacity-70">Consultas</p>
                        <p className="text-sm font-bold">ILIMITADAS</p>
                      </div>
                      <div className="text-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <p className="text-xs opacity-70">Cobertura</p>
                        <p className="text-sm font-bold">NACIONAL</p>
                      </div>
                    </>
                  ) : planType === 'premium' ? (
                    <>
                      <div className="text-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <p className="text-xs opacity-70">Consultas</p>
                        <p className="text-sm font-bold">10/MÊS</p>
                      </div>
                      <div className="text-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <p className="text-xs opacity-70">Urgência</p>
                        <p className="text-sm font-bold">24H</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <p className="text-xs opacity-70">Consultas</p>
                        <p className="text-sm font-bold">{planType === 'basic' ? '3/MÊS' : '5/MÊS'}</p>
                      </div>
                      <div className="text-center p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <p className="text-xs opacity-70">Validade</p>
                        <p className="text-sm font-bold">30 DIAS</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Botão para adicionar à Wallet - Design Apple */}
          <Button
            onClick={handleAddToWallet}
            disabled={isGenerating}
            className="w-full bg-black hover:bg-gray-900 text-white font-medium py-6 text-base shadow-xl transition-all duration-200 hover:scale-[1.02]"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Gerando Pass...
              </>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Wallet className="h-6 w-6" />
                <span>Adicionar à Wallet</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </Button>

          {!isIOS && (
            <p className="text-xs text-center text-muted-foreground">
              Após o download, abra o arquivo .pkpass no seu iPhone para adicionar à Wallet
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}