import { useState, useCallback } from 'react';

interface UserActivityData {
  userId: string;
  action: 'entrou' | 'postou' | 'curtiu' | 'comentou' | string;
  data?: any;
}

interface ActivityResponse {
  success?: boolean;
  message: string;
  githubResult?: {
    commitUrl: string;
    sha: string;
    message: string;
    timestamp: string;
  };
  attempts: number;
  error?: string;
}

interface ActivityStatus {
  currentAttempts: number;
  maxAttempts: number;
  canTryAgain: boolean;
  lastResetTime: string;
  message: string;
  environment: {
    hasGithubToken: boolean;
    githubOwner: string;
    githubRepo: string;
    githubFilePath: string;
  };
}

export function useGithubActivity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordActivity = useCallback(async (activityData: UserActivityData): Promise<ActivityResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      const result: ActivityResponse = await response.json();

      if (!response.ok) {
        setError(result.message || 'Erro ao registrar atividade');
        return result;
      }

      console.log('Atividade registrada:', result);
      return result;

    } catch (err: any) {
      const errorMessage = err.message || 'Erro de conexão';
      setError(errorMessage);
      console.error('Erro ao registrar atividade:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatus = useCallback(async (): Promise<ActivityStatus | null> => {
    try {
      const response = await fetch('/api/user-activity');
      const status: ActivityStatus = await response.json();
      return status;
    } catch (err: any) {
      console.error('Erro ao obter status:', err);
      return null;
    }
  }, []);

  const resetAttempts = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/user-activity-reset', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (response.ok) {
        console.log('Contador resetado:', result);
        return true;
      } else {
        setError(result.message || 'Erro ao resetar contador');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao resetar contador');
      console.error('Erro ao resetar contador:', err);
      return false;
    }
  }, []);

  // Funções de conveniência para ações específicas
  const recordLogin = useCallback((userId: string, additionalData?: any) => {
    return recordActivity({
      userId,
      action: 'entrou',
      data: {
        timestamp: new Date().toISOString(),
        ...additionalData
      }
    });
  }, [recordActivity]);

  const recordPost = useCallback((userId: string, postData: any) => {
    return recordActivity({
      userId,
      action: 'postou',
      data: {
        timestamp: new Date().toISOString(),
        ...postData
      }
    });
  }, [recordActivity]);

  const recordLike = useCallback((userId: string, targetData: any) => {
    return recordActivity({
      userId,
      action: 'curtiu',
      data: {
        timestamp: new Date().toISOString(),
        ...targetData
      }
    });
  }, [recordActivity]);

  const recordComment = useCallback((userId: string, commentData: any) => {
    return recordActivity({
      userId,
      action: 'comentou',
      data: {
        timestamp: new Date().toISOString(),
        ...commentData
      }
    });
  }, [recordActivity]);

  return {
    // Estados
    loading,
    error,
    
    // Funções gerais
    recordActivity,
    getStatus,
    resetAttempts,
    
    // Funções específicas
    recordLogin,
    recordPost,
    recordLike,
    recordComment,
  };
}
