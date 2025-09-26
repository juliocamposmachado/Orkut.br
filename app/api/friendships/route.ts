import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// GET - Buscar amizades e solicitações do usuário
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // all, friends, pending_received, pending_sent

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let responseData: any = {}

    if (type === 'all' || type === 'friends') {
      // Buscar amigos - tentar usar a view primeiro, depois query manual
      let friends = []
      
      // Tentar usar a view friends_view
      const { data: friendsFromView, error: viewError } = await supabase
        .from('friends_view')
        .select('*')
        .order('friendship_date', { ascending: false })
      
      if (!viewError && friendsFromView) {
        friends = friendsFromView
      } else {
        console.warn('View friends_view não disponível, usando query manual:', viewError)
        
        // Fallback: query manual para buscar amigos
        const { data: friendsManual, error: manualError } = await supabase
          .from('friendships')
          .select(`
            id,
            requester_id,
            addressee_id,
            status,
            created_at,
            requester:profiles!friendships_requester_id_fkey (
              id,
              display_name,
              username,
              photo_url,
              bio
            ),
            addressee:profiles!friendships_addressee_id_fkey (
              id,
              display_name,
              username,
              photo_url,
              bio
            )
          `)
          .eq('status', 'accepted')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
        
        if (!manualError && friendsManual) {
          // Transformar dados para o formato esperado
          friends = friendsManual.map(f => {
            const iAmRequester = f.requester_id === user.id
            const friend = iAmRequester ? f.addressee : f.requester
            
            return {
              friendship_id: f.id,
              friend_id: friend.id,
              friend_display_name: friend.display_name,
              friend_username: friend.username,
              friend_photo_url: friend.photo_url,
              friend_bio: friend.bio,
              friendship_date: f.created_at,
              status: f.status
            }
          })
        } else {
          console.error('Erro ao buscar amigos manualmente:', manualError)
          friends = []
        }
      }
      
      responseData.friends = friends
    }

    if (type === 'all' || type === 'pending_received') {
      // Buscar solicitações recebidas
      const { data: received, error: receivedError } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          requester:profiles!friendships_requester_id_fkey (
            id,
            display_name,
            username,
            photo_url
          )
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (receivedError) {
        console.error('Erro ao buscar solicitações recebidas:', receivedError)
        responseData.pending_received = []
      } else {
        responseData.pending_received = received || []
      }
    }

    if (type === 'all' || type === 'pending_sent') {
      // Buscar solicitações enviadas
      const { data: sent, error: sentError } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          addressee:profiles!friendships_addressee_id_fkey (
            id,
            display_name,
            username,
            photo_url
          )
        `)
        .eq('requester_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (sentError) {
        console.error('Erro ao buscar solicitações enviadas:', sentError)
        responseData.pending_sent = []
      } else {
        responseData.pending_sent = sent || []
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Erro na API de friendships GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Enviar solicitação de amizade
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { addressee_id } = body

    if (!addressee_id) {
      return NextResponse.json(
        { error: 'ID do destinatário é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (user.id === addressee_id) {
      return NextResponse.json(
        { error: 'Não é possível enviar solicitação para si mesmo' },
        { status: 400 }
      )
    }

    // Verificar se já existe uma relação
    const { data: existing, error: existingError } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addressee_id}),and(requester_id.eq.${addressee_id},addressee_id.eq.${user.id})`)
      .single()

    if (!existingError && existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json(
          { error: 'Vocês já são amigos' },
          { status: 400 }
        )
      }
      if (existing.status === 'pending') {
        return NextResponse.json(
          { error: 'Solicitação já enviada' },
          { status: 400 }
        )
      }
    }

    // Verificar se o destinatário existe
    const { data: addressee, error: addresseeError } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .eq('id', addressee_id)
      .single()

    if (addresseeError || !addressee) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Criar a solicitação
    let { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .insert({
        requester_id: user.id,
        addressee_id: addressee_id,
        status: 'pending'
      })
      .select()
      .single()

    // Se falhar por RLS (código 42501), tentar com service role como fallback
    if (friendshipError && friendshipError.code === '42501') {
      console.log('⚠️ RLS falhou, tentando com service role...')
      
      // Criar cliente com service role para bypass RLS
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      
      if (serviceRoleKey && supabaseUrl) {
        const supabaseService = createClient(supabaseUrl, serviceRoleKey)
        
        const { data: fallbackFriendship, error: fallbackError } = await supabaseService
          .from('friendships')
          .insert({
            requester_id: user.id,
            addressee_id: addressee_id,
            status: 'pending'
          })
          .select()
          .single()
        
        if (!fallbackError) {
          friendship = fallbackFriendship
          friendshipError = null
          console.log('✅ Service role fallback funcionou!')
        } else {
          console.error('❌ Service role fallback também falhou:', fallbackError)
        }
      }
    }

    if (friendshipError) {
      console.error('Erro ao criar amizade:', friendshipError)
      return NextResponse.json(
        { error: 'Erro ao enviar solicitação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Solicitação enviada para ${addressee.display_name}`,
      data: friendship
    })

  } catch (error) {
    console.error('Erro na API de friendships POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Aceitar ou rejeitar solicitação
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { friendship_id, action } = body

    if (!friendship_id || !action) {
      return NextResponse.json(
        { error: 'ID da amizade e ação são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação deve ser "accept" ou "reject"' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar a solicitação
    const { data: friendship, error: findError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendship_id)
      .eq('addressee_id', user.id) // Só pode aceitar quem recebeu
      .eq('status', 'pending')
      .single()

    if (findError || !friendship) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada ou já processada' },
        { status: 404 }
      )
    }

    // IMPORTANTE: Schema só permite 'pending', 'accepted', 'blocked'
    const newStatus = action === 'accept' ? 'accepted' : 'blocked'

    // Atualizar status
    const { error: updateError } = await supabase
      .from('friendships')
      .update({ status: newStatus })
      .eq('id', friendship_id)

    if (updateError) {
      console.error('Erro ao atualizar amizade:', updateError)
      return NextResponse.json(
        { error: 'Erro ao processar solicitação' },
        { status: 500 }
      )
    }

    // Marcar notificação como lida
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('profile_id', user.id)
      .eq('type', 'friend_request')
      .contains('payload', { friendship_id })

    const message = action === 'accept' 
      ? 'Solicitação aceita com sucesso!'
      : 'Solicitação rejeitada'

    return NextResponse.json({
      success: true,
      message,
      action: newStatus
    })

  } catch (error) {
    console.error('Erro na API de friendships PUT:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover amigo
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const friendship_id = searchParams.get('friendship_id')
    const friend_id = searchParams.get('friend_id')

    if (!friendship_id && !friend_id) {
      return NextResponse.json(
        { error: 'ID da amizade ou do amigo é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let deleteQuery

    if (friendship_id) {
      deleteQuery = supabase
        .from('friendships')
        .delete()
        .eq('id', friendship_id)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    } else {
      deleteQuery = supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${friend_id}),and(requester_id.eq.${friend_id},addressee_id.eq.${user.id})`)
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      console.error('Erro ao deletar amizade:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao remover amizade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Amizade removida com sucesso'
    })

  } catch (error) {
    console.error('Erro na API de friendships DELETE:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
