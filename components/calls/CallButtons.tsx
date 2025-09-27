'use client'

import React from 'react'
import { Phone, Video, PhoneCall } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUnifiedCall, type CallUser } from '@/src/hooks/useUnifiedCall'

interface CallButtonsProps {
  targetUser: CallUser
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost' | 'compact'
  showLabels?: boolean
  className?: string
}

export const CallButtons: React.FC<CallButtonsProps> = ({
  targetUser,
  disabled = false,
  size = 'md',
  variant = 'default',
  showLabels = false,
  className = ''
}) => {
  const {
    startAudioCall,
    startVideoCall,
    isConnecting,
    isCalling,
    isInCall
  } = useUnifiedCall()

  const handleAudioCall = async () => {
    if (disabled || isConnecting || isInCall) return
    await startAudioCall(targetUser)
  }

  const handleVideoCall = async () => {
    if (disabled || isConnecting || isInCall) return
    await startVideoCall(targetUser)
  }

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return variant === 'compact' ? 'w-8 h-8' : 'w-9 h-9'
      case 'lg': return variant === 'compact' ? 'w-12 h-12' : 'w-14 h-14'
      default: return variant === 'compact' ? 'w-10 h-10' : 'w-12 h-12'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4'
      case 'lg': return 'w-6 h-6'
      default: return 'w-5 h-5'
    }
  }

  const getButtonVariant = () => {
    if (variant === 'compact') return 'ghost'
    return variant === 'default' ? 'outline' : variant
  }

  const buttonClasses = `
    ${getButtonSize()}
    rounded-full
    ${variant === 'compact' ? 'p-0' : 'p-2'}
    transition-all duration-200
    hover:scale-105
    disabled:opacity-50 
    disabled:cursor-not-allowed
    disabled:hover:scale-100
  `

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <div className={`flex items-center space-x-1 ${className}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleAudioCall}
                disabled={disabled || isConnecting || isInCall}
                variant={getButtonVariant()}
                className={`${buttonClasses} hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20`}
              >
                {isConnecting || isCalling ? (
                  <PhoneCall className={`${getIconSize()} animate-pulse`} />
                ) : (
                  <Phone className={getIconSize()} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chamada de áudio</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleVideoCall}
                disabled={disabled || isConnecting || isInCall}
                variant={getButtonVariant()}
                className={`${buttonClasses} hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20`}
              >
                {isConnecting || isCalling ? (
                  <Video className={`${getIconSize()} animate-pulse`} />
                ) : (
                  <Video className={getIconSize()} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chamada de vídeo</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Botão de áudio */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleAudioCall}
              disabled={disabled || isConnecting || isInCall}
              variant={getButtonVariant()}
              className={`
                ${buttonClasses}
                ${showLabels ? 'px-4 w-auto' : ''}
                bg-green-500 hover:bg-green-600 
                text-white border-green-500
                disabled:bg-gray-400 disabled:border-gray-400
              `}
            >
              {isConnecting || isCalling ? (
                <PhoneCall className={`${getIconSize()} animate-pulse`} />
              ) : (
                <Phone className={getIconSize()} />
              )}
              {showLabels && (
                <span className={`ml-2 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
                  {isConnecting || isCalling ? 'Chamando...' : 'Áudio'}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isConnecting || isCalling ? 'Iniciando chamada de áudio...' : 'Chamada de áudio'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Botão de vídeo */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleVideoCall}
              disabled={disabled || isConnecting || isInCall}
              variant={getButtonVariant()}
              className={`
                ${buttonClasses}
                ${showLabels ? 'px-4 w-auto' : ''}
                bg-blue-500 hover:bg-blue-600 
                text-white border-blue-500
                disabled:bg-gray-400 disabled:border-gray-400
              `}
            >
              {isConnecting || isCalling ? (
                <Video className={`${getIconSize()} animate-pulse`} />
              ) : (
                <Video className={getIconSize()} />
              )}
              {showLabels && (
                <span className={`ml-2 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
                  {isConnecting || isCalling ? 'Chamando...' : 'Vídeo'}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isConnecting || isCalling ? 'Iniciando chamada de vídeo...' : 'Chamada de vídeo'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

// Componente simplificado para casos onde só queremos um botão de chamada
interface SingleCallButtonProps {
  targetUserId: string
  type: 'audio' | 'video'
  onCall: (userId: string, type: 'audio' | 'video') => Promise<void>
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  showLabel?: boolean
  className?: string
}

export const SingleCallButton: React.FC<SingleCallButtonProps> = ({
  targetUserId,
  type,
  onCall,
  disabled = false,
  size = 'md',
  variant = 'default',
  showLabel = false,
  className = ''
}) => {
  const [isCalling, setIsCalling] = React.useState(false)

  const handleCall = async () => {
    if (disabled || isCalling) return

    try {
      setIsCalling(true)
      await onCall(targetUserId, type)
    } catch (error) {
      console.error(`Erro ao iniciar chamada de ${type}:`, error)
    } finally {
      setIsCalling(false)
    }
  }

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'w-9 h-9'
      case 'lg': return 'w-14 h-14'
      default: return 'w-12 h-12'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4'
      case 'lg': return 'w-6 h-6'
      default: return 'w-5 h-5'
    }
  }

  const getColors = () => {
    if (type === 'audio') {
      return 'bg-green-500 hover:bg-green-600 border-green-500'
    }
    return 'bg-blue-500 hover:bg-blue-600 border-blue-500'
  }

  const getLabel = () => {
    if (isCalling) {
      return 'Chamando...'
    }
    return type === 'audio' ? 'Ligar' : 'Vídeo'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleCall}
            disabled={disabled || isCalling}
            variant={variant}
            className={`
              ${getButtonSize()}
              ${showLabel ? 'px-4 w-auto' : ''}
              rounded-full p-2
              ${getColors()}
              text-white
              transition-all duration-200
              hover:scale-105
              disabled:opacity-50 
              disabled:cursor-not-allowed
              disabled:hover:scale-100
              disabled:bg-gray-400 
              disabled:border-gray-400
              ${className}
            `}
          >
            {isCalling ? (
              <PhoneCall className={`${getIconSize()} animate-pulse`} />
            ) : type === 'audio' ? (
              <Phone className={getIconSize()} />
            ) : (
              <Video className={getIconSize()} />
            )}
            {showLabel && (
              <span className={`ml-2 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
                {getLabel()}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isCalling 
              ? `Iniciando chamada de ${type === 'audio' ? 'áudio' : 'vídeo'}...`
              : `Chamada de ${type === 'audio' ? 'áudio' : 'vídeo'}`
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
