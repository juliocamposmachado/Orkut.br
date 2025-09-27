import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface RealtimeMessage {
  id: number
  from_profile_id: string
  to_profile_id: string
  content: string
  created_at: string
  read_at: string | null
}

type MessageChangePayload = RealtimePostgresChangesPayload<{
  [key: string]: any
}>

interface UseRealtimeMessagesOptions {
  onNewMessage?: (message: RealtimeMessage) => void
  onMessageUpdate?: (message: RealtimeMessage) => void
  onMessageDelete?: (messageId: number) => void
}

export function useRealtimeMessages(options: UseRealtimeMessagesOptions = {}) {
  const { user } = useAuth()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const { onNewMessage, onMessageUpdate, onMessageDelete } = options

  const handleInserts = useCallback((payload: MessageChangePayload) => {
    console.log('📨 Nova mensagem via Realtime:', payload.new)
    const message = payload.new as RealtimeMessage
    
    // Verificar se o usuário atual está envolvido na mensagem
    if (user && (message.from_profile_id === user.id || message.to_profile_id === user.id)) {
      onNewMessage?.(message)
    }
  }, [user, onNewMessage])

  const handleUpdates = useCallback((payload: MessageChangePayload) => {
    console.log('📝 Mensagem atualizada via Realtime:', payload.new)
    const message = payload.new as RealtimeMessage
    
    // Verificar se o usuário atual está envolvido na mensagem
    if (user && (message.from_profile_id === user.id || message.to_profile_id === user.id)) {
      onMessageUpdate?.(message)
    }
  }, [user, onMessageUpdate])

  const handleDeletes = useCallback((payload: MessageChangePayload) => {
    console.log('🗑️ Mensagem deletada via Realtime:', payload.old)
    const messageId = payload.old?.id
    
    if (messageId) {
      onMessageDelete?.(messageId)
    }
  }, [onMessageDelete])

  useEffect(() => {
    if (!user) {
      console.log('❌ Usuário não autenticado, não conectando ao Realtime')
      return
    }

    // Criar canal único para o usuário
    const channelName = `messages:user_${user.id}`
    console.log('🔌 Conectando ao canal Realtime:', channelName)
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(from_profile_id.eq.${user.id},to_profile_id.eq.${user.id})`
        },
        handleInserts
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(from_profile_id.eq.${user.id},to_profile_id.eq.${user.id})`
        },
        handleUpdates
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `or(from_profile_id.eq.${user.id},to_profile_id.eq.${user.id})`
        },
        handleDeletes
      )
      .subscribe((status) => {
        console.log('📡 Status da conexão Realtime:', status)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Conectado ao Realtime para mensagens')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na conexão Realtime')
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Timeout na conexão Realtime')
        } else if (status === 'CLOSED') {
          console.log('🔌 Conexão Realtime fechada')
        }
      })

    channelRef.current = channel

    // Cleanup
    return () => {
      console.log('🧹 Desconectando do Realtime')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user, handleInserts, handleUpdates, handleDeletes])

  // Função para desconectar manualmente
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      console.log('🔌 Desconectando manualmente do Realtime')
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  // Função para reconectar
  const reconnect = useCallback(() => {
    disconnect()
    // O useEffect será executado novamente devido às dependências
  }, [disconnect])

  return {
    isConnected: !!channelRef.current,
    disconnect,
    reconnect
  }
}
