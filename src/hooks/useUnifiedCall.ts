import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { callService, type CallUser, type CallType, type CallStatus } from '@/src/services/callService'

// Types are now imported from the service
export type CallHookStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined'

export interface CallState {
  status: CallHookStatus
  type: CallType | null
  targetUser: CallUser | null
  callId: string | null
  isInitiator: boolean
  duration: number
}

interface CallOptions {
  onCallConnected?: () => void
  onCallEnded?: () => void
  onCallRejected?: () => void
  onIncomingCall?: (call: CallState) => void
}

/**
 * Hook unificado para gerenciar chamadas de áudio e vídeo
 * Este hook padroniza toda a lógica de chamadas para garantir comportamento consistente
 */
export function useUnifiedCall(options: CallOptions = {}) {
  const { user } = useAuth()
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    type: null,
    targetUser: null,
    callId: null,
    isInitiator: false,
    duration: 0
  })

  // Estados auxiliares
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados derivados
  const isInCall = callState.status === 'connected'
  const isIdle = callState.status === 'idle'
  const isCalling = callState.status === 'calling'
  const isRinging = callState.status === 'ringing'

  // Gerar ID único para chamada
  const generateCallId = useCallback((userId1: string, userId2: string, type: CallType): string => {
    const sortedIds = [userId1, userId2].sort()
    return `call_${type}_${sortedIds[0]}_${sortedIds[1]}_${Date.now()}`
  }, [])

  // Validar permissões de mídia
  const validateMediaPermissions = useCallback(async (type: CallType): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('WebRTC não é suportado neste navegador')
      }

      const constraints = {
        audio: true,
        video: type === 'video'
      }

      await navigator.mediaDevices.getUserMedia(constraints)
      return true
    } catch (error) {
      console.error('Erro ao validar permissões de mídia:', error)
      const message = type === 'video' 
        ? 'Permissão de câmera e microfone necessária para chamadas de vídeo'
        : 'Permissão de microfone necessária para chamadas de áudio'
      
      setError(message)
      toast.error(message)
      return false
    }
  }, [])

  // Função unificada para iniciar chamadas (áudio ou vídeo)
  const startCall = useCallback(async (targetUser: CallUser, type: CallType): Promise<void> => {
    if (!user) {
      return
    }

    if (!isIdle) {
      return
    }

    try {
      setError(null)
      setIsConnecting(true)

      // Validar permissões primeiro
      const hasPermissions = await callService.validateMediaPermissions(type)
      if (!hasPermissions) {
        return
      }

      // Preparar dados do usuário atual
      const caller: CallUser = {
        id: user.id,
        name: user.user_metadata?.display_name || user.email || 'Usuário',
        photo: user.user_metadata?.photo_url,
        username: user.user_metadata?.username,
        display_name: user.user_metadata?.display_name
      }

      // Iniciar chamada via service
      const callData = await callService.startCall(caller, targetUser, type)

      // Atualizar estado local
      setCallState({
        status: 'calling',
        type,
        targetUser,
        callId: callData.id,
        isInitiator: true,
        duration: 0
      })

      // Timeout para chamada não atendida (30 segundos)
      setTimeout(() => {
        if (callState.status === 'calling') {
          endCall('timeout')
        }
      }, 30000)

    } catch (error) {
      console.error('Erro ao iniciar chamada:', error)
      const message = (error as Error).message || 'Erro ao iniciar chamada'
      setError(message)
      
      // Reset state on error
      setCallState({
        status: 'idle',
        type: null,
        targetUser: null,
        callId: null,
        isInitiator: false,
        duration: 0
      })
    } finally {
      setIsConnecting(false)
    }
  }, [user, isIdle, callState.status])

  // Aceitar chamada recebida
  const acceptCall = useCallback(async (): Promise<void> => {
    if (!callState.callId || callState.status !== 'ringing') {
      return
    }

    try {
      setIsConnecting(true)

      // Validar permissões
      if (callState.type) {
        const hasPermissions = await callService.validateMediaPermissions(callState.type)
        if (!hasPermissions) {
          rejectCall()
          return
        }
      }

      // Aceitar via service
      await callService.acceptCall(callState.callId)

      // Atualizar estado local
      setCallState(prev => ({
        ...prev,
        status: 'connected'
      }))

      options.onCallConnected?.()

    } catch (error) {
      console.error('Erro ao aceitar chamada:', error)
      rejectCall()
    } finally {
      setIsConnecting(false)
    }
  }, [callState, options])

  // Rejeitar chamada
  const rejectCall = useCallback(async (): Promise<void> => {
    if (!callState.callId) return

    try {
      // Rejeitar via service
      await callService.rejectCall(callState.callId)
      options.onCallRejected?.()

    } catch (error) {
      console.error('Erro ao rejeitar chamada:', error)
    }

    // Limpar estado
    setCallState({
      status: 'idle',
      type: null,
      targetUser: null,
      callId: null,
      isInitiator: false,
      duration: 0
    })
  }, [callState.callId, options])

  // Encerrar chamada
  const endCall = useCallback(async (reason?: string): Promise<void> => {
    if (!callState.callId) return

    try {
      if (reason === 'timeout') {
        // Marcar como perdida
        await callService.markCallAsMissed(callState.callId)
      } else {
        // Encerrar normalmente
        await callService.endCall(callState.callId, callState.duration)
      }
      
      options.onCallEnded?.()

    } catch (error) {
      console.error('Erro ao encerrar chamada:', error)
    }

    // Limpar estado
    setCallState({
      status: 'idle',
      type: null,
      targetUser: null,
      callId: null,
      isInitiator: false,
      duration: 0
    })
  }, [callState, options])

  // Funções específicas para compatibilidade
  const startAudioCall = useCallback((targetUser: CallUser) => {
    return startCall(targetUser, 'audio')
  }, [startCall])

  const startVideoCall = useCallback((targetUser: CallUser) => {
    return startCall(targetUser, 'video')
  }, [startCall])

  // Formatar duração da chamada
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Timer para duração da chamada
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (callState.status === 'connected') {
      interval = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }))
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [callState.status])

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      if (!isIdle) {
        endCall()
      }
    }
  }, [])

  return {
    // Estado da chamada
    callState,
    isInCall,
    isIdle,
    isCalling,
    isRinging,
    isConnecting,
    error,

    // Ações de chamada
    startCall,
    startAudioCall,
    startVideoCall,
    acceptCall,
    rejectCall,
    endCall,

    // Utilitários
    formatDuration: () => formatDuration(callState.duration),
    
    // Compatibilidade com componentes existentes
    targetUser: callState.targetUser,
    currentCall: callState,
    callType: callState.type
  }
}

export default useUnifiedCall
