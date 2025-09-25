'use client'

import { useState } from 'react'

export default function TestAdminPage() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Testar login de admin
  const testAdminLogin = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          action: 'test_login'
        })
      })
      
      const data = await response.json()
      setResult(data)
      
    } catch (error) {
      setResult({
        success: false,
        error: 'Erro na requisição',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  // Testar criação de comunidade
  const testCreateCommunity = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email.trim()
        },
        body: JSON.stringify({
          name: 'Comunidade de Teste Admin',
          description: 'Uma comunidade criada para testar o sistema de administradores do Orkut BR.',
          category: 'Tecnologia',
          privacy: 'public',
          user_email: email.trim()
        })
      })
      
      const data = await response.json()
      setResult(data)
      
    } catch (error) {
      setResult({
        success: false,
        error: 'Erro na requisição',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔐 Teste de Sistema Administrativo
          </h1>
          <p className="text-gray-600">
            Teste as funcionalidades de administrador do Orkut BR
          </p>
        </div>

        {/* Formulário de Teste */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Digite seu Email</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de Teste
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu email aqui..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Administradores configurados: juliocamposmachado@gmail.com, radiotatuapefm@gmail.com
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={testAdminLogin}
                disabled={loading || !email.trim()}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? '⏳ Testando...' : '🔐 Testar Login Admin'}
              </button>

              <button
                onClick={testCreateCommunity}
                disabled={loading || !email.trim()}
                className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? '⏳ Testando...' : '🏠 Testar Criar Comunidade'}
              </button>
            </div>
          </div>
        </div>

        {/* Resultado */}
        {result && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {result.success ? '✅ Resultado' : '❌ Erro'}
            </h2>
            
            <div className={`p-4 rounded-lg ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="space-y-2">
                <div>
                  <strong>Status:</strong> {result.success ? 'Sucesso' : 'Falha'}
                </div>
                
                {result.is_admin !== undefined && (
                  <div>
                    <strong>É Admin:</strong> {result.is_admin ? '✅ SIM' : '❌ NÃO'}
                  </div>
                )}
                
                {result.message && (
                  <div>
                    <strong>Mensagem:</strong> {result.message}
                  </div>
                )}
                
                {result.error && (
                  <div className="text-red-600">
                    <strong>Erro:</strong> {result.error}
                  </div>
                )}
                
                {result.admin_emails && (
                  <div>
                    <strong>Admins Configurados:</strong> {result.admin_emails.join(', ')}
                  </div>
                )}
                
                {result.permissions && (
                  <div>
                    <strong>Permissões:</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {result.permissions.map((perm: string, index: number) => (
                        <li key={index} className="text-sm">{perm}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* JSON completo */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium">
                  Ver resposta completa (JSON)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Instruções de Teste</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li><strong>1.</strong> Digite um dos emails de administrador configurados</li>
            <li><strong>2.</strong> Clique em "Testar Login Admin" para verificar permissões</li>
            <li><strong>3.</strong> Clique em "Testar Criar Comunidade" para testar criação</li>
            <li><strong>4.</strong> Teste com outros emails para ver a negação de acesso</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
