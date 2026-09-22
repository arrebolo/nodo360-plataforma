import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { enrollUserInCourse, unenrollUser } from '@/lib/db/enrollments'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIP, rateLimitExceeded } from '@/lib/ratelimit'

/**
 * Trackea conversión de referido si existe cookie de atribución
 */
async function trackReferralConversion(
  userId: string,
  courseId: string,
  isFree: boolean,
  priceCents: number
) {
  try {
    const cookieStore = await cookies()
    const refCookie = cookieStore.get('nodo360_ref')

    if (!refCookie?.value) {
      return // No hay atribución de referido
    }

    const attribution = JSON.parse(refCookie.value)
    const { link_id, click_id } = attribution

    if (!link_id) {
      return
    }

    // service_role, no la sesion del usuario: esta RPC registra la comision
    // del instructor. Yendo por la sesion del usuario, cualquiera podia
    // llamarla contra PostgREST y fabricarse una conversion. Desde la 034 la
    // funcion exige auth.uid() IS NULL, o sea service_role.
    const admin = createAdminClient() as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: any; error: any }> }

    // p_commission_rate ya no se envia: la tasa la lee la funcion de
    // system_settings. Antes la elegia quien llamaba.
    const { data: result, error } = await admin.rpc('track_referral_conversion', {
      p_link_id: link_id,
      p_user_id: userId,
      p_course_id: courseId,
      p_conversion_type: isFree ? 'enrollment' : 'purchase',
      p_revenue_cents: isFree ? 0 : priceCents,
      p_click_id: click_id || null,
    })

    if (error) {
      console.error('❌ [enroll] Error tracking referral conversion:', error)
    } else if (result?.success) {
      console.log(`✅ [enroll] Referral conversion tracked: link=${link_id}, commission=${result.commission_cents}c`)
    } else {
      console.log(`ℹ️ [enroll] Referral conversion not tracked: ${result?.error}`)
    }
  } catch (err) {
    console.error('❌ [enroll] Error parsing referral cookie:', err)
  }
}

/**
 * GET /api/enroll
 *
 * Inscripción via redirect (para uso con href en botones/links).
 *
 * Parámetros:
 * - courseId: ID del curso (requerido)
 * - redirect: URL de redirección post-inscripción (opcional)
 * - format=json: devuelve JSON en lugar de redirect (debug)
 *
 * Comportamiento:
 * - No autenticado → /login?redirect=/api/enroll?courseId=...
 * - Ya inscrito → redirect destino (no duplica)
 * - No inscrito → crea enrollment → redirect destino
 * - Default destino: /api/continue?courseSlug=...
 */
export async function GET(request: NextRequest) {
  // Rate limiting moderado
  const ip = getClientIP(request)
  const { success } = await rateLimit(ip, 'api')
  if (!success) return rateLimitExceeded()

  const url = new URL(request.url)
  const courseId = url.searchParams.get('courseId')?.trim() || null
  const redirectParam = url.searchParams.get('redirect')?.trim() || null
  const format = url.searchParams.get('format')?.trim() || null
  const isJsonDebug = format === 'json'

  // 1) Validar courseId
  if (!courseId) {
    console.error('❌ [API GET /enroll] courseId requerido')
    if (isJsonDebug) {
      return NextResponse.json({ ok: false, error: 'courseId requerido' }, { status: 400 })
    }
    return NextResponse.redirect(new URL('/cursos', url.origin), 302)
  }

  const supabase = await createClient()

  // 2) Verificar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    // Preservar la URL completa de enroll para después del login
    const currentUrl = url.pathname + url.search
    const loginUrl = `/login?redirect=${encodeURIComponent(currentUrl)}`
    console.log('🔍 [API GET /enroll] No autenticado, redirigiendo a login')
    if (isJsonDebug) {
      return NextResponse.json({ ok: false, redirect: loginUrl, reason: 'no_auth' })
    }
    return NextResponse.redirect(new URL(loginUrl, url.origin), 302)
  }

  // 3) Obtener datos del curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, slug, title, status, is_free, price')
    .eq('id', courseId)
    .maybeSingle()

  if (courseError || !course) {
    console.error('❌ [API GET /enroll] Curso no encontrado:', courseId)
    if (isJsonDebug) {
      return NextResponse.json({ ok: false, redirect: '/cursos', reason: 'course_not_found' })
    }
    return NextResponse.redirect(new URL('/cursos', url.origin), 302)
  }

  if (course.status !== 'published') {
    console.error('❌ [API GET /enroll] Curso no publicado:', courseId)
    if (isJsonDebug) {
      return NextResponse.json({ ok: false, redirect: '/cursos', reason: 'course_not_published' })
    }
    return NextResponse.redirect(new URL('/cursos', url.origin), 302)
  }

  // 4) Verificar si ya está inscrito
  const { data: existingEnrollment } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  let enrolled = false

  // 5) Si no está inscrito, crear enrollment
  if (!existingEnrollment) {
    const { error: insertError } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: user.id,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        progress_percentage: 0,
      })

    if (insertError) {
      console.error('❌ [API GET /enroll] Error creando enrollment:', insertError)
    } else {
      console.log('✅ [API GET /enroll] Enrollment creado:', { userId: user.id, courseId })
      enrolled = true

      // Trackear conversión de referido si aplica
      const priceCents = course.price ? Math.round(course.price * 100) : 0
      await trackReferralConversion(user.id, courseId, course.is_free, priceCents)
    }
  } else {
    console.log('ℹ️ [API GET /enroll] Usuario ya inscrito:', { userId: user.id, courseId })
  }

  // 6) Determinar destino de redirección
  let destination: string

  if (redirectParam && redirectParam.startsWith('/')) {
    destination = redirectParam
  } else {
    // Default: ir a /api/continue para que resuelva la lección correcta
    destination = `/api/continue?courseSlug=${course.slug}`
  }

  console.log('✅ [API GET /enroll] Redirect:', { courseSlug: course.slug, destination })

  // 7) Modo JSON opcional (debug)
  if (isJsonDebug) {
    return NextResponse.json({
      ok: true,
      data: {
        enrolled,
        alreadyEnrolled: !!existingEnrollment,
        courseId: course.id,
        courseSlug: course.slug,
        courseTitle: course.title,
        redirectTo: destination,
      },
    })
  }

  // 8) Redirect final
  return NextResponse.redirect(new URL(destination, url.origin), 302)
}

