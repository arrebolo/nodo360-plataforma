import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  console.log('🔍 [Middleware] Request to:', request.nextUrl.pathname)

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('ℹ️ [Middleware] User:', user?.email || 'No autenticado')

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/profile', '/settings', '/cursos/.*/quiz']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.match(new RegExp(`^${route}`))
  )

  // Rutas de auth (login, register) - redirigir a dashboard si ya está autenticado
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname)

  // Si está en ruta protegida y NO está autenticado → redirigir a login
  if (isProtectedRoute && !user) {
    console.log('⚠️ [Middleware] Ruta protegida sin auth → Redirigiendo a /login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si está en ruta de auth y YA está autenticado → redirigir según rol
  if (isAuthRoute && user) {
    console.log('🔍🔍🔍 [Middleware] Usuario autenticado en ruta de auth, verificando rol...')

    // Intentar obtener rol desde tabla users
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('📊 [Middleware] Rol obtenido:', userProfile?.role)

    // Si es admin o instructor, redirigir a admin panel
    if (userProfile?.role === 'admin' || userProfile?.role === 'instructor') {
      console.log('👑👑👑 [Middleware] Admin/Instructor → Redirigiendo a /admin/cursos')
      return NextResponse.redirect(new URL('/admin/cursos', request.url))
    }

    console.log('👤 [Middleware] Usuario normal → Redirigiendo a /dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log('✅ [Middleware] Permitiendo acceso')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
