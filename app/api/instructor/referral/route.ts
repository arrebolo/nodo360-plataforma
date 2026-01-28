import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/instructor/referral
 * Lista los enlaces de referido del instructor
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que es instructor/mentor/admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['instructor', 'mentor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'No tienes permisos de instructor' }, { status: 403 })
    }

    // Obtener enlaces con performance
    const { data: links, error } = await supabase
      .from('referral_link_performance')
      .select('*')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ [referral] Error obteniendo enlaces:', error)
      return NextResponse.json({ error: 'Error al obtener enlaces' }, { status: 500 })
    }

    console.log(`🔍 [referral] ${links?.length || 0} enlaces listados para instructor ${user.id}`)

    return NextResponse.json({
      success: true,
      links: links || [],
    })
  } catch (error) {
    console.error('❌ [referral] Error inesperado:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

interface CreateLinkRequest {
  course_id?: string | null
  custom_slug?: string | null
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

/**
 * POST /api/instructor/referral
 * Crea un nuevo enlace de referido
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimit(request, 'strict')
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que es instructor/mentor/admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['instructor', 'mentor', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'No tienes permisos de instructor' }, { status: 403 })
    }

    const body: CreateLinkRequest = await request.json()
    const { course_id, custom_slug, utm_source, utm_medium, utm_campaign } = body

    // Si hay course_id, verificar que el curso pertenece al instructor
    if (course_id) {
      const { data: course } = await supabase
        .from('courses')
        .select('id, instructor_id')
        .eq('id', course_id)
        .single()

      if (!course) {
        return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
      }

      // Admins pueden crear enlaces para cualquier curso
      if (profile.role !== 'admin' && course.instructor_id !== user.id) {
        return NextResponse.json({ error: 'No eres el instructor de este curso' }, { status: 403 })
      }
    }

    // Validar custom_slug si existe
    if (custom_slug) {
      const slugRegex = /^[a-zA-Z0-9_-]+$/
      if (!slugRegex.test(custom_slug)) {
        return NextResponse.json({
          error: 'El slug solo puede contener letras, números, guiones y guiones bajos'
        }, { status: 400 })
      }

      // Verificar que no existe otro enlace con el mismo slug para este instructor
      const { data: existing } = await supabase
        .from('referral_links')
        .select('id')
        .eq('instructor_id', user.id)
        .eq('custom_slug', custom_slug)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ error: 'Ya tienes un enlace con este slug' }, { status: 409 })
      }
    }

    // Generar código único
    const { data: code, error: codeError } = await supabase.rpc('generate_referral_code')

    if (codeError || !code) {
      console.error('❌ [referral] Error generando código:', codeError)
      return NextResponse.json({ error: 'Error al generar código' }, { status: 500 })
    }

    // Crear enlace
    const { data: link, error } = await supabase
      .from('referral_links')
      .insert({
        instructor_id: user.id,
        course_id: course_id || null,
        code,
        custom_slug: custom_slug || null,
        utm_source: utm_source || 'referral',
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [referral] Error creando enlace:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'El código o slug ya existe' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Error al crear enlace' }, { status: 500 })
    }

    console.log(`✅ [referral] Enlace creado: ${link.code} por instructor ${user.id}`)

    return NextResponse.json({
      success: true,
      link,
    }, { status: 201 })
  } catch (error) {
    console.error('❌ [referral] Error inesperado:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
