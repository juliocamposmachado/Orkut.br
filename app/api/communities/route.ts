import { NextRequest, NextResponse } from 'next/server'
import { githubDB } from '@/lib/github-db'
import { requireAdmin, logAdminAction, hasAdminsConfigured, getAdminEmails } from '@/lib/admin-auth'

/**
 * API Unificada de Comunidades - GITHUB EXCLUSIVAMENTE
 * Esta API usa APENAS GitHub como banco de dados para comunidades
 * O Supabase é completamente ignorado neste endpoint
 * 
 * Rotas:
 * GET /api/communities - Lista comunidades do GitHub
 * POST /api/communities - Cria comunidade no GitHub
 * PUT /api/communities - Atualiza comunidade no GitHub
 * DELETE /api/communities - Remove comunidade do GitHub
 */

/**
 * GET /api/communities - Lista comunidades do GitHub APENAS
 */
export async function GET(request: NextRequest) {
  console.log('🏠 [COMMUNITIES] Buscando comunidades EXCLUSIVAMENTE do GitHub')
  
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verificar se GitHub está configurado
    if (!githubDB.isConfigured()) {
      console.warn('⚠️ GitHub não configurado - usando dados demo')
      
      const { communities, total } = githubDB.getDemoCommunities()
      
      // Aplicar filtros nos dados demo
      let filteredCommunities = [...communities]
      
      if (category && category !== 'Todos') {
        filteredCommunities = filteredCommunities.filter(c => c.category === category)
      }
      
      if (search) {
        const searchTerm = search.toLowerCase()
        filteredCommunities = filteredCommunities.filter(c =>
          c.name.toLowerCase().includes(searchTerm) ||
          c.description.toLowerCase().includes(searchTerm)
        )
      }
      
      return NextResponse.json({
        success: true,
        communities: filteredCommunities.slice(offset, offset + limit),
        total: filteredCommunities.length,
        demo: true,
        source: 'github-demo',
        message: 'Dados demo - Configure GITHUB_TOKEN para usar GitHub real',
        timestamp: new Date().toISOString()
      })
    }

    // Buscar comunidades no GitHub
    console.log('📡 Buscando comunidades do GitHub com filtros:', { category, search, limit, offset })
    
    const result = await githubDB.getCommunities({
      category,
      search,
      limit,
      offset
    })

    console.log(`✅ ${result.communities.length} comunidades encontradas no GitHub`)

    return NextResponse.json({
      success: true,
      communities: result.communities,
      total: result.total,
      pagination: {
        limit,
        offset,
        hasMore: result.total > offset + limit
      },
      source: 'github',
      message: `${result.communities.length} comunidades carregadas do GitHub`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro na API de comunidades GitHub:', error)
    
    // Fallback para dados demo em caso de erro
    const { communities, total } = githubDB.getDemoCommunities()
    
    return NextResponse.json({
      success: true,
      communities: communities.slice(0, 20),
      total,
      demo: true,
      source: 'github-error-fallback',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: 'Erro no GitHub - Retornando dados demo',
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * POST /api/communities - Criar nova comunidade no GitHub APENAS
 */
export async function POST(request: NextRequest) {
  console.log('➕ [COMMUNITIES] Criando comunidade no GitHub')
  
  try {
    // Primeiro, obter os dados do body
    const body = await request.json()
    
    // Obter email do usuário do header ou body
    const userEmail = request.headers.get('x-user-email') || body?.user_email
    
    console.log('🔐 [COMMUNITIES] Verificando permissões para:', userEmail)
    
    // Verificar se tem admins configurados
    if (!hasAdminsConfigured()) {
      console.warn('⚠️ Nenhum administrador configurado - permitindo acesso livre')
    } else {
      // Verificar se usuário é admin
      const authCheck = requireAdmin(userEmail)
      
      if (!authCheck.authorized) {
        return NextResponse.json({
          success: false,
          error: 'Acesso Negado',
          message: authCheck.error,
          admin_emails: getAdminEmails(),
          current_user: userEmail,
          is_admin: false,
          help: 'Para criar comunidades, faça login com um dos emails de administrador configurados'
        }, { status: 403 })
      }
      
      // Log da ação administrativa
      logAdminAction('CREATE_COMMUNITY', userEmail!, {
        community_name: body?.name,
        category: body?.category
      })
    }
    
    // Verificar se GitHub está configurado
    if (!githubDB.isConfigured()) {
      console.warn('⚠️ GitHub não configurado')
      
      return NextResponse.json({
        success: false,
        error: 'GitHub não configurado',
        message: 'Para criar comunidades, configure: GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME',
        demo: true,
        community: {
          id: 'demo-' + Date.now(),
          name: 'Comunidade Demo',
          description: 'Esta seria uma comunidade real se o GitHub estivesse configurado',
          category: 'Demo',
          source: 'github-demo',
          created_at: new Date().toISOString()
        }
      }, { status: 503 })
    }
    const { name, description, category, privacy, rules, photo_url, owner, tags } = body

    console.log('📝 Dados recebidos para nova comunidade:', {
      name: name?.substring(0, 30) + '...',
      category,
      privacy,
      owner
    })

    // Validações rigorosas
    if (!name?.trim() || !description?.trim() || !category) {
      return NextResponse.json({
        error: 'Nome, descrição e categoria são obrigatórios',
        details: 'Todos os campos principais devem ser preenchidos'
      }, { status: 400 })
    }

    if (name.trim().length < 3 || name.trim().length > 50) {
      return NextResponse.json({
        error: 'Nome deve ter entre 3 e 50 caracteres'
      }, { status: 400 })
    }

    if (description.trim().length < 10 || description.trim().length > 500) {
      return NextResponse.json({
        error: 'Descrição deve ter entre 10 e 500 caracteres'
      }, { status: 400 })
    }

    // Preparar dados da comunidade para GitHub
    const communityData = {
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      photo_url: photo_url || `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&q=80&auto=format`,
      members_count: 1,
      owner: owner || 'github-user',
      visibility: (privacy || 'public') as 'public' | 'private' | 'restricted',
      join_approval_required: privacy === 'restricted' || privacy === 'private',
      rules: rules?.trim() || 'Seja respeitoso e mantenha as discussões relevantes ao tema da comunidade.',
      welcome_message: `Bem-vindo à comunidade ${name.trim()}! 🎉`,
      tags: Array.isArray(tags) ? tags : [],
      is_active: true
    }

    console.log('💾 Criando comunidade no GitHub...')
    
    // Criar comunidade no GitHub
    const newCommunity = await githubDB.createCommunity(communityData)

    console.log('✅ Comunidade criada com sucesso no GitHub:', {
      id: newCommunity.id,
      name: newCommunity.name,
      category: newCommunity.category
    })

    return NextResponse.json({
      success: true,
      community: newCommunity,
      message: `Comunidade \"${name.trim()}\" criada com sucesso no GitHub! 🎉`,
      source: 'github',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na criação de comunidade:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
