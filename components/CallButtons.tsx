import React, { useState, useEffect } from 'react';
import { useUnifiedCall, type CallUser } from '@/src/hooks/useUnifiedCall';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Video, Loader2 } from 'lucide-react';

interface CallButtonsProps {
  user: CallUser;
  isOnline?: boolean;
  size?: 'small' | 'medium' | 'large';
  layout?: 'horizontal' | 'vertical';
  showLabels?: boolean;
}

export const CallButtons: React.FC<CallButtonsProps> = ({
  user,
  isOnline = true,
  size = 'medium',
  layout = 'horizontal',
  showLabels = false
}) => {
  const { startAudioCall, startVideoCall, isInCall, isConnecting } = useUnifiedCall();
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      const isTouch = 'ontouchstart' in window
      const isSmallScreen = window.innerWidth <= 768
      
      setIsMobile(mobileRegex.test(userAgent) || isTouch || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleAudioCall = async () => {
    if (isInCall || !isOnline || isConnecting) return;
    await startAudioCall(user);
  };

  const handleVideoCall = async () => {
    if (isInCall || !isOnline || isConnecting) return;
    await startVideoCall(user);
  };

  const isDisabled = !isOnline || isInCall || isConnecting;

  // Dynamic sizing - adjust for mobile
  const sizeClasses = {
    small: isMobile ? 'w-10 h-10' : 'w-8 h-8',
    medium: isMobile ? 'w-12 h-12' : 'w-10 h-10',
    large: isMobile ? 'w-14 h-14' : 'w-12 h-12'
  }

  const iconSizes = {
    small: isMobile ? 'h-5 w-5' : 'h-4 w-4',
    medium: isMobile ? 'h-6 w-6' : 'h-5 w-5', 
    large: isMobile ? 'h-7 w-7' : 'h-6 w-6'
  }

  return (
    <div className={`flex items-center ${
      layout === 'vertical' ? 'flex-col gap-3' : 'flex-row'
    } ${
      isMobile ? 'gap-3' : 'gap-2'
    }`}>
      {/* Audio Call Button */}
      <Button
        onClick={handleAudioCall}
        disabled={isDisabled}
        size={isMobile ? 'default' : 'sm'}
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          transition-all duration-300 
          transform hover:scale-105 active:scale-95
          bg-gradient-to-r from-purple-500 to-purple-600 
          hover:from-purple-600 hover:to-purple-700
          disabled:from-gray-400 disabled:to-gray-500
          disabled:cursor-not-allowed disabled:transform-none
          shadow-lg hover:shadow-xl
          border-2 border-white/20
          group
          ${
            isMobile 
              ? 'active:scale-90 touch-manipulation min-h-[48px] min-w-[48px]' 
              : ''
          }
        `}
        style={{
          // Ensure touch-friendly size on mobile
          minHeight: isMobile ? '48px' : undefined,
          minWidth: isMobile ? '48px' : undefined
        }}
        title={
          !isOnline 
            ? `${user.name || user.display_name} está offline`
            : isInCall 
            ? 'Chamada em andamento'
            : `Ligar para ${user.name || user.display_name}`
        }
      >
        {isConnecting ? (
          <Loader2 className={`${iconSizes[size]} animate-spin text-white`} />
        ) : (
          <Phone className={`${iconSizes[size]} text-white group-hover:text-purple-100`} />
        )}
      </Button>

      {/* Video Call Button */}
      <Button
        onClick={handleVideoCall}
        disabled={isDisabled}
        size={isMobile ? 'default' : 'sm'}
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          transition-all duration-300 
          transform hover:scale-105 active:scale-95
          bg-gradient-to-r from-pink-500 to-pink-600 
          hover:from-pink-600 hover:to-pink-700
          disabled:from-gray-400 disabled:to-gray-500
          disabled:cursor-not-allowed disabled:transform-none
          shadow-lg hover:shadow-xl
          border-2 border-white/20
          group
          ${
            isMobile 
              ? 'active:scale-90 touch-manipulation min-h-[48px] min-w-[48px]' 
              : ''
          }
        `}
        style={{
          // Ensure touch-friendly size on mobile
          minHeight: isMobile ? '48px' : undefined,
          minWidth: isMobile ? '48px' : undefined
        }}
        title={
          !isOnline 
            ? `${user.name || user.display_name} está offline`
            : isInCall 
            ? 'Chamada em andamento'
            : `Videochamada com ${user.name || user.display_name}`
        }
      >
        {isConnecting ? (
          <Loader2 className={`${iconSizes[size]} animate-spin text-white`} />
        ) : (
          <Video className={`${iconSizes[size]} text-white group-hover:text-pink-100`} />
        )}
      </Button>

      {/* Labels (se habilitado) */}
      {showLabels && (
        <div className={`text-gray-600 ${
          layout === 'vertical' ? 'text-center' : isMobile ? 'ml-3' : 'ml-2'
        } ${
          isMobile ? 'text-sm' : 'text-xs'
        }`}>
          <div>Áudio | Vídeo</div>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <Badge 
          variant="secondary" 
          className={`bg-gray-100 text-gray-600 ${
            isMobile ? 'ml-3 text-sm px-2 py-1' : 'ml-2 text-xs'
          }`}
        >
          <div className={`rounded-full bg-gray-400 mr-1 ${
            isMobile ? 'w-2.5 h-2.5' : 'w-2 h-2'
          }`} />
          Offline
        </Badge>
      )}

      {/* Call Active Indicator */}
      {isInCall && (
        <Badge 
          variant="default" 
          className={`bg-green-100 text-green-700 animate-pulse ${
            isMobile ? 'ml-3 text-sm px-2 py-1' : 'ml-2 text-xs'
          }`}
        >
          <div className={`rounded-full bg-green-500 mr-1 ${
            isMobile ? 'w-2.5 h-2.5' : 'w-2 h-2'
          }`} />
          Em chamada
        </Badge>
      )}
    </div>
  );
};
