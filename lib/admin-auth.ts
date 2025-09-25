/**
 * Sistema de Autenticação e Permissões de Administradores
 * Gerencia quem pode criar, editar e gerenciar comunidades
 */

// Lista de administradores do sistema (emails)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []

console.log('🔐 [ADMIN-AUTH] Administradores configurados:', ADMIN_EMAILS)

export interface AdminUser {
  email: string
  name?: string
  github_username?: string
  is_admin: boolean
}

/**
 * Verifica se um email é de administrador
 */
export function isAdmin(email: string): boolean {
  if (!email) return false
  
  const isAdminUser = ADMIN_EMAILS.includes(email.toLowerCase().trim())
  console.log(`🔍 [ADMIN-AUTH] Verificando admin "${email}": ${isAdminUser ? '✅ SIM' : '❌ NÃO'}`)
  
  return isAdminUser
}

/**
 * Cria um usuário administrativo temporário para demonstração
 * Em produção, isso viria de um sistema de autenticação real
 */
export function createDemoAdminUser(email: string): AdminUser {
  return {
    email: email.toLowerCase().trim(),
    name: email.split('@')[0],
    github_username: email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ''),
    is_admin: isAdmin(email)
  }
}

/**
 * Middleware para verificar se o usuário tem permissões administrativas
 */
export function requireAdmin(userEmail?: string): { authorized: boolean, user?: AdminUser, error?: string } {
  console.log('🔐 [ADMIN-AUTH] Verificando permissões para:', userEmail)
  
  if (!userEmail) {
    return {
      authorized: false,
      error: 'Email do usuário não fornecido'
    }
  }

  const user = createDemoAdminUser(userEmail)
  
  if (!user.is_admin) {
    return {
      authorized: false,
      user,
      error: 'Acesso negado - Apenas administradores podem realizar esta ação'
    }
  }

  console.log('✅ [ADMIN-AUTH] Acesso autorizado para admin:', user.email)
  return {
    authorized: true,
    user
  }
}

/**
 * Lista todos os emails de administradores configurados
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS]
}

/**
 * Verifica se o sistema tem administradores configurados
 */
export function hasAdminsConfigured(): boolean {
  return ADMIN_EMAILS.length > 0
}

/**
 * Cria logs de auditoria para ações administrativas
 */
export function logAdminAction(action: string, userEmail: string, details?: any) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    action,
    admin: userEmail,
    details,
    session: `session-${Date.now()}`
  }
  
  console.log('📋 [ADMIN-AUDIT]', JSON.stringify(logEntry, null, 2))
  
  // Em produção, salvar em arquivo ou banco de dados
  return logEntry
}

/**
 * Gera um token temporário para demonstração
 * Em produção, usar JWT ou sistema similar
 */
export function generateDemoToken(userEmail: string): string {
  if (!isAdmin(userEmail)) {
    throw new Error('Apenas administradores podem gerar tokens')
  }
  
  const token = Buffer.from(
    JSON.stringify({
      email: userEmail,
      is_admin: true,
      expires: Date.now() + (24 * 60 * 60 * 1000), // 24 horas
      issued: Date.now()
    })
  ).toString('base64')
  
  console.log('🎟️ [ADMIN-AUTH] Token gerado para:', userEmail)
  return token
}

/**
 * Valida um token de administrador (demo)
 */
export function validateDemoToken(token: string): { valid: boolean, email?: string, error?: string } {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    
    if (decoded.expires < Date.now()) {
      return {
        valid: false,
        error: 'Token expirado'
      }
    }
    
    if (!isAdmin(decoded.email)) {
      return {
        valid: false,
        error: 'Email não é mais administrador'
      }
    }
    
    return {
      valid: true,
      email: decoded.email
    }
    
  } catch (error) {
    return {
      valid: false,
      error: 'Token inválido'
    }
  }
}