/**
 * POST /api/enroll
 * Inscribe al usuario autenticado en un curso (JSON API)
 * Body: { courseId: string }
 */
export async function POST(request: NextRequest) {
  // Rate limiting moderado
  const ip = getClientIP(request)
  const { success } = await rateLimit(ip, 'api')
  if (!success) return rateLimitExceeded()

  console.log('[API POST /enroll] Iniciando...')

  try {
    // 1. Verificar autenticación
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [API POST /enroll] No autenticado')
      return NextResponse.json(
        { error: 'Debes iniciar sesión para inscribirte' },
        { status: 401 }
      )
    }

    // 2. Obtener courseId del body
    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      console.error('❌ [API POST /enroll] courseId faltante')
      return NextResponse.json(
        { error: 'courseId es requerido' },
        { status: 400 }
      )
    }

    // 3. Validar que el curso existe
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, status, is_free, price')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      console.error('❌ [API POST /enroll] Curso no encontrado:', courseId)
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    if (course.status !== 'published') {
      console.error('❌ [API POST /enroll] Curso no publicado')
      return NextResponse.json(
        { error: 'Este curso no está disponible aún' },
        { status: 403 }
      )
    }

    // 4. Inscribir usuario
    const { data, error } = await enrollUserInCourse(user.id, courseId)

    if (error) {
      console.error('❌ [API POST /enroll] Error al inscribir:', error)
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    // Trackear conversión de referido si aplica
    const priceCents = course.price ? Math.round(course.price * 100) : 0
    await trackReferralConversion(user.id, courseId, course.is_free, priceCents)

    console.log('✅ [API POST /enroll] Inscripción exitosa')
    return NextResponse.json(
      {
        data,
        message: `¡Te has inscrito exitosamente en "${course.title}"!`
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ [API POST /enroll] Exception:', error)
    console.error('❌ [API POST /enroll] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ [API POST /enroll] Error message:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/enroll
 * Desinscribe al usuario autenticado de un curso
 * Body: { courseId: string }
 */
export async function DELETE(request: NextRequest) {
  // Rate limiting moderado
  const ip = getClientIP(request)
  const { success } = await rateLimit(ip, 'api')
  if (!success) return rateLimitExceeded()

  console.log('[API DELETE /enroll] Iniciando...')

  try {
    // 1. Verificar autenticación
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ [API DELETE /enroll] No autenticado')
      return NextResponse.json(
        { error: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    // 2. Obtener courseId del body
    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      console.error('❌ [API DELETE /enroll] courseId faltante')
      return NextResponse.json(
        { error: 'courseId es requerido' },
        { status: 400 }
      )
    }

    // 3. Desinscribir usuario
    const { success, error } = await unenrollUser(user.id, courseId)

    if (!success) {
      console.error('❌ [API DELETE /enroll] Error al desinscribir:', error)
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    console.log('✅ [API DELETE /enroll] Desinscripción exitosa')
    return NextResponse.json(
      {
        success: true,
        message: 'Te has desinscrito del curso exitosamente'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ [API DELETE /enroll] Exception:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


