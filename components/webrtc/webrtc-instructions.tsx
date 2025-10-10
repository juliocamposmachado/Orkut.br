'use client'

import { useState } from 'react'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Key, 
  Globe, 
  Wifi, 
  Server,
  Users,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  Github,
  Book,
  AlertTriangle
} from 'lucide-react'

export function WebRTCInstructions() {
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    architecture: false,
    security: false,
    deployment: false,
    troubleshooting: false
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Visão Geral */}
      <OrkutCard>
        <OrkutCardHeader>
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            📡 Chat P2P Criptografado - Guia Completo
          </h2>
        </OrkutCardHeader>
        <OrkutCardContent>
          <div className="space-y-4">
            <p className="text-purple-700">
              Sistema de chat peer-to-peer usando WebRTC DataChannel com criptografia ponta-a-ponta baseada no protocolo Double Ratchet, 
              similar ao usado pelo Signal e WhatsApp.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold text-sm">Seguro</h3>
                <p className="text-xs text-purple-400">E2E Encryption</p>
              </div>
              <div className="text-center">
                <Globe className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold text-sm">P2P</h3>
                <p className="text-xs text-purple-400">Conexão Direta</p>
              </div>
              <div className="text-center">
                <Wifi className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold text-sm">WebRTC</h3>
                <p className="text-xs text-purple-400">Baixa Latência</p>
              </div>
              <div className="text-center">
                <Server className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold text-sm">Serverless</h3>
                <p className="text-xs text-purple-400">Sem Intermediários</p>
              </div>
            </div>
          </div>
        </OrkutCardContent>
      </OrkutCard>

      {/* Como Usar */}
      <OrkutCard>
        <OrkutCardHeader>
          <h3 className="text-lg font-semibold">🚀 Como Usar</h3>
        </OrkutCardHeader>
        <OrkutCardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-purple-600 mb-3">👤 Pessoa A (Criador da Sala)</h4>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full text-xs flex items-center justify-center">1</span>
                    <div>
                      <strong>Criar sala:</strong> Digite um ID único (ex: "minha-conversa-123")
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full text-xs flex items-center justify-center">2</span>
                    <div>
                      <strong>Entrar na sala:</strong> Clique "Entrar na Sala"
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full text-xs flex items-center justify-center">3</span>
                    <div>
                      <strong>Compartilhar:</strong> Envie o ID da sala para seu amigo
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full text-xs flex items-center justify-center">4</span>
                    <div>
                      <strong>Aguardar:</strong> Espere a conexão P2P ser estabelecida
                    </div>
                  </li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-purple-600 mb-3">👤 Pessoa B (Participante)</h4>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full text-xs flex items-center justify-center">1</span>
                    <div>
                      <strong>Receber ID:</strong> Cole o ID da sala compartilhado pelo amigo
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full text-xs flex items-center justify-center">2</span>
                    <div>
                      <strong>Entrar:</strong> Clique "Entrar na Sala"
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full text-xs flex items-center justify-center">3</span>
                    <div>
                      <strong>Conectar:</strong> A conexão P2P será estabelecida automaticamente
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-pink-500 text-white rounded-full text-xs flex items-center justify-center">4</span>
                    <div>
                      <strong>Conversar:</strong> Comece a enviar mensagens seguras
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-700 mb-2">✅ Indicadores de Sucesso</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Status "connected" na conexão</li>
                <li>• Badge "Online" no chat</li>
                <li>• Mensagem "✅ Conectado P2P com sucesso!" no log</li>
                <li>• Capacidade de enviar e receber mensagens</li>
              </ul>
            </div>
          </div>
        </OrkutCardContent>
      </OrkutCard>

      {/* Arquitetura Técnica */}
      <OrkutCard>
        <OrkutCardHeader>
          <Button
            variant="ghost"
            onClick={() => toggleSection('architecture')}
            className="w-full justify-between p-0 h-auto"
          >
            <h3 className="text-lg font-semibold">🏗️ Arquitetura Técnica</h3>
            {expandedSections.architecture ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </OrkutCardHeader>
        {expandedSections.architecture && (
          <OrkutCardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre text-xs">
{`flowchart LR
  A[Cliente A] -- Signaling --> S[Servidor WebSocket]
  B[Cliente B] -- Signaling --> S
  A -- P2P DataChannel --> B
  A --- TURN[TURN Server]
  B --- TURN
  
  subgraph Criptografia
    Akey[Chaves X25519]
    Bkey[Chaves X25519]
    DR[Double Ratchet]
  end
  
  A --> Akey
  B --> Bkey
  Akey --> DR
  Bkey --> DR`}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold text-purple-600">Sinalização</h4>
                  <ul className="text-sm space-y-1">
                    <li>• WebSocket para SDP/ICE</li>
                    <li>• Não persiste mensagens</li>
                    <li>• Apenas para bootstrap</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600">P2P</h4>
                  <ul className="text-sm space-y-1">
                    <li>• WebRTC DataChannel</li>
                    <li>• Conexão direta entre peers</li>
                    <li>• STUN/TURN para NAT traversal</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600">Criptografia</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Double Ratchet (MVP)</li>
                    <li>• Chaves efêmeras X25519</li>
                    <li>• Forward secrecy</li>
                  </ul>
                </div>
              </div>
            </div>
          </OrkutCardContent>
        )}
      </OrkutCard>

      {/* Segurança */}
      <OrkutCard>
        <OrkutCardHeader>
          <Button
            variant="ghost"
            onClick={() => toggleSection('security')}
            className="w-full justify-between p-0 h-auto"
          >
            <h3 className="text-lg font-semibold">🔐 Segurança e Privacidade</h3>
            {expandedSections.security ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </OrkutCardHeader>
        {expandedSections.security && (
          <OrkutCardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-700 mb-2">✅ Recursos de Segurança</h4>
                  <ul className="text-sm text-green-600 space-y-1">
                    <li>• Criptografia ponta-a-ponta</li>
                    <li>• Comunicação P2P direta</li>
                    <li>• Chaves efêmeras por sessão</li>
                    <li>• Servidor não armazena conteúdo</li>
                    <li>• Forward secrecy (planned)</li>
                    <li>• Código aberto auditável</li>
                  </ul>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-700 mb-2">⚠️ Limitações MVP</h4>
                  <ul className="text-sm text-yellow-600 space-y-1">
                    <li>• Double Ratchet em placeholder</li>
                    <li>• Sem autenticação de identidade</li>
                    <li>• Sem verificação de chaves</li>
                    <li>• Logs de conexão podem existir</li>
                    <li>• Sem proteção contra DoS</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">🔄 Próximos Passos de Segurança</h4>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• Integrar libsignal-protocol real</li>
                  <li>• Implementar X3DH key agreement</li>
                  <li>• Adicionar verificação de fingerprint</li>
                  <li>• Implementar perfect forward secrecy</li>
                  <li>• Auditoria de segurança independente</li>
                </ul>
              </div>
            </div>
          </OrkutCardContent>
        )}
      </OrkutCard>

      {/* Deploy e Produção */}
      <OrkutCard>
        <OrkutCardHeader>
          <Button
            variant="ghost"
            onClick={() => toggleSection('deployment')}
            className="w-full justify-between p-0 h-auto"
          >
            <h3 className="text-lg font-semibold">🚀 Deploy e Produção</h3>
            {expandedSections.deployment ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </OrkutCardHeader>
        {expandedSections.deployment && (
          <OrkutCardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">1. Servidor de Sinalização</h4>
                <p className="text-sm mb-2">Configure sua variável de ambiente:</p>
                <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
                  NEXT_PUBLIC_SIGNALING_SERVER=wss://your-signaling-server.com
                </code>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">2. TURN Server (Recomendado)</h4>
                <p className="text-sm mb-2">Para NATs restritivos, configure coturn:</p>
                <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs overflow-x-auto">
                  turnserver -a -o -v -n --lt-cred-mech --user user:pass --realm example.org
                </code>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">3. Hospedagem</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Cliente:</strong> Vercel, Netlify, CloudFlare Pages</li>
                  <li>• <strong>Sinalização:</strong> Railway, Render, DigitalOcean</li>
                  <li>• <strong>TURN:</strong> VPS dedicado (Ubuntu/CentOS)</li>
                </ul>
              </div>
            </div>
          </OrkutCardContent>
        )}
      </OrkutCard>

      {/* Troubleshooting */}
      <OrkutCard>
        <OrkutCardHeader>
          <Button
            variant="ghost"
            onClick={() => toggleSection('troubleshooting')}
            className="w-full justify-between p-0 h-auto"
          >
            <h3 className="text-lg font-semibold">🔧 Solução de Problemas</h3>
            {expandedSections.troubleshooting ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </OrkutCardHeader>
        {expandedSections.troubleshooting && (
          <OrkutCardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-700">❌ Erro: "Erro na conexão com servidor"</h4>
                  <p className="text-sm text-red-600">
                    <strong>Causa:</strong> Servidor de sinalização indisponível<br/>
                    <strong>Solução:</strong> Verifique se NEXT_PUBLIC_SIGNALING_SERVER está configurado corretamente
                  </p>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-700">❌ Erro: "Falha na conexão P2P"</h4>
                  <p className="text-sm text-red-600">
                    <strong>Causa:</strong> NAT muito restritivo<br/>
                    <strong>Solução:</strong> Configure um servidor TURN ou use uma rede menos restritiva
                  </p>
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-700">⚠️ Aviso: "Canal não está aberto"</h4>
                  <p className="text-sm text-yellow-600">
                    <strong>Causa:</strong> DataChannel ainda conectando<br/>
                    <strong>Solução:</strong> Aguarde alguns segundos e tente novamente
                  </p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-700">💡 Dica: Melhor Performance</h4>
                  <p className="text-sm text-blue-600">
                    Use redes com boa conectividade. Evite VPNs ou proxies que possam interferir no WebRTC.
                  </p>
                </div>
              </div>
            </div>
          </OrkutCardContent>
        )}
      </OrkutCard>

      {/* Recursos Adicionais */}
      <OrkutCard>
        <OrkutCardHeader>
          <h3 className="text-lg font-semibold">📚 Recursos Adicionais</h3>
        </OrkutCardHeader>
        <OrkutCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-purple-600">Documentação</h4>
              <div className="space-y-2 text-sm">
                <a href="https://webrtc.org/" target="_blank" rel="noopener noreferrer" 
                   className="flex items-center gap-2 text-blue-600 hover:underline">
                  <ExternalLink className="h-4 w-4" />
                  WebRTC.org - Especificação oficial
                </a>
                <a href="https://signal.org/docs/specifications/doubleratchet/" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-blue-600 hover:underline">
                  <ExternalLink className="h-4 w-4" />
                  Double Ratchet - Especificação Signal
                </a>
                <a href="https://github.com/coturn/coturn" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-blue-600 hover:underline">
                  <ExternalLink className="h-4 w-4" />
                  coturn - Servidor TURN/STUN
                </a>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-purple-600">Código Fonte</h4>
              <div className="space-y-2 text-sm">
                <a href="https://github.com/juliocamposmachado/Orkut-br" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-blue-600 hover:underline">
                  <Github className="h-4 w-4" />
                  GitHub - Código deste projeto
                </a>
                <a href="https://github.com/signalapp/libsignal" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-blue-600 hover:underline">
                  <Github className="h-4 w-4" />
                  libsignal - Biblioteca de criptografia
                </a>
              </div>
            </div>
          </div>
        </OrkutCardContent>
      </OrkutCard>

      <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
        <h4 className="font-semibold text-purple-700 mb-2">💡 Importante</h4>
        <p className="text-sm text-purple-600">
          Este é um MVP (Produto Mínimo Viável) para demonstração. Para uso em produção, implemente as melhorias de segurança 
          sugeridas e faça uma auditoria de segurança completa.
        </p>
      </div>
    </div>
  )
}
