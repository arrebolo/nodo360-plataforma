import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rutas privadas que requieren autenticación
const PRIVATE_PREFIXES = ['/dashboard', '/admin']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1) Skip static files and assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/beta') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // 2) Anti-loop
  if (request.nextUrl.searchParams.get('_p') === '1') {
    return NextResponse.next()
  }

  // 3) Solo procesar rutas privadas
  const isPrivateRoute = PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (!isPrivateRoute) {
    return NextResponse.next()
  }

  // 4) Crear cliente Supabase para middleware
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 5) Obtener usuario
  const { data: { user } } = await supabase.auth.getUser()

  // 6) Sin usuario → login
  if (!user) {
    console.log('🔒 [Middleware] No auth, redirect to login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    loginUrl.searchParams.set('_p', '1')
    return NextResponse.redirect(loginUrl)
  }

  // 7) Verificar suspensión y ruta activa
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('role, active_path_id, is_suspended, suspended_reason')
    .eq('id', user.id)
    .maybeSingle()

  // Debug: Log query result
  if (userError) {
    console.log('[Middleware] Error fetching user:', userError.message)
  }

  const userRole = userRow?.role
  const isAdmin = userRole === 'admin'
  const isInstructor = userRole === 'instructor'
  const isMentor = userRole === 'mentor'
  const isPrivileged = isAdmin || isInstructor || isMentor

  // Debug log para verificar roles
  if (isPrivileged) {
    console.log(`[Middleware] Privileged user (${userRole}):`, user.id.substring(0, 8) + '...')
  }

  // Verificar si el usuario está suspendido (excepto admins)
  if (userRow?.is_suspended && !isAdmin) {
    console.log('[Middleware] User suspended:', user.id.substring(0, 8) + '...')
    const suspendedUrl = new URL('/cuenta-suspendida', request.url)
    if (userRow.suspended_reason) {
      suspendedUrl.searchParams.set('reason', userRow.suspended_reason)
    }
    suspendedUrl.searchParams.set('_p', '1')
    return NextResponse.redirect(suspendedUrl)
  }

  // Beta access check removed - all authenticated users can access

  // 8) Solo rutas de CONTENIDO de cursos requieren ruta activa
  // La mayoría de rutas del dashboard NO requieren active_path_id
  // Solo se requiere para acceder a lecciones específicas dentro de una ruta

  // Rutas que SÍ requieren active_path_id (contenido de aprendizaje):
  const routesRequiringActivePath = [
    '/dashboard/leccion',
    '/dashboard/modulo',
  ]

  const isDashboard = pathname.startsWith('/dashboard')
  const requiresActivePath = routesRequiringActivePath.some(route => pathname.startsWith(route))

  // Solo redirigir si:
  // 1. Es una ruta que requiere active_path_id
  // 2. No es usuario privilegiado
  // 3. No tiene active_path_id
  if (isDashboard && requiresActivePath && !isPrivileged && !userRow?.active_path_id) {
    console.log('[Middleware] No active path for content route:', pathname)
    const rutasUrl = new URL('/dashboard/rutas', request.url)
    rutasUrl.searchParams.set('_p', '1')
    return NextResponse.redirect(rutasUrl)
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}


