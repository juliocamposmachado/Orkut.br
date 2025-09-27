"use client"

import React from 'react'
import { Phone, Video, PhoneCall } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUnifiedCall, type CallUser } from '@/src/hooks/useUnifiedCall'

// CallUser is now imported from useUnifiedCall

interface IntegratedCallButtonsProps {
  user: CallUser
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost' | 'compact'
  showLabels?: boolean
  showVideoButton?: boolean
  className?: string
  disabled?: boolean
}

export const IntegratedCallButtons: React.FC<IntegratedCallButtonsProps> = ({
  user,
  size = 'md',
  variant = 'default',
  showLabels = false,
  showVideoButton = true,
  className = '',
  disabled = false
}) => {
  const { 
    startAudioCall, 
    startVideoCall, 
    isInCall, 
    isConnecting,
    targetUser,
    currentCall,
    isCalling
  } = useUnifiedCall()

  // Verificar se já está em chamada com este usuário
  const isCallActiveWithUser = isInCall && targetUser?.id === user.id
  const isCallingThisUser = (isCalling || currentCall?.status === 'calling') && targetUser?.id === user.id
  
  const handleAudioCall = async () => {
    if (disabled || isInCall || isConnecting) return
    await startAudioCall(user)
  }

  const handleVideoCall = async () => {
    if (disabled || isInCall || isConnecting) return
    await startVideoCall(user)
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

  const isButtonDisabled = disabled || isConnecting || (isInCall && !isCallActiveWithUser)

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

  // Renderização compacta
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <div className={`flex items-center space-x-1 ${className}`}>
          {/* Botão de áudio */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleAudioCall}
                disabled={isButtonDisabled}
                variant={getButtonVariant()}
                className={`
                  ${buttonClasses} 
                  hover:bg-green-50 hover:text-green-600 
                  dark:hover:bg-green-900/20
                  ${isCallingThisUser ? 'bg-green-100 text-green-700' : ''}
                `}
              >
                {isCallingThisUser ? (
                  <PhoneCall className={`${getIconSize()} animate-pulse`} />
                ) : (
                  <Phone className={getIconSize()} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isCallingThisUser 
                  ? `Chamando ${user.name}...` 
                  : `Ligar para ${user.name}`
                }
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Botão de vídeo */}
          {showVideoButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleVideoCall}
                  disabled={isButtonDisabled}
                  variant={getButtonVariant()}
                  className={`
                    ${buttonClasses} 
                    hover:bg-blue-50 hover:text-blue-600 
                    dark:hover:bg-blue-900/20
                  `}
                >
                  <Video className={getIconSize()} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Chamada de vídeo com {user.name}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    )
  }

  // Renderização normal
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Botão de áudio */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleAudioCall}
              disabled={isButtonDisabled}
              variant={getButtonVariant()}
              className={`
                ${buttonClasses}
                ${showLabels ? 'px-4 w-auto' : ''}
                bg-green-500 hover:bg-green-600 
                text-white border-green-500
                disabled:bg-gray-400 disabled:border-gray-400
                ${isCallingThisUser ? 'animate-pulse bg-green-600' : ''}
              `}
            >
              {isCallingThisUser ? (
                <PhoneCall className={`${getIconSize()} animate-pulse`} />
              ) : (
                <Phone className={getIconSize()} />
              )}
              {showLabels && (
                <span className={`ml-2 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
                  {isCallingThisUser ? 'Chamando...' : 'Ligar'}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isCallingThisUser 
                ? `Chamando ${user.name}...` 
                : `Ligar para ${user.name}`
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Botão de vídeo */}
      {showVideoButton && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleVideoCall}
                disabled={isButtonDisabled}
                variant={getButtonVariant()}
                className={`
                  ${buttonClasses}
                  ${showLabels ? 'px-4 w-auto' : ''}
                  bg-blue-500 hover:bg-blue-600 
                  text-white border-blue-500
                  disabled:bg-gray-400 disabled:border-gray-400
                `}
              >
                <Video className={getIconSize()} />
                {showLabels && (
                  <span className={`ml-2 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
                    Vídeo
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chamada de vídeo com {user.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

// Componente simplificado para apenas chamada de áudio
interface AudioCallButtonProps {
  user: CallUser
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost' | 'compact'
  showLabel?: boolean
  className?: string
  disabled?: boolean
}

export const AudioCallButton: React.FC<AudioCallButtonProps> = ({
  user,
  size = 'md',
  variant = 'default',
  showLabel = false,
  className = '',
  disabled = false
}) => {
  const { 
    startAudioCall, 
    isInCall, 
    isConnecting,
    targetUser,
    currentCall,
    isCalling
  } = useUnifiedCall()

  const isCallActiveWithUser = isInCall && targetUser?.id === user.id
  const isCallingThisUser = (isCalling || currentCall?.status === 'calling') && targetUser?.id === user.id
  
  const handleAudioCall = async () => {
    if (disabled || isInCall || isConnecting) return
    await startAudioCall(user)
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

  const isButtonDisabled = disabled || isConnecting || (isInCall && !isCallActiveWithUser)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleAudioCall}
            disabled={isButtonDisabled}
            variant={variant === 'compact' ? 'ghost' : (variant === 'default' ? 'outline' : variant)}
            className={`
              ${getButtonSize()}
              ${showLabel ? 'px-4 w-auto' : ''}
              rounded-full p-2
              bg-green-500 hover:bg-green-600 
              text-white border-green-500
              transition-all duration-200
              hover:scale-105
              disabled:opacity-50 
              disabled:cursor-not-allowed
              disabled:hover:scale-100
              disabled:bg-gray-400 
              disabled:border-gray-400
              ${isCallingThisUser ? 'animate-pulse bg-green-600' : ''}
              ${className}
            `}
          >
            {isCallingThisUser ? (
              <PhoneCall className={`${getIconSize()} animate-pulse`} />
            ) : (
              <Phone className={getIconSize()} />
            )}
            {showLabel && (
              <span className={`ml-2 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
                {isCallingThisUser ? 'Chamando...' : 'Ligar'}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isCallingThisUser 
              ? `Chamando ${user.name}...` 
              : `Ligar para ${user.name}`
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default IntegratedCallButtons
