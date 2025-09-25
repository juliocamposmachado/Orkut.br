import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, generateDemoToken, logAdminAction } from '@/lib/admin-auth'

/**
 * API de Login Administrativo (DEMO)
 * Para demonstração do sistema de administradores
 */
export async function POST(request: NextRequest) {
  console.log('🔐 [ADMIN-LOGIN] Tentativa de login administrativo')
  
  try {
    const body = await request.json()
    const { email, action } = body
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email é obrigatório'
      }, { status: 400 })
    }
    
    console.log('📧 [ADMIN-LOGIN] Verificando email:', email)
    
    // Verificar se o email é de administrador
    const authCheck = requireAdmin(email)
    
    if (!authCheck.authorized) {
      logAdminAction('FAILED_LOGIN_ATTEMPT', email, { reason: authCheck.error })
      
      return NextResponse.json({
        success: false,
        error: authCheck.error,
        is_admin: false,
        email: email,
        message: 'Este email não tem permissões de administrador',
        timestamp: new Date().toISOString()
      }, { status: 403 })
    }
    
    // Gerar token de demonstração
    const token = generateDemoToken(email)
    
    // Log do login bem-sucedido
    logAdminAction('SUCCESSFUL_LOGIN', email, { action, ip: request.ip })
    
    console.log('✅ [ADMIN-LOGIN] Login autorizado para:', email)
    
    return NextResponse.json({
      success: true,
      is_admin: true,
      user: authCheck.user,
      token,
      message: `Bem-vindo, administrador! Login autorizado para ${email}`,
      permissions: [
        'CREATE_COMMUNITY',
        'EDIT_COMMUNITY',
        'DELETE_COMMUNITY',
        'MANAGE_USERS',
        'VIEW_ADMIN_PANEL'
      ],
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ [ADMIN-LOGIN] Erro no login:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/login - Verificar status de administrador
 */
export async function GET(request: NextRequest) {
  console.log('🔍 [ADMIN-LOGIN] Verificando status administrativo')
  
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email é obrigatório como parâmetro de query'
      }, { status: 400 })
    }
    
    const authCheck = requireAdmin(email)
    
    return NextResponse.json({
      success: true,
      is_admin: authCheck.authorized,
      email: email,
      user: authCheck.user,
      error: authCheck.error,
      message: authCheck.authorized ? 
        'Email tem permissões de administrador' : 
        'Email não tem permissões de administrador',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ [ADMIN-LOGIN] Erro na verificação:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
