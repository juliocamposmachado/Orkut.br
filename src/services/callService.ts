import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface CallUser {
  id: string
  name: string
  photo?: string
  username?: string
  display_name?: string
  photo_url?: string
}

export type CallType = 'audio' | 'video'
export type CallStatus = 'ringing' | 'connected' | 'ended' | 'declined' | 'missed'

export interface CallData {
  id: string
  caller_id: string
  receiver_id: string
  call_type: CallType
  status: CallStatus
  caller_info: {
    id: string
    name: string
    photo?: string
    username?: string
  }
  started_at: string
  answered_at?: string | null
  ended_at?: string | null
  duration_seconds?: number | null
}

export interface CallNotificationPayload {
  targetUserId: string
  callType: CallType
  callId: string
  caller: CallUser
}

/**
 * Serviço unificado para gerenciar chamadas de áudio e vídeo
 * Fornece uma API consistente para todas as operações de chamada
 */
class CallService {
  private static instance: CallService
  
  public static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService()
    }
    return CallService.instance
  }

  /**
   * Inicia uma chamada (áudio ou vídeo)
   */
  async startCall(caller: CallUser, receiver: CallUser, type: CallType): Promise<CallData> {
    try {
      // Gerar ID único para a chamada
      const callId = this.generateCallId(caller.id, receiver.id, type)
      
      // Preparar dados da chamada
      const callData = {
        id: callId,
        caller_id: caller.id,
        receiver_id: receiver.id,
        call_type: type,
        status: 'ringing' as CallStatus,
        caller_info: {
          id: caller.id,
          name: caller.name || caller.display_name || 'Usuário',
          photo: caller.photo || caller.photo_url,
          username: caller.username
        }
      }

      // Inserir registro da chamada no banco
      const { data, error } = await supabase
        .from('calls')
        .insert(callData)
        .select()
        .single()

      if (error) {
        throw new Error(`Erro ao registrar chamada: ${error.message}`)
      }

      // Enviar notificação para o destinatário
      await this.sendCallNotification({
        targetUserId: receiver.id,
        callType: type,
        callId: callId,
        caller: caller
      })

      toast.success(`Chamando ${receiver.name || receiver.display_name}...`)
      return data

    } catch (error) {
      console.error('Erro ao iniciar chamada:', error)
      const message = (error as Error).message || 'Erro ao iniciar chamada'
      toast.error(message)
      throw error
    }
  }

  /**
   * Aceita uma chamada recebida
   */
  async acceptCall(callId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('calls')
        .update({ 
          status: 'connected',
          answered_at: new Date().toISOString()
        })
        .eq('id', callId)

      if (error) {
        throw new Error(`Erro ao aceitar chamada: ${error.message}`)
      }

      toast.success('Chamada conectada!')

    } catch (error) {
      console.error('Erro ao aceitar chamada:', error)
      toast.error('Erro ao aceitar chamada')
      throw error
    }
  }

  /**
   * Rejeita uma chamada recebida
   */
  async rejectCall(callId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('calls')
        .update({ 
          status: 'declined',
          ended_at: new Date().toISOString()
        })
        .eq('id', callId)

      if (error) {
        throw new Error(`Erro ao rejeitar chamada: ${error.message}`)
      }

      toast.info('Chamada rejeitada')

    } catch (error) {
      console.error('Erro ao rejeitar chamada:', error)
      throw error
    }
  }

  /**
   * Encerra uma chamada ativa
   */
  async endCall(callId: string, duration?: number): Promise<void> {
    try {
      const updateData: Partial<CallData> = {
        status: 'ended',
        ended_at: new Date().toISOString()
      }

      if (duration !== undefined) {
        updateData.duration_seconds = duration
      }

      const { error } = await supabase
        .from('calls')
        .update(updateData)
        .eq('id', callId)

      if (error) {
        throw new Error(`Erro ao encerrar chamada: ${error.message}`)
      }

      const message = duration 
        ? `Chamada encerrada - ${this.formatDuration(duration)}`
        : 'Chamada encerrada'
      
      toast.info(message)

    } catch (error) {
      console.error('Erro ao encerrar chamada:', error)
      throw error
    }
  }

  /**
   * Marca uma chamada como perdida
   */
  async markCallAsMissed(callId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('calls')
        .update({ 
          status: 'missed',
          ended_at: new Date().toISOString()
        })
        .eq('id', callId)

      if (error) {
        throw new Error(`Erro ao marcar chamada como perdida: ${error.message}`)
      }

    } catch (error) {
      console.error('Erro ao marcar chamada como perdida:', error)
      throw error
    }
  }

  /**
   * Busca histórico de chamadas do usuário
   */
  async getCallHistory(userId: string, limit = 50): Promise<CallData[]> {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Erro ao buscar histórico: ${error.message}`)
      }

      return data || []

    } catch (error) {
      console.error('Erro ao buscar histórico de chamadas:', error)
      throw error
    }
  }

  /**
   * Valida permissões de mídia para o tipo de chamada
   */
  async validateMediaPermissions(type: CallType): Promise<boolean> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('WebRTC não é suportado neste navegador')
      }

      const constraints = {
        audio: true,
        video: type === 'video'
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Parar tracks imediatamente após validação
      stream.getTracks().forEach(track => track.stop())
      
      return true

    } catch (error) {
      console.error('Erro ao validar permissões de mídia:', error)
      const message = type === 'video' 
        ? 'Permissão de câmera e microfone necessária para chamadas de vídeo'
        : 'Permissão de microfone necessária para chamadas de áudio'
      
      toast.error(message)
      return false
    }
  }

  /**
   * Envia notificação de chamada via API
   */
  private async sendCallNotification(payload: CallNotificationPayload): Promise<void> {
    const response = await fetch('/api/call-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserId: payload.targetUserId,
        callType: payload.callType,
        callId: payload.callId,
        offer: {
          type: 'offer',
          callId: payload.callId,
          from: payload.caller.id,
          to: payload.targetUserId,
          callType: payload.callType,
          caller: payload.caller,
          timestamp: new Date().toISOString()
        }
      })
    })

    if (!response.ok) {
      throw new Error('Erro ao enviar notificação de chamada')
    }
  }

  /**
   * Gera ID único para chamada
   */
  private generateCallId(userId1: string, userId2: string, type: CallType): string {
    const sortedIds = [userId1, userId2].sort()
    return `call_${type}_${sortedIds[0]}_${sortedIds[1]}_${Date.now()}`
  }

  /**
   * Formatar duração da chamada
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}

// Funções de conveniência para uso direto
export const callService = CallService.getInstance()

export const startAudioCall = (caller: CallUser, receiver: CallUser) =>
  callService.startCall(caller, receiver, 'audio')

export const startVideoCall = (caller: CallUser, receiver: CallUser) =>
  callService.startCall(caller, receiver, 'video')

export const acceptCall = (callId: string) =>
  callService.acceptCall(callId)

export const rejectCall = (callId: string) =>
  callService.rejectCall(callId)

export const endCall = (callId: string, duration?: number) =>
  callService.endCall(callId, duration)

export const validateMediaPermissions = (type: CallType) =>
  callService.validateMediaPermissions(type)

export default callService
