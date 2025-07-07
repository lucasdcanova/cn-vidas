import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/components/layouts/admin-layout';
import { useState } from 'react';

export default function TestRemoteConsole() {
  const [testCount, setTestCount] = useState(0);

  const runTests = () => {
    const newCount = testCount + 1;
    setTestCount(newCount);
    
    console.log(`[Test ${newCount}] Log normal - ${new Date().toISOString()}`);
    console.info(`[Test ${newCount}] Info message`, { 
      testData: 'example', 
      timestamp: Date.now() 
    });
    console.warn(`[Test ${newCount}] Warning message`);
    console.error(`[Test ${newCount}] Error message`, new Error('Test error'));
    
    // Test com objetos complexos
    console.log('[Test Complex]', {
      user: { id: 1, name: 'Test User' },
      array: [1, 2, 3],
      nested: {
        deep: {
          value: 'deeply nested'
        }
      }
    });
  };

  const forceError = () => {
    try {
      // @ts-ignore
      nonExistentFunction();
    } catch (error) {
      console.error('[Test Exception]', error);
    }
  };

  const testLongMessage = () => {
    const longText = 'Lorem ipsum '.repeat(100);
    console.log('[Test Long]', longText);
  };

  const testMultipleArgs = () => {
    console.log('[Test Multi]', 'arg1', 'arg2', { obj: 'arg3' }, ['array', 'arg4']);
  };

  return (
    <AdminLayout title="Testar Console Remoto">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Teste do Console Remoto</CardTitle>
            <CardDescription>
              Execute testes para verificar se o console remoto está capturando logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Testes executados: <span className="font-bold">{testCount}</span>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={runTests} variant="default">
                Executar Teste Básico
              </Button>
              
              <Button onClick={forceError} variant="destructive">
                Forçar Erro
              </Button>
              
              <Button onClick={testLongMessage} variant="outline">
                Testar Mensagem Longa
              </Button>
              
              <Button onClick={testMultipleArgs} variant="outline">
                Testar Múltiplos Args
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Após executar os testes, vá para "Console Remoto" para ver os logs capturados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}