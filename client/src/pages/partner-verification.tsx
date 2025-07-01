import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Camera, CheckCircle, XCircle, User, Sparkles, Shield } from 'lucide-react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
// TODO: Reabilitar PartnerOnboardingGuard após corrigir o problema de loop infinito
// import { PartnerOnboardingGuard } from '@/components/partner/partner-onboarding-guard';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import cnvidasLogo from '@/assets/cnvidas-logo-transparent.png';

export default function PartnerVerification() {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<any>(null);
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Cleanup ao desmontar o componente
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      
      // Aguardar um pouco para o DOM atualizar
      setTimeout(() => {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        
        scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // QR Code lido com sucesso
            stopScanning();
            verifyQRCode(decodedText);
          },
          (errorMessage) => {
            // Ignorar erros de leitura contínua
          }
        ).then(() => {
          toast({
            title: 'Scanner Ativo',
            description: 'Posicione o QR Code na frente da câmera'
          });
        }).catch((err) => {
          console.error('Erro ao iniciar scanner:', err);
          setIsScanning(false);
          toast({
            title: 'Erro de Câmera',
            description: 'Não foi possível acessar a câmera. Verifique as permissões.',
            variant: 'destructive'
          });
        });
      }, 100);
    } catch (error) {
      console.error('Erro ao iniciar scanner:', error);
      setIsScanning(false);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o scanner',
        variant: 'destructive'
      });
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current = null;
        setIsScanning(false);
      }).catch((err) => {
        console.error('Erro ao parar scanner:', err);
        setIsScanning(false);
      });
    } else {
      setIsScanning(false);
    }
  };

  const verifyQRCode = async (code: string) => {
    setLoading(true);
    setVerificationResult(null);

    try {
      const response = await fetch('/api/users/verify-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: code })
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setVerificationResult({
          valid: true,
          user: data.user,
          plan: data.user.subscriptionPlan || 'free',
          expiresAt: null
        });
        
        // Mostrar animação de sucesso
        setVerifiedUser(data.user);
        setShowSuccessAnimation(true);
        
        // Remover a animação após 3 segundos
        setTimeout(() => {
          setShowSuccessAnimation(false);
        }, 3000);
        
        toast({
          title: 'Verificação Bem-sucedida',
          description: `Usuário ${data.user.fullName} verificado com sucesso`
        });
      } else {
        setVerificationResult({
          valid: false,
          error: data.error || 'QR Code inválido ou expirado'
        });
        
        toast({
          title: 'Verificação Falhou',
          description: data.error || 'QR Code inválido ou expirado',
          variant: 'destructive'
        });
      }
    } catch (error) {
      setVerificationResult({
        valid: false,
        error: 'Erro de conexão'
      });
      
      toast({
        title: 'Erro',
        description: 'Não foi possível verificar o QR Code',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerification = () => {
    if (!manualCode.trim()) {
      toast({
        title: 'Código Necessário',
        description: 'Por favor, insira o código QR para verificação',
        variant: 'destructive'
      });
      return;
    }
    
    verifyQRCode(manualCode.trim());
  };

  return (
    // TODO: Reabilitar PartnerOnboardingGuard após corrigir o problema de loop infinito
    // <PartnerOnboardingGuard>
      <DashboardLayout>
      {/* Animação de Sucesso */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <Card className="p-8 md:p-12 max-w-md mx-auto backdrop-blur-sm bg-white/95 shadow-2xl border-0">
                <div className="text-center space-y-6">
                  {/* Logo animado */}
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="flex justify-center mb-8"
                  >
                    <img 
                      src={cnvidasLogo} 
                      alt="CN Vidas" 
                      className="h-24 w-auto"
                    />
                  </motion.div>

                  {/* Ícone de sucesso */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      delay: 0.2, 
                      type: "spring",
                      stiffness: 200,
                      damping: 10
                    }}
                    className="flex justify-center"
                  >
                    <div className="bg-green-100 p-4 rounded-full">
                      <CheckCircle className="h-16 w-16 text-green-600" />
                    </div>
                  </motion.div>

                  {/* Mensagem de sucesso */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
                    <h2 className="text-2xl font-bold text-gray-900">
                      Verificação Concluída!
                    </h2>
                    <p className="text-gray-600">
                      QR Code verificado com sucesso
                    </p>
                  </motion.div>

                  {/* Informações do usuário verificado */}
                  {verifiedUser && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gray-50 p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <User className="h-5 w-5 text-gray-600" />
                        <p className="font-semibold text-gray-900">
                          {verifiedUser.fullName}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">
                        Plano: <span className="font-medium capitalize">
                          {verifiedUser.subscriptionPlan || 'Free'}
                        </span>
                      </p>
                    </motion.div>
                  )}

                  {/* Efeitos decorativos */}
                  <motion.div
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10"
                  >
                    <Sparkles className="h-32 w-32 text-green-500" />
                  </motion.div>

                  <motion.div
                    animate={{
                      rotate: -360,
                    }}
                    transition={{
                      duration: 25,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute bottom-0 left-0 -ml-16 -mb-16 opacity-10"
                  >
                    <Shield className="h-32 w-32 text-blue-500" />
                  </motion.div>
                </div>
              </Card>
            </motion.div>

            {/* Background com partículas animadas */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * window.innerWidth,
                    y: window.innerHeight + 100,
                  }}
                  animate={{ 
                    y: -100,
                  }}
                  transition={{
                    duration: Math.random() * 10 + 5,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: "linear",
                  }}
                  className="absolute w-2 h-2 bg-green-400 rounded-full opacity-20"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto py-4 md:py-8 px-4 max-w-6xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 flex items-center gap-2 md:gap-3">
          <QrCode className="h-6 w-6 md:h-8 md:w-8" />
          Verificação de Usuários
        </h1>
        
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Scanner Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Camera className="h-4 w-4 md:h-5 md:w-5" />
              Scanner de QR Code
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Use a câmera para escanear o QR Code do cartão virtual do usuário
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {isScanning ? (
              <div className="space-y-4">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <div id="qr-reader" className="w-full h-full" />
                </div>
                
                <Button 
                  variant="destructive" 
                  onClick={stopScanning}
                  className="w-full"
                >
                  Parar Scanner
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center border">
                  <div className="text-center p-4">
                    <QrCode className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 text-sm md:text-base">Scanner Inativo</p>
                  </div>
                </div>
                
                <Button 
                  onClick={startScanning}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Iniciar Scanner
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Input Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-base md:text-lg">Verificação Manual</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Digite o código QR manualmente se o scanner não estiver funcionando
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-code">Código QR</Label>
              <Input
                id="manual-code"
                placeholder="Digite ou cole o código aqui..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleManualVerification}
              disabled={loading || !manualCode.trim()}
              className="w-full"
            >
              {loading ? 'Verificando...' : 'Verificar Código'}
            </Button>
          </CardContent>
        </Card>
      </div>

        {/* Verification Result */}
        {verificationResult && (
          <Card className="mt-4 md:mt-6 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {verificationResult.valid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Resultado da Verificação
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {verificationResult.valid ? (
              <Alert className="border-green-200 bg-green-50">
                <User className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="text-sm md:text-base"><strong>Usuário Verificado:</strong> {verificationResult.user.fullName}</p>
                    <p className="text-sm md:text-base"><strong>Plano:</strong> {verificationResult.plan}</p>
                    <p className="text-sm md:text-base"><strong>Email:</strong> {verificationResult.user.email}</p>
                    {verificationResult.user.cpf && (
                      <p className="text-sm md:text-base"><strong>CPF:</strong> {verificationResult.user.cpf}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Verificação Falhou:</strong> {verificationResult.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

        {/* Instructions */}
        <Card className="mt-4 md:mt-6 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Como Usar</CardTitle>
          </CardHeader>
          
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-xs md:text-sm">
              <li>Solicite ao cliente para mostrar seu cartão virtual CNVidas</li>
              <li>Use o scanner para ler o QR Code ou digite o código manualmente</li>
              <li>Aguarde a verificação e confirme os dados do usuário</li>
              <li>Proceda com o atendimento após verificação bem-sucedida</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
    // </PartnerOnboardingGuard>
  );
}