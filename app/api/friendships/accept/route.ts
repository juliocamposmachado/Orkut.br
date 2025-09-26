import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  console.log('🔄 API /api/friendships/accept chamada')
  
  try {
    // Parse do body com tratamento de erro
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError)
      return NextResponse.json(
        { error: 'Corpo da requisição inválido - JSON malformado' },
        { status: 400 }
      )
    }

    const { requesterId, addresseeId, notificationId, fromUser, currentUser } = body

    console.log('📥 Dados recebidos:', {
      requesterId: requesterId ? 'presente' : 'ausente',
      addresseeId: addresseeId ? 'presente' : 'ausente',
      notificationId: notificationId ? 'presente' : 'ausente',
      fromUserName: fromUser?.display_name || 'não informado',
      currentUserName: currentUser?.display_name || 'não informado'
    })

    if (!requesterId || !addresseeId) {
      return NextResponse.json(
        { error: 'IDs do solicitante e destinatário são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o usuário atual é o destinatário da solicitação
    if (user.id !== addresseeId) {
      return NextResponse.json(
        { error: 'Você só pode aceitar solicitações enviadas para você' },
        { status: 403 }
      )
    }

    // Buscar a solicitação existente
    const { data: existingFriendship, error: findError } = await supabase
      .from('friendships')
      .select('*')
      .eq('requester_id', requesterId)
      .eq('addressee_id', addresseeId)
      .eq('status', 'pending')
      .single()

    let friendship
    let friendshipError = null

    if (findError || !existingFriendship) {
      console.log('📝 Solicitação não encontrada, criando nova amizade...')
      
      // Se não encontrou a solicitação, criar uma nova amizade diretamente
      const { data: newFriendship, error: createError } = await supabase
        .from('friendships')
        .insert({
          requester_id: requesterId,
          addressee_id: addresseeId,
          status: 'accepted'
        })
        .select()
        .single()

      friendship = newFriendship
      friendshipError = createError

      // Se falhar por RLS, tentar com service role
      if (createError && createError.code === '42501') {
        console.log('⚠️ RLS falhou, tentando com service role...')
        
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        
        if (serviceRoleKey && supabaseUrl) {
          const supabaseService = createClient(supabaseUrl, serviceRoleKey)
          
          const { data: fallbackFriendship, error: fallbackError } = await supabaseService
            .from('friendships')
            .insert({
              requester_id: requesterId,
              addressee_id: addresseeId,
              status: 'accepted'
            })
            .select()
            .single()
          
          if (!fallbackError) {
            friendship = fallbackFriendship
            friendshipError = null
            console.log('✅ Service role funcionou!')
          } else {
            console.error('❌ Service role também falhou:', fallbackError)
          }
        }
      }
    } else {
      console.log('📝 Atualizando solicitação existente...')
      
      // Atualizar status da solicitação existente
      const { data: updatedFriendship, error: updateError } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', existingFriendship.id)
        .select()
        .single()

      friendship = updatedFriendship
      friendshipError = updateError

      // Se falhar por RLS, tentar com service role
      if (updateError && updateError.code === '42501') {
        console.log('⚠️ RLS falhou, tentando com service role...')
        
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        
        if (serviceRoleKey && supabaseUrl) {
          const supabaseService = createClient(supabaseUrl, serviceRoleKey)
          
          const { data: fallbackFriendship, error: fallbackError } = await supabaseService
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', existingFriendship.id)
            .select()
            .single()
          
          if (!fallbackError) {
            friendship = fallbackFriendship
            friendshipError = null
            console.log('✅ Service role funcionou!')
          } else {
            console.error('❌ Service role também falhou:', fallbackError)
          }
        }
      }
    }

    if (friendshipError) {
      console.error('Erro ao processar amizade:', friendshipError)
      return NextResponse.json(
        { error: 'Erro ao aceitar solicitação de amizade' },
        { status: 500 }
      )
    }

    // Marcar notificação como lida se fornecida
    if (notificationId) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId)
          .eq('profile_id', user.id)
      } catch (notifError) {
        console.warn('Erro ao marcar notificação como lida:', notifError)
        // Não falha a operação por causa disso
      }
    }

    console.log('✅ Amizade aceita com sucesso!')

    return NextResponse.json({
      success: true,
      message: `Solicitação de ${fromUser?.display_name || 'usuário'} aceita com sucesso!`,
      data: friendship
    })

  } catch (error) {
    console.error('Erro na API de aceitar amizade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
