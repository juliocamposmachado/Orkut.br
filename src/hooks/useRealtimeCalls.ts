import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/enhanced-auth-context';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface CallPayload {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'audio' | 'video';
  status: 'ringing' | 'connected' | 'ended' | 'declined' | 'missed';
  caller_info?: any;
  started_at: string;
  answered_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
  created_at: string;
  updated_at: string;
}

type CallChangePayload = RealtimePostgresChangesPayload<{
  [key: string]: any;
}>;

interface UseRealtimeCallsOptions {
  onCallReceived?: (call: CallPayload) => void;
  onCallStarted?: (call: CallPayload) => void;
  onCallUpdated?: (call: CallPayload) => void;
  onCallEnded?: (callId: string) => void;
  onCallDeclined?: (call: CallPayload) => void;
  onCallMissed?: (call: CallPayload) => void;
}

/**
 * Hook para receber notificações em tempo real de chamadas de áudio e vídeo
 * 
 * Este hook monitora mudanças na tabela calls do Supabase e dispara callbacks
 * apropriados baseados no status da chamada e se o usuário é caller ou receiver.
 * 
 * @param options - Callbacks para diferentes eventos de chamadas
 * @returns objeto com função para desconectar do canal Realtime
 */
export function useRealtimeCalls(options: UseRealtimeCallsOptions = {}) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { 
    onCallReceived, 
    onCallStarted, 
    onCallUpdated, 
    onCallEnded, 
    onCallDeclined, 
    onCallMissed 
  } = options;

  const handleInserts = useCallback((payload: CallChangePayload) => {
    const call = payload.new as CallPayload;
    
    if (!user || !call) return;

    // Verifica se o usuário atual participa da chamada
    const isParticipant = (call.caller_id === user.id || call.receiver_id === user.id);
    if (!isParticipant) return;

    // Se o usuário é o receiver e a chamada está tocando, é uma chamada recebida
    if (call.receiver_id === user.id && call.status === 'ringing') {
      onCallReceived?.(call);
    }
    
    // Se o usuário é o caller, é uma chamada iniciada
    if (call.caller_id === user.id) {
      onCallStarted?.(call);
    }
  }, [user, onCallReceived, onCallStarted]);

  const handleUpdates = useCallback((payload: CallChangePayload) => {
    const call = payload.new as CallPayload;
    const oldCall = payload.old as CallPayload;
    
    if (!user || !call) return;

    // Verifica se o usuário atual participa da chamada
    const isParticipant = (call.caller_id === user.id || call.receiver_id === user.id);
    if (!isParticipant) return;

    // Trata mudanças específicas de status
    switch (call.status) {
      case 'ended':
        onCallEnded?.(call.id);
        break;
      case 'declined':
        onCallDeclined?.(call);
        break;
      case 'missed':
        onCallMissed?.(call);
        break;
      case 'connected':
        // Chamada foi aceita/conectada
        onCallUpdated?.(call);
        break;
      default:
        onCallUpdated?.(call);
    }
  }, [user, onCallUpdated, onCallEnded, onCallDeclined, onCallMissed]);

  const handleDeletes = useCallback((payload: CallChangePayload) => {
    const oldCall = payload.old as CallPayload;
    
    if (!oldCall?.id) return;
    
    // Quando uma chamada é deletada, consideramos como encerrada
    onCallEnded?.(oldCall.id);
  }, [onCallEnded]);

  useEffect(() => {
    if (!user?.id) return;

    // Nome único do canal para o usuário atual
    const channelName = `user-calls-${user.id}`;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'calls',
        filter: `or(caller_id.eq.${user.id},receiver_id.eq.${user.id})`
      }, handleInserts)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'calls',
        filter: `or(caller_id.eq.${user.id},receiver_id.eq.${user.id})`
      }, handleUpdates)
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'calls',
        filter: `or(caller_id.eq.${user.id},receiver_id.eq.${user.id})`
      }, handleDeletes)
      .subscribe((status) => {
        console.log('Realtime calls subscription status:', status);
      });

    channelRef.current = channel;

    // Cleanup quando o componente desmonta ou user muda
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, handleInserts, handleUpdates, handleDeletes]);

  // Função para desconectar manualmente do canal
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return { 
    disconnect,
    isConnected: !!channelRef.current
  };
}

// Exemplo de uso:
/*
function CallNotifications() {
  const { disconnect } = useRealtimeCalls({
    onCallReceived: (call) => {
      console.log('Chamada recebida:', call);
      // Mostrar modal/notificação de chamada recebida
    },
    onCallStarted: (call) => {
      console.log('Chamada iniciada:', call);
      // Atualizar UI para mostrar que a chamada foi iniciada
    },
    onCallUpdated: (call) => {
      console.log('Chamada atualizada:', call);
      // Atualizar status da chamada na UI
    },
    onCallEnded: (callId) => {
      console.log('Chamada encerrada:', callId);
      // Fechar modals/interfaces de chamada
    },
    onCallDeclined: (call) => {
      console.log('Chamada recusada:', call);
      // Mostrar notificação de chamada recusada
    },
    onCallMissed: (call) => {
      console.log('Chamada perdida:', call);
      // Mostrar notificação de chamada perdida
    }
  });

  return null; // Este hook não renderiza nada
}
*/
