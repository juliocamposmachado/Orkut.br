'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGithubActivity } from '@/hooks/use-github-activity';
import { CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';

export function GitHubActivityExample() {
  const {
    loading,
    error,
    recordActivity,
    recordLogin,
    recordPost,
    getStatus,
    resetAttempts
  } = useGithubActivity();

  const [status, setStatus] = useState<any>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  // Carrega o status inicial
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const currentStatus = await getStatus();
    setStatus(currentStatus);
  };

  const handleTestLogin = async () => {
    const result = await recordLogin('usuario_teste_' + Date.now(), {
      platform: 'web',
      userAgent: navigator.userAgent
    });
    setLastResult(result);
    loadStatus();
  };

  const handleTestPost = async () => {
    const result = await recordPost('usuario_teste_' + Date.now(), {
      title: 'Post de teste',
      content: 'Este é um post de teste da API GitHub!',
      community: 'Orkut Nostálgico'
    });
    setLastResult(result);
    loadStatus();
  };

  const handleTestCustom = async () => {
    const result = await recordActivity({
      userId: 'admin_' + Date.now(),
      action: 'teste_api',
      data: {
        type: 'manual_test',
        timestamp: new Date().toISOString(),
        note: 'Teste manual da API via componente'
      }
    });
    setLastResult(result);
    loadStatus();
  };

  const handleReset = async () => {
    const success = await resetAttempts();
    if (success) {
      setLastResult(null);
      loadStatus();
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            API GitHub Activity - Teste
          </CardTitle>
          <CardDescription>
            Teste a integração com o GitHub para registrar atividades de usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status da API */}
          {status && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Status das Tentativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={status.canTryAgain ? "secondary" : "destructive"}>
                      {status.currentAttempts}/{status.maxAttempts}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {status.message}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Configuração GitHub</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {status.environment.hasGithubToken ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">Token configurado</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Repo: {status.environment.githubOwner}/{status.environment.githubRepo}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Arquivo: {status.environment.githubFilePath}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Erros */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Último resultado */}
          {lastResult && (
            <Alert variant={lastResult.success ? "default" : "destructive"}>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">{lastResult.message}</div>
                  {lastResult.githubResult && (
                    <div className="text-sm">
                      <a 
                        href={lastResult.githubResult.commitUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Ver commit no GitHub <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {lastResult.attempts > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Tentativas: {lastResult.attempts}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Botões de teste */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button 
              onClick={handleTestLogin} 
              disabled={loading || (status && !status.canTryAgain)}
              variant="outline"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Testar Login
            </Button>
            
            <Button 
              onClick={handleTestPost}
              disabled={loading || (status && !status.canTryAgain)}
              variant="outline"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Testar Post
            </Button>
            
            <Button 
              onClick={handleTestCustom}
              disabled={loading || (status && !status.canTryAgain)}
              variant="outline"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Teste Customizado
            </Button>
            
            <Button 
              onClick={handleReset}
              disabled={loading}
              variant="destructive"
            >
              Resetar Contador
            </Button>
          </div>

          {/* Botão para recarregar status */}
          <Button 
            onClick={loadStatus}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
