import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ code: string }>
}

/**
 * GET /r/[code]
 * Ruta pública para tracking de clics en enlaces de referido
 * Registra el clic y redirige al curso o página principal
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { code } = await params
  const supabase = await createClient()

  try {
    // Obtener headers para tracking
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || ''
    const referer = headersList.get('referer') || ''
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const visitorIp = forwardedFor?.split(',')[0]?.trim() || realIp || ''

    // Detectar tipo de dispositivo
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent)
    const isTablet = /tablet|ipad/i.test(userAgent)
    const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'

    // Llamar a la función RPC para trackear el clic
    const { data: result, error } = await supabase.rpc('track_referral_click', {
      p_code: code,
      p_visitor_ip: visitorIp,
      p_user_agent: userAgent.substring(0, 500),
      p_referer_url: referer.substring(0, 1000),
      p_landing_page: request.nextUrl.pathname,
      p_country_code: null, // Se puede obtener via geolocalización si es necesario
      p_device_type: deviceType,
    })

    if (error) {
      console.error(`❌ [r/${code}] Error en track_referral_click:`, error)
    }

    // Si el enlace no es válido o expiró
    if (!result?.success) {
      console.log(`⚠️ [r/${code}] Enlace inválido o expirado: ${result?.error}`)
      // Redirigir a la página principal con mensaje
      return NextResponse.redirect(new URL('/cursos?ref=invalid', request.url))
    }

    console.log(`✅ [r/${code}] Clic registrado: click_id=${result.click_id}`)

    // Construir URL de destino
    let destinationUrl = '/cursos'

    // Si el enlace tiene un curso específico, obtener el slug
    if (result.course_id) {
      const { data: course } = await supabase
        .from('courses')
        .select('slug, status')
        .eq('id', result.course_id)
        .single()

      if (course?.slug && course.status === 'published') {
        destinationUrl = `/cursos/${course.slug}`
      }
    }

    // Añadir UTM parameters a la URL de destino
    const destination = new URL(destinationUrl, request.url)
    if (result.utm_source) destination.searchParams.set('utm_source', result.utm_source)
    if (result.utm_medium) destination.searchParams.set('utm_medium', result.utm_medium)
    if (result.utm_campaign) destination.searchParams.set('utm_campaign', result.utm_campaign)
    destination.searchParams.set('ref', code)

    // Crear response con cookie de atribución
    const response = NextResponse.redirect(destination)

    // Establecer cookie de atribución (7 días)
    const attributionData = JSON.stringify({
      link_id: result.link_id,
      click_id: result.click_id,
      code: code,
      timestamp: Date.now(),
    })

    response.cookies.set('nodo360_ref', attributionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    })

    return response
  } catch (error) {
    console.error(`❌ [r/${code}] Error inesperado:`, error)
    // En caso de error, redirigir a cursos sin tracking
    return NextResponse.redirect(new URL('/cursos', request.url))
  }
}
