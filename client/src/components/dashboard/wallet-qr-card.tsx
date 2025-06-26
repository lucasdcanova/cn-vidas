import { useState } from 'react';
import { QrCode, Wallet, Loader2 } from 'lucide-react';
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

interface WalletQRCardProps {
  userName: string;
  userEmail: string;
  userId: number;
  planType: string;
  qrCode: string;
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
      {/* Botão discreto sem moldura */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        Ver
        <QrCode className="h-3.5 w-3.5" />
      </button>

      {/* Dialog com preview do Wallet Pass */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar à Wallet</DialogTitle>
            <DialogDescription>
              Adicione seu cartão de membro CN Vidas à Wallet do iPhone para acesso rápido.
            </DialogDescription>
          </DialogHeader>

          {/* Preview do cartão */}
          <Card 
            className="relative overflow-hidden"
            style={{ 
              backgroundColor: planInfo.color.backgroundColor,
              color: planInfo.color.foregroundColor 
            }}
          >
            <div className="p-6 space-y-4">
              {/* Header com logo */}
              <div className="flex items-start justify-between">
                <div>
                  <img 
                    src="/cnvidas-logo-white.svg" 
                    alt="CN Vidas" 
                    className="h-8 w-auto"
                    style={{ 
                      filter: planInfo.color.foregroundColor === 'rgb(0, 0, 0)' ? 'invert(1)' : 'none' 
                    }}
                  />
                  <p className="text-xs mt-1 opacity-75">Telemedicina</p>
                </div>
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{ 
                    backgroundColor: `${planInfo.color.labelColor}33`,
                    color: planInfo.color.foregroundColor 
                  }}
                >
                  {planInfo.name}
                </Badge>
              </div>

              {/* Informações do membro */}
              <div className="space-y-1">
                <p className="text-xs opacity-75">MEMBRO</p>
                <p className="text-lg font-semibold">{userName}</p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-3 rounded-lg w-fit mx-auto">
                <QRCode 
                  value={qrCode} 
                  size={120}
                  level="M"
                />
              </div>

              {/* ID do membro */}
              <div className="text-center">
                <p className="text-xs opacity-75">ID DO MEMBRO</p>
                <p className="font-mono">CNV{userId.toString().padStart(6, '0')}</p>
              </div>
            </div>
          </Card>

          {/* Botão para adicionar à Wallet */}
          <Button
            onClick={handleAddToWallet}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Pass...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Adicionar à Wallet
              </>
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