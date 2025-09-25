'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useOptimizedRealtime } from '@/hooks/use-optimized-realtime';
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react';

interface ConnectionStatus {
  feature: string;
  isConnected: boolean;
  lastActivity: string;
  errorCount: number;
}

export function SupabaseRealtimeMonitor() {
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Hook de exemplo para monitoramento
  const { connectionCount, maxConnections, canConnect } = useOptimizedRealtime({
    feature: 'monitor',
    enabled: false // Só para obter stats
  });

  // Simula coleta de estatísticas das conexões
  useEffect(() => {
    const interval = setInterval(() => {
      // Em uma implementação real, isso viria do gerenciador de conexões
      const mockStatuses: ConnectionStatus[] = [
        {
          feature: 'notifications',
          isConnected: true,
          lastActivity: new Date(Date.now() - 1000 * 30).toISOString(),
          errorCount: 0
        },
        {
          feature: 'chat',
          isConnected: canConnect,
          lastActivity: new Date(Date.now() - 1000 * 5).toISOString(),
          errorCount: canConnect ? 0 : 1
        },
        {
          feature: 'presence',
          isConnected: connectionCount < maxConnections,
          lastActivity: new Date().toISOString(),
          errorCount: 0
        }
      ];

      setConnectionStatuses(mockStatuses);
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [canConnect, connectionCount, maxConnections]);

  // Calcula estatísticas
  const connectedCount = connectionStatuses.filter(s => s.isConnected).length;
  const hasWarnings = connectionCount > maxConnections * 0.8;
  const hasErrors = connectionCount >= maxConnections;

  const getStatusIcon = (isConnected: boolean, errorCount: number) => {
    if (!isConnected || errorCount > 0) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusBadge = () => {
    if (hasErrors) {
      return <Badge variant="destructive">Limite Atingido</Badge>;
    }
    if (hasWarnings) {
      return <Badge variant="secondary">Cuidado</Badge>;
    }
    return <Badge variant="default">Normal</Badge>;
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString();
  };

  const handleForceReconnect = () => {
    // Em implementação real, forçaria reconexão
    console.log('Forçando reconexão...');
    setLastUpdate(new Date());
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitor Realtime Supabase
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{connectionCount}</div>
            <div className="text-sm text-muted-foreground">Conexões Ativas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{connectedCount}</div>
            <div className="text-sm text-muted-foreground">Conectadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{maxConnections}</div>
            <div className="text-sm text-muted-foreground">Limite Máximo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalMessages}</div>
            <div className="text-sm text-muted-foreground">Mensagens/h</div>
          </div>
        </div>

        {/* Alertas */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Limite de conexões atingido! Algumas funcionalidades podem não funcionar.
            </AlertDescription>
          </Alert>
        )}

        {hasWarnings && !hasErrors && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Aproximando do limite de conexões ({connectionCount}/{maxConnections})
            </AlertDescription>
          </Alert>
        )}

        {/* Status das Conexões */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Status das Features
          </h3>
          
          <div className="space-y-2">
            {connectionStatuses.map((status) => (
              <div 
                key={status.feature}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(status.isConnected, status.errorCount)}
                  <div>
                    <div className="font-medium capitalize">{status.feature}</div>
                    <div className="text-sm text-muted-foreground">
                      Última atividade: {formatTime(status.lastActivity)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {status.errorCount > 0 && (
                    <Badge variant="destructive" className="mb-1">
                      {status.errorCount} erro{status.errorCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {status.isConnected ? 'Conectado' : 'Desconectado'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Atualizado: {lastUpdate.toLocaleTimeString()}
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleForceReconnect}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reconectar
          </Button>
        </div>

        {/* Recomendações */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
          <strong>💡 Dicas de Otimização:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Mantenha menos de {Math.floor(maxConnections * 0.8)} conexões simultâneas</li>
            <li>Use canais específicos por usuário</li>
            <li>Desconecte features não utilizadas</li>
            <li>Configure RLS nas tabelas sensíveis</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
