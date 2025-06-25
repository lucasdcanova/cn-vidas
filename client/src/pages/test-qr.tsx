import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { generateQrToken } from '@/lib/api';
import { Capacitor } from '@capacitor/core';
import { WalletQRCard } from '@/components/dashboard/wallet-qr-card';

export function TestQRPage() {
  const { user } = useAuth();
  const isIOS = Capacitor.getPlatform() === 'ios';
  const platform = Capacitor.getPlatform();
  
  const { data: qrData, isLoading, error } = useQuery({
    queryKey: ["/api/users/qr-code"],
    queryFn: generateQrToken,
    enabled: !!user,
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Teste QR Code</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Plataforma:</strong> {platform}</p>
          <p><strong>É iOS:</strong> {isIOS ? 'Sim' : 'Não'}</p>
          <p><strong>Usuário:</strong> {user?.email || 'Não logado'}</p>
          <p><strong>Plano:</strong> {user?.subscriptionPlan || 'N/A'}</p>
        </div>

        {isLoading && <p>Carregando QR...</p>}
        {error && <p className="text-red-500">Erro: {error.message}</p>}
        
        {qrData && (
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>QR Data:</strong></p>
            <pre>{JSON.stringify(qrData, null, 2)}</pre>
          </div>
        )}

        <div className="border-2 border-dashed border-gray-300 p-4 rounded">
          <p className="mb-2">Componente WalletQRCard (força exibição):</p>
          {user && qrData?.qrCode && (
            <WalletQRCard
              userName={user.fullName || user.username || user.email || ''}
              userEmail={user.email || ''}
              userId={user.id}
              planType={user.subscriptionPlan || 'basic'}
              qrCode={qrData.qrCode}
            />
          )}
        </div>
      </div>
    </div>
  );
}