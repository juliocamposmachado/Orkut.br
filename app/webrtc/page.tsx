'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Send, 
  Users, 
  Wifi, 
  WifiOff,
  Shield,
  Key,
  Globe,
  Info,
  Copy,
  ExternalLink,
  Book
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// NoopRatchet para permitir tráfego enquanto a integração real não é feita
class NoopRatchet {
  async encrypt(plaintext: string) {
    return { t: Date.now(), body: plaintext }
  }
  async decrypt(ciphertextObj: any) {
    return ciphertextObj?.body ?? ''
  }
}

interface SignalMessage {
  cmd: string
  room?: string
  payload?: any
}

export default function WebRTCPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // Estados WebRTC
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [pc, setPc] = useState<RTCPeerConnection | null>(null)
  const [dc, setDc] = useState<RTCDataChannel | null>(null)
  const [isOfferer, setIsOfferer] = useState(false)
  const [connectionState, setConnectionState] = useState<string>('new')
  const [channelState, setChannelState] = useState<string>('closed')
  
  // Estados UI
  const [room, setRoom] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [peersCount, setPeersCount] = useState(0)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{id: number, text: string, sent: boolean, time: Date}>>([])
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const ratchetSend = useRef(new NoopRatchet())
  const ratchetRecv = useRef(new NoopRatchet())

  // Configuração da URL do servidor de sinalização
  const wsUrl = process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'wss://your-signaling-server.com'

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, loading, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const addMessage = (text: string, sent: boolean = false) => {
    const newMessage = {
      id: Date.now(),
      text,
      sent,
      time: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const setupPeerConnection = () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Adicione aqui sua configuração de TURN se necessário
        // { urls: 'turn:your.turn.server:3478', username: 'user', credential: 'pass' }
      ]
    })

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && ws) {
        ws.send(JSON.stringify({ cmd: 'signal', payload: event.candidate }))
      }
    }

    peerConnection.onconnectionstatechange = () => {
      setConnectionState(peerConnection.connectionState)
      if (peerConnection.connectionState === 'connected') {
        addMessage('✅ Conectado P2P com sucesso!')
      } else if (peerConnection.connectionState === 'failed') {
        addMessage('❌ Falha na conexão P2P')
      }
    }

    // Para receber DataChannel do peer remoto
    peerConnection.ondatachannel = (event) => {
      const channel = event.channel
      wireDataChannel(channel)
      addMessage('📡 Canal de dados recebido')
    }

    setPc(peerConnection)
    return peerConnection
  }

  const wireDataChannel = (channel: RTCDataChannel) => {
    channel.onopen = () => {
      setChannelState('open')
      setIsConnected(true)
      addMessage('🔗 Canal de chat aberto')
    }
    
    channel.onclose = () => {
      setChannelState('closed')
      setIsConnected(false)
      addMessage('🔗 Canal de chat fechado')
    }
    
    channel.onerror = (error) => {
      addMessage('❌ Erro no canal: ' + error)
    }
    
    channel.onmessage = async (event) => {
      try {
        const ct = JSON.parse(event.data)
        const plaintext = await ratchetRecv.current.decrypt(ct)
        addMessage(plaintext, false)
      } catch (err) {
        addMessage('Mensagem recebida (erro parse): ' + event.data, false)
      }
    }

    setDc(channel)
  }

  const createOffererChannel = (peerConnection: RTCPeerConnection) => {
    const dataChannel = peerConnection.createDataChannel('chat')
    wireDataChannel(dataChannel)
    return dataChannel
  }

  const handleSignal = async (payload: any) => {
    if (!pc) return

    if (payload.type === 'offer') {
      await pc.setRemoteDescription(payload)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      ws?.send(JSON.stringify({ cmd: 'signal', payload: pc.localDescription }))
      return
    }
    
    if (payload.type === 'answer') {
      await pc.setRemoteDescription(payload)
      return
    }
    
    if (payload.candidate) {
      try { 
        await pc.addIceCandidate(payload) 
      } catch (e) { 
        // ignore 
      }
    }
  }

  const connectToRoom = () => {
    if (!room.trim()) {
      toast.error('Digite um nome de sala')
      return
    }

    const websocket = new WebSocket(wsUrl)
    
    websocket.onopen = () => {
      addMessage('🌐 Conectado ao servidor de sinalização')
      websocket.send(JSON.stringify({ cmd: 'join', room: room.trim() }))
    }

    websocket.onmessage = async (event) => {
      const msg: SignalMessage = JSON.parse(event.data)
      
      if (msg.cmd === 'joined') {
        const count = (msg as any).count
        setPeersCount(count)
        setIsOfferer(count === 1)
        addMessage(`🏠 Entrou na sala. Peers: ${count}. Papel: ${count === 1 ? 'offerer' : 'answerer'}`)

        const peerConnection = setupPeerConnection()

        if (count === 1) {
          // É o primeiro, vai criar a oferta
          const dataChannel = createOffererChannel(peerConnection)
          const offer = await peerConnection.createOffer()
          await peerConnection.setLocalDescription(offer)
          websocket.send(JSON.stringify({ cmd: 'signal', payload: peerConnection.localDescription }))
          addMessage('📤 Oferta enviada, aguardando peer...')
        }
        return
      }

      if (msg.cmd === 'signal' && msg.payload) {
        await handleSignal(msg.payload)
      }
    }

    websocket.onclose = () => {
      addMessage('🌐 Desconectado do servidor')
    }

    websocket.onerror = () => {
      addMessage('❌ Erro na conexão com servidor')
      toast.error('Erro na conexão com servidor de sinalização')
    }

    setWs(websocket)
  }

  const sendMessage = async () => {
    if (!dc || dc.readyState !== 'open') {
      toast.error('Canal não está aberto')
      return
    }
    
    if (!message.trim()) return

    try {
      const encrypted = await ratchetSend.current.encrypt(message.trim())
      dc.send(JSON.stringify(encrypted))
      addMessage(message.trim(), true)
      setMessage('')
    } catch (error) {
      toast.error('Erro ao enviar mensagem')
    }
  }

  const disconnect = () => {
    dc?.close()
    pc?.close()
    ws?.close()
    setDc(null)
    setPc(null)
    setWs(null)
    setIsConnected(false)
    setConnectionState('closed')
    setChannelState('closed')
    setPeersCount(0)
    addMessage('🔌 Desconectado')
  }

  const copyRoomId = () => {
    navigator.clipboard.writeText(room)
    toast.success('ID da sala copiado!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-400 via-pink-300 to-orange-200">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 via-pink-300 to-orange-200">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header com info sobre WebRTC */}
        <div className="mb-6">
          <OrkutCard>
            <OrkutCardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Chat P2P Criptografado
                  </h1>
                  <p className="text-sm text-purple-600">WebRTC DataChannel + Double Ratchet (MVP)</p>
                </div>
              </div>
            </OrkutCardHeader>
            <OrkutCardContent>
              <div className="flex flex-wrap gap-4 items-center">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  E2E Encryption
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  P2P Direct
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  WebRTC
                </Badge>
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  Conexão: {connectionState}
                </div>
              </div>
            </OrkutCardContent>
          </OrkutCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Conexão */}
          <div className="lg:col-span-1">
            <OrkutCard>
              <OrkutCardHeader>
                <h2 className="text-lg font-semibold">Conectar-se</h2>
              </OrkutCardHeader>
              <OrkutCardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-purple-600">ID da Sala</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="ex: minha-sala-123"
                      disabled={isConnected}
                    />
                    {room && (
                      <Button variant="outline" size="icon" onClick={copyRoomId}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {!isConnected ? (
                  <Button onClick={connectToRoom} className="w-full" disabled={!room.trim()}>
                    <Users className="h-4 w-4 mr-2" />
                    Entrar na Sala
                  </Button>
                ) : (
                  <Button onClick={disconnect} variant="destructive" className="w-full">
                    <PhoneOff className="h-4 w-4 mr-2" />
                    Desconectar
                  </Button>
                )}

                {peersCount > 0 && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm">
                      <strong>Peers na sala:</strong> {peersCount}
                    </p>
                    <p className="text-xs text-purple-600">
                      Papel: {isOfferer ? 'Offerer' : 'Answerer'}
                    </p>
                  </div>
                )}
              </OrkutCardContent>
            </OrkutCard>

            {/* Instruções */}
            <OrkutCard className="mt-4">
              <OrkutCardHeader>
                <h3 className="text-md font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Como usar
                </h3>
              </OrkutCardHeader>
              <OrkutCardContent>
                <div className="text-sm space-y-2 text-purple-600">
                  <p>1. Digite um ID de sala único</p>
                  <p>2. Compartilhe o ID com seu amigo</p>
                  <p>3. Ambos cliquem "Entrar na Sala"</p>
                  <p>4. Aguarde a conexão P2P</p>
                  <p>5. Conversem com segurança!</p>
                  
                  <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
                    <strong>⚠️ MVP:</strong> A cifragem E2E está em desenvolvimento (usando placeholder).
                  </div>
                  
                  <div className="mt-3">
                    <Link href="/webrtc/instrucoes">
                      <Button variant="outline" size="sm" className="w-full">
                        <Book className="h-4 w-4 mr-2" />
                        Ver Guia Completo
                      </Button>
                    </Link>
                  </div>
                </div>
              </OrkutCardContent>
            </OrkutCard>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <OrkutCard>
              <OrkutCardHeader>
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Chat Seguro</h2>
                  <div className="flex items-center gap-2">
                    {channelState === 'open' ? (
                      <Badge className="bg-green-500">
                        <Wifi className="h-3 w-3 mr-1" />
                        Online
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <WifiOff className="h-3 w-3 mr-1" />
                        Offline
                      </Badge>
                    )}
                  </div>
                </div>
              </OrkutCardHeader>
              <OrkutCardContent>
                {/* Messages */}
                <div className="h-96 overflow-y-auto bg-purple-50 rounded-lg p-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-purple-400 mt-20">
                      <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Mensagens aparecerão aqui...</p>
                      <p className="text-xs mt-1">Conecte-se a uma sala para começar</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                              msg.sent
                                ? 'bg-purple-500 text-white'
                                : 'bg-white text-purple-800 border border-purple-200'
                            }`}
                          >
                            <p>{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.sent ? 'text-purple-200' : 'text-purple-400'}`}>
                              {msg.time.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    disabled={!isConnected}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage} disabled={!isConnected || !message.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {!isConnected && (
                  <p className="text-xs text-purple-400 mt-2">
                    Conecte-se a uma sala para enviar mensagens
                  </p>
                )}
              </OrkutCardContent>
            </OrkutCard>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-6">
          <OrkutCard>
            <OrkutCardHeader>
              <h3 className="text-lg font-semibold">Informações Técnicas</h3>
            </OrkutCardHeader>
            <OrkutCardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-purple-600">Protocolo</h4>
                  <p>WebRTC DataChannel</p>
                  <p className="text-xs text-purple-400">Comunicação P2P direta</p>
                </div>
                <div>
                  <h4 className="font-medium text-purple-600">Criptografia</h4>
                  <p>Double Ratchet (MVP)</p>
                  <p className="text-xs text-purple-400">E2E encryption placeholder</p>
                </div>
                <div>
                  <h4 className="font-medium text-purple-600">Servidor</h4>
                  <p>Apenas sinalização</p>
                  <p className="text-xs text-purple-400">Não armazena mensagens</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-600 mb-2">⚙️ Configuração do Servidor</h4>
                <p className="text-sm text-blue-600">
                  Para usar em produção, configure a variável de ambiente <code>NEXT_PUBLIC_SIGNALING_SERVER</code> 
                  com a URL do seu servidor de sinalização WebSocket.
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  Exemplo: wss://your-signaling-server.com
                </p>
              </div>
            </OrkutCardContent>
          </OrkutCard>
        </div>
      </div>

      <Footer />
    </div>
  )
}
