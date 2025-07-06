import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Search, Download, Copy, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AdminLayout from '@/components/layouts/admin-layout';

interface RemoteLog {
  id: number;
  userId: number | null;
  sessionId: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  userAgent: string;
  platform: string;
  appVersion: string;
  stack?: string;
  metadata?: any;
  createdAt: string;
}

interface Session {
  sessionId: string;
  userId: number | null;
  lastActivity: string;
  logCount: number;
}

export default function RemoteConsole() {
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Buscar sessões ativas
  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ['remote-console-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/diagnostics/remote-console/sessions/active');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      return data.sessions as Session[];
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Buscar logs da sessão selecionada
  const { data: logs, refetch: refetchLogs } = useQuery({
    queryKey: ['remote-console-logs', selectedSession],
    queryFn: async () => {
      if (!selectedSession) return [];
      const response = await fetch(`/api/diagnostics/remote-console/${selectedSession}?limit=500`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      return data.logs as RemoteLog[];
    },
    enabled: !!selectedSession,
    refetchInterval: autoRefresh ? 2000 : false,
  });

  // Auto-selecionar primeira sessão
  useEffect(() => {
    if (sessions?.length && !selectedSession) {
      setSelectedSession(sessions[0].sessionId);
    }
  }, [sessions, selectedSession]);

  // Filtrar logs
  const filteredLogs = logs?.filter(log => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }) || [];

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'secondary';
      default: return 'default';
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `console-logs-${selectedSession}-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const copyAllLogs = async () => {
    const logsText = filteredLogs.map(log => {
      const timestamp = format(new Date(log.timestamp), "HH:mm:ss.SSS");
      let text = `[${timestamp}] [${log.level.toUpperCase()}] ${log.message}`;
      
      if (log.stack) {
        text += `\n${log.stack}`;
      }
      
      if (log.metadata && Object.keys(log.metadata).length > 0) {
        text += `\nMetadata: ${JSON.stringify(log.metadata, null, 2)}`;
      }
      
      return text;
    }).join('\n\n---\n\n');
    
    try {
      await navigator.clipboard.writeText(logsText);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar logs:', error);
    }
  };

  return (
    <AdminLayout title="Console Remoto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Console Remoto - TestFlight/Produção
            <div className="flex gap-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchSessions();
                  refetchLogs();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Controles */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma sessão" />
              </SelectTrigger>
              <SelectContent>
                {sessions?.map(session => (
                  <SelectItem key={session.sessionId} value={session.sessionId}>
                    {session.sessionId.substring(0, 20)}... ({session.logCount} logs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="error">Erros</SelectItem>
                <SelectItem value="warn">Avisos</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="log">Log</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nos logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Button
              variant="outline"
              onClick={exportLogs}
              disabled={!filteredLogs.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>

            <Button
              variant="outline"
              onClick={copyAllLogs}
              disabled={!filteredLogs.length}
            >
              {copiedToClipboard ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Todos
                </>
              )}
            </Button>
          </div>

          {/* Info da sessão */}
          {selectedSession && sessions?.find(s => s.sessionId === selectedSession) && (
            <div className="bg-muted p-3 rounded-lg mb-4">
              <div className="text-sm space-y-1">
                <p><strong>Sessão:</strong> {selectedSession}</p>
                <p><strong>Última atividade:</strong> {
                  format(new Date(sessions.find(s => s.sessionId === selectedSession)!.lastActivity), 
                    "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                }</p>
                <p><strong>Total de logs:</strong> {filteredLogs.length} de {logs?.length || 0}</p>
              </div>
            </div>
          )}

          {/* Lista de logs */}
          <ScrollArea className="h-[600px] w-full rounded-md border">
            <div className="p-4 space-y-2">
              {filteredLogs.map((log) => (
                <Card key={log.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getLevelBadgeVariant(log.level)}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.platform} - v{log.appVersion}
                        </span>
                      </div>
                      
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {log.message}
                      </pre>
                      
                      {log.stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            Ver stack trace
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                      
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            Ver metadata
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              
              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || levelFilter !== 'all' 
                    ? 'Nenhum log encontrado com os filtros aplicados'
                    : 'Nenhum log disponível para esta sessão'
                  }
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}