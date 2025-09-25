import { useEffect, useRef, useCallback, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Use environment variables directly from Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 2, // Limite de eventos por segundo
    }
  }
});

// Gerenciador global de conexões
class RealtimeConnectionManager {
  private static instance: RealtimeConnectionManager;
  private connections = new Map<string, RealtimeChannel>();
  private connectionCount = 0;
  private readonly MAX_CONNECTIONS = 30; // Margem de segurança

  static getInstance() {
    if (!RealtimeConnectionManager.instance) {
      RealtimeConnectionManager.instance = new RealtimeConnectionManager();
    }
    return RealtimeConnectionManager.instance;
  }

  canConnect(): boolean {
    return this.connectionCount < this.MAX_CONNECTIONS;
  }

  addConnection(key: string, channel: RealtimeChannel): boolean {
    if (!this.canConnect()) {
      console.warn(`⚠️ Limite de conexões Realtime atingido (${this.MAX_CONNECTIONS})`);
      return false;
    }

    // Remove conexão existente se houver
    this.removeConnection(key);

    this.connections.set(key, channel);
    this.connectionCount++;
    console.log(`✅ Realtime conectado: ${key} (${this.connectionCount}/${this.MAX_CONNECTIONS})`);
    return true;
  }

  removeConnection(key: string): void {
    const channel = this.connections.get(key);
    if (channel) {
      channel.unsubscribe();
      this.connections.delete(key);
      this.connectionCount = Math.max(0, this.connectionCount - 1);
      console.log(`❌ Realtime desconectado: ${key} (${this.connectionCount}/${this.MAX_CONNECTIONS})`);
    }
  }

  getConnectionCount(): number {
    return this.connectionCount;
  }

  cleanup(): void {
    this.connections.forEach((channel, key) => {
      this.removeConnection(key);
    });
  }
}

interface UseOptimizedRealtimeOptions {
  feature: string;
  table?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  enabled?: boolean;
}

export function useOptimizedRealtime({
  feature,
  table,
  filter,
  event = '*',
  enabled = true
}: UseOptimizedRealtimeOptions) {
  // Para simplificar, vamos usar diretamente o supabase auth
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  const manager = RealtimeConnectionManager.getInstance();
  const connectionKey = `${feature}-${user?.id || 'anonymous'}`;
  const isConnectedRef = useRef(false);
  const lastConnectRef = useRef(0);
  const CONNECT_COOLDOWN = 3000; // 3 segundos entre reconexões

  const connect = useCallback(() => {
    if (!enabled || !user || isConnectedRef.current) return;

    // Rate limiting para reconexões
    const now = Date.now();
    if (now - lastConnectRef.current < CONNECT_COOLDOWN) {
      return;
    }
    lastConnectRef.current = now;

    // Lista de features permitidas para evitar conexões desnecessárias
    const allowedFeatures = [
      'chat',
      'notifications', 
      'presence',
      'posts',
      'communities',
      'friendships'
    ];

    if (!allowedFeatures.includes(feature)) {
      console.warn(`❌ Feature '${feature}' não é permitida no Realtime`);
      return;
    }

    let channel = supabase.channel(connectionKey);

    // Configuração baseada no tipo de feature
    if (table) {
      // Canal para mudanças específicas de tabela
      channel = channel.on('postgres_changes', {
        event,
        schema: 'public',
        table,
        filter: filter || `user_id=eq.${user.id}`
      }, (payload) => {
        console.log(`📡 ${feature} realtime:`, payload);
      });
    } else {
      // Canal de presença para features como chat
      channel = channel
        .on('presence', { event: 'sync' }, () => {
          console.log(`👥 Presença sincronizada: ${feature}`);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          console.log(`👤 Usuário entrou no ${feature}:`, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          console.log(`👋 Usuário saiu do ${feature}:`, leftPresences);
        });
    }

    // Tenta adicionar a conexão
    if (manager.addConnection(connectionKey, channel)) {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isConnectedRef.current = true;
          
          // Para canais de presença, trackear presença do usuário
          if (!table) {
            channel.track({
              user_id: user.id,
              username: user.user_metadata?.username || user.email,
              online_at: new Date().toISOString()
            });
          }
        }
      });
    }
  }, [enabled, user, feature, table, filter, event, connectionKey]);

  const disconnect = useCallback(() => {
    if (isConnectedRef.current) {
      manager.removeConnection(connectionKey);
      isConnectedRef.current = false;
    }
  }, [connectionKey]);

  // Conecta/desconecta baseado nas dependências
  useEffect(() => {
    if (enabled && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, user, connect, disconnect]);

  // Cleanup global ao desmontar componente raiz
  useEffect(() => {
    return () => {
      // Se for o último componente usando o manager, fazer cleanup
      if (manager.getConnectionCount() === 1) {
        manager.cleanup();
      }
    };
  }, []);

  return {
    isConnected: isConnectedRef.current,
    connectionCount: manager.getConnectionCount(),
    maxConnections: 30,
    canConnect: manager.canConnect(),
    disconnect
  };
}

// Hook específico para presença de usuários
export function usePresence(room: string) {
  return useOptimizedRealtime({
    feature: `presence-${room}`,
    enabled: !!room
  });
}

// Hook específico para notificações
export function useNotifications() {
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);
  
  return useOptimizedRealtime({
    feature: 'notifications',
    table: 'notifications',
    filter: `recipient_id=eq.${user?.id}`,
    event: 'INSERT',
    enabled: !!user
  });
}

// Hook específico para posts em tempo real
export function usePostsRealtime(communityId?: string) {
  return useOptimizedRealtime({
    feature: 'posts',
    table: 'posts',
    filter: communityId ? `community_id=eq.${communityId}` : undefined,
    event: 'INSERT',
    enabled: true
  });
}
