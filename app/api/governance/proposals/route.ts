import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

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


