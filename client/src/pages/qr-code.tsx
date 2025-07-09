import React from "react";
import { Helmet } from "react-helmet";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import QRAuthGenerator from "@/components/user/qr-auth-generator";
import { useAuth } from "@/hooks/use-auth";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QrCode, ScanLine } from "lucide-react";

const QRCodePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState("");

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scannerActive) {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: 250 },
        false
      );

      scanner.render(
        async (decodedText) => {
          // Sucesso
          scanner?.clear();
          setScannerActive(false);
          setScanResult(decodedText);
          
          try {
            // Validar o token QR
            const response = await apiRequest("POST", "/api/auth/qr-validate", {
              token: decodedText
            });
            
            if (response.ok) {
              toast({
                title: "Autenticação bem-sucedida",
                description: "QR Code validado com sucesso.",
                variant: "default",
              });
            } else {
              const error = await response.json();
              toast({
                title: "Erro na autenticação",
                description: error.message || "QR Code inválido ou expirado.",
                variant: "destructive",
              });
            }
          } catch (error) {
            toast({
              title: "Erro na autenticação",
              description: "Ocorreu um erro ao validar o QR Code.",
              variant: "destructive",
            });
          }
        },
        (errorMessage) => {
          // Erro
          console.error(errorMessage);
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scannerActive, toast]);

  const startScanner = () => {
    setScannerActive(true);
    setScanResult("");
  };

  const stopScanner = () => {
    setScannerActive(false);
  };

  // Definir quais tabs mostrar com base na função do usuário
  const canGenerateQR = user?.role === 'doctor' || user?.role === 'patient';
  const canScanQR = user?.role === 'admin' || user?.role === 'partner';

  return (
    <DashboardLayout>
      <Helmet>
        <title>QR Code | CN Vidas</title>
        <meta name="description" content="Gerencie QR Codes para autenticação rápida e segura no sistema CN Vidas" />
      </Helmet>
      
      <div className="container px-4 py-6 mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <QrCode className="h-8 w-8 text-primary" />
            {canScanQR ? "Validação QR Code" : "Meu QR Code"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {canScanQR 
              ? "Escaneie QR Codes para verificar identidade de usuários"
              : "Seu código de identificação rápida e segura"}
          </p>
        </div>
        
        {canGenerateQR && (
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-sm border">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">QR Code de Autenticação</h2>
              <p className="text-muted-foreground">
                {user?.role === 'doctor' 
                  ? "Use este QR Code para comprovar sua identidade como médico durante consultas e procedimentos." 
                  : "Use este QR Code para identificação rápida em consultas e procedimentos."}
              </p>
              <p className="text-sm font-medium text-green-600 mt-2">
                Este é seu QR Code permanente e único, gerado no momento do seu cadastro.
              </p>
            </div>
            
            <QRAuthGenerator />
          </div>
        )}
        
        {canScanQR && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-primary" />
                <CardTitle>Escanear QR Code</CardTitle>
              </div>
              <CardDescription>
                {user?.role === 'admin'
                  ? "Verifique a identidade dos usuários escaneando seus QR Codes"
                  : "Verifique a identidade de pacientes e médicos escaneando seus QR Codes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                {!scannerActive && !scanResult && (
                  <Button onClick={startScanner} size="lg" className="gap-2">
                    <ScanLine className="h-5 w-5" />
                    Iniciar Scanner
                  </Button>
                )}
                
                {scannerActive && (
                  <>
                    <div id="qr-reader" style={{ width: '100%', maxWidth: '500px' }}></div>
                    <Button variant="outline" onClick={stopScanner}>
                      Cancelar
                    </Button>
                  </>
                )}
                
                {scanResult && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50 w-full">
                    <p className="font-medium mb-1">QR Code escaneado:</p>
                    <p className="text-sm text-gray-600 font-mono break-all">{scanResult}</p>
                    <Button 
                      onClick={startScanner} 
                      variant="outline" 
                      size="sm"
                      className="mt-3"
                    >
                      Escanear Novamente
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QRCodePage;