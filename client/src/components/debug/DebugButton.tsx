import React, { useState } from 'react';
import { Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function DebugButton() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  
  const showLogs = () => {
    const debugLogs = (window as any).getDebugLogs?.() || [];
    setLogs(debugLogs);
    setOpen(true);
  };
  
  const copyLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(logsText);
    alert('Logs copiados!');
  };
  
  // Só mostrar em desenvolvimento ou se tiver parâmetro debug na URL
  const showDebug = process.env.NODE_ENV === 'development' || 
                   window.location.search.includes('debug=true');
  
  if (!showDebug) return null;
  
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50"
        onClick={showLogs}
      >
        <Bug className="h-4 w-4" />
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Debug Logs</DialogTitle>
            <DialogDescription>
              Logs capturados durante a execução do app
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Button onClick={copyLogs} variant="outline" size="sm">
              Copiar Logs
            </Button>
            
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
              {logs.length === 0 ? 'Nenhum log capturado' : 
                logs.map((log, i) => (
                  <div key={i} className={`mb-2 ${
                    log.level === 'error' ? 'text-red-600' : 
                    log.level === 'warn' ? 'text-yellow-600' : 
                    'text-gray-800'
                  }`}>
                    [{new Date(log.timestamp).toLocaleTimeString()}] {log.level.toUpperCase()}: {log.message}
                    {log.data && (
                      <div className="ml-4 text-gray-600">
                        {JSON.stringify(log.data, null, 2)}
                      </div>
                    )}
                  </div>
                ))
              }
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}