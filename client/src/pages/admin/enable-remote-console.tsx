import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRemoteConsole } from '@/hooks/use-remote-console';
import AdminLayout from '@/components/layouts/admin-layout';
import { Preferences } from '@capacitor/preferences';
import { isNativeApp } from '@/utils/platform';

export default function EnableRemoteConsole() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { setEnabled } = useRemoteConsole();

  // Carregar estado inicial
  useEffect(() => {
    const loadState = async () => {
      if (isNativeApp()) {
        try {
          const { value } = await Preferences.get({ key: 'enableRemoteConsole' });
          setIsEnabled(value === 'true');
        } catch (error) {
          console.error('Erro ao carregar preferências:', error);
        }
      } else {
        setIsEnabled(localStorage.getItem('enableRemoteConsole') === 'true');
      }
      setIsLoading(false);
    };
    loadState();
  }, []);

  const handleToggle = async (checked: boolean) => {
    setIsEnabled(checked);
    
    // Salvar no storage apropriado
    if (isNativeApp()) {
      try {
        await Preferences.set({
          key: 'enableRemoteConsole',
          value: checked.toString()
        });
      } catch (error) {
        console.error('Erro ao salvar preferências:', error);
      }
    } else {
      localStorage.setItem('enableRemoteConsole', checked.toString());
    }
    
    setEnabled(checked);
    
    if (checked) {
      // Adicionar log de teste
      setTimeout(() => {
        console.log('[Test] Console remoto ativado via configurações admin');
        console.info('[Test] Info log test');
        console.warn('[Test] Warning log test');
        console.error('[Test] Error log test');
      }, 1000);
    }
  };

  const forceLogTest = () => {
    console.log('[Force Test] Log enviado às', new Date().toISOString());
    console.info('[Force Test] Sistema: ', {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  };

  return (
    <AdminLayout title="Configurar Console Remoto">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ativar Console Remoto</CardTitle>
            <CardDescription>
              Configure o console remoto para capturar logs do navegador/app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="remote-console">Console Remoto</Label>
                <p className="text-sm text-muted-foreground">
                  Ativa a captura e envio de logs para o servidor
                </p>
              </div>
              <Switch
                id="remote-console"
                checked={isEnabled}
                onCheckedChange={handleToggle}
                disabled={isLoading}
              />
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Status atual: {isEnabled ? 
                  <span className="text-green-600 font-medium">Ativado</span> : 
                  <span className="text-red-600 font-medium">Desativado</span>
                }
              </p>
              
              <Button onClick={forceLogTest} variant="outline">
                Enviar Log de Teste
              </Button>
              
              <p className="text-xs text-muted-foreground mt-2">
                Após ativar, recarregue a página para aplicar as mudanças.
              </p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Informações do Sistema</h4>
              <div className="text-xs space-y-1 font-mono bg-muted p-3 rounded">
                <p>Platform: {navigator.platform}</p>
                <p>UserAgent: {navigator.userAgent}</p>
                <p>Capacitor: {!!(window as any).Capacitor ? 'Sim' : 'Não'}</p>
                <p>Native App: {!!(window as any).Capacitor?.isNativePlatform?.() ? 'Sim' : 'Não'}</p>
                <p>NODE_ENV: {process.env.NODE_ENV}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}