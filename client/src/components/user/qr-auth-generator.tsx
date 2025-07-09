import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import { generateQrToken } from '@/lib/api';
import { Capacitor } from '@capacitor/core';

interface QRAuthToken {
  qrCode: string;
}

const QRAuthGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrToken, setQrToken] = useState<QRAuthToken | null>(null);
  const [loading, setLoading] = useState(true);
  const isNative = Capacitor.isNativePlatform();

  // Buscar o QR code permanente do usuário
  const fetchUserQRCode = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await generateQrToken();
      setQrToken(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar QR Code",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar QR code quando componente é montado
  useEffect(() => {
    if (user) {
      fetchUserQRCode();
    }
  }, [user]);

  if (loading && !qrToken) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Badge variant="outline" className="bg-green-50 text-green-700">
          QR Code Permanente
        </Badge>
      </div>
      
      <div className="flex justify-center">
        {qrToken && qrToken.qrCode ? (
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <QRCode 
              value={qrToken.qrCode} 
              size={240}
              level="H"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center p-10 text-center">
            <p className="text-muted-foreground mb-4">
              O código QR não está disponível.
            </p>
          </div>
        )}
      </div>
      
      {!isNative && (
        <div className="text-center text-sm text-muted-foreground">
          <QrCode className="h-4 w-4 inline mr-1" />
          Seu código QR é único e permanente
        </div>
      )}
    </div>
  );
};

export default QRAuthGenerator;