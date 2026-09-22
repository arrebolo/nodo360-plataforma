import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { getProposals } from '@/lib/governance/queries'
import type { ProposalStatus, ProposalLevel } from '@/types/governance'

// GET - Listar propuestas
export async function GET(request: NextRequest) {
  // Rate limiting (governance)
  const rateLimitResponse = await checkRateLimit(request, 'governance')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const level = searchParams.get('level')
    const category = searchParams.get('category')

    // El gPower solo lo ven los usuarios registrados (decision del 22/09/2026).
    //
    // proposals_with_details es una vista security_invoker que incluye
    // author_gpower, calculado con calculate_gpower(). Desde la 036, anon no
    // tiene EXECUTE sobre esa funcion, y en Postgres el permiso se comprueba al
    // preparar la consulta: no basta con no pedir la columna ni con un CASE que
    // no llegue a ejecutarse. Consultar la vista sin sesion fallaria entera.
    //
    // Por eso, sin sesion se sirve la misma consulta con joins que usan las
    // paginas publicas (getProposals), que nunca ha calculado el gPower y
    // devuelve author_gpower a null.
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Los parametros vienen de la query string, asi que son string. Se
      // acotan aqui: el nivel solo admite 1 o 2, y cualquier otro valor se
      // ignora en lugar de colarse en la consulta.
      const nivel = level ? parseInt(level, 10) : undefined
      const proposals = await getProposals({
        status: (status as ProposalStatus) || undefined,
        level: nivel === 1 || nivel === 2 ? (nivel as ProposalLevel) : undefined,
        categoryId: category || undefined,
      })
      return NextResponse.json({ data: proposals })
    }

    let query = supabase
      .from('proposals_with_details')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (level) {
      query = query.eq('proposal_level', parseInt(level))
    }

    if (category) {
      query = query.eq('category_id', category)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ [API/proposals] GET error:', error)
    return NextResponse.json({ error: 'Error al obtener propuestas' }, { status: 500 })
  }
}

// POST - Crear propuesta
export async function POST(request: NextRequest) {
  // Rate limiting (governance)
  const rateLimitResponse = await checkRateLimit(request, 'governance')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, detailed_content, category_id, proposal_level, tags } = body

    // Validar campos requeridos
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Título y descripción son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si puede crear este nivel de propuesta
    const { data: canCreate } = await supabase
      .rpc('can_create_proposal', {
        p_user_id: user.id,
        p_level: proposal_level || 1
      })

    if (!canCreate) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear este tipo de propuesta' },
        { status: 403 }
      )
    }

    // Generar slug
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36)

    // Crear propuesta
    const { data, error } = await supabase
      .from('governance_proposals')
      .insert({
        title,
        slug,
        description,
        detailed_content,
        category_id,
        proposal_level: proposal_level || 1,
        tags: tags || [],
        author_id: user.id,
        status: body.status || 'draft',
        quorum_required: proposal_level === 2 ? 25 : 10,
        approval_threshold: proposal_level === 2 ? 0.66 : 0.60,
      })
      .select()
      .single()

    if (error) throw error

    // Actualizar contador de propuestas en reputación
    await supabase
      .from('user_reputation')
      .upsert({
        user_id: user.id,
        proposals_created: 1,
      }, {
        onConflict: 'user_id',
      })

    console.log('✅ [API/proposals] Propuesta creada:', slug)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ [API/proposals] POST error:', error)
    return NextResponse.json({ error: 'Error al crear propuesta' }, { status: 500 })
  }
}


