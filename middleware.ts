import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  console.log('🔍 [Middleware] Request to:', request.nextUrl.pathname)

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Inicializa el cliente de Supabase para acceder al usuario autenticado
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
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  console.log('ℹ️ [Middleware] User:', user?.email || 'No autenticado')

  // Rutas protegidas
  const protectedRoutes = ['/dashboard', '/profile', '/settings', '/cursos/.*/quiz']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.match(new RegExp(`^${route}`))
  )

  // Proteger lecciones individuales: /cursos/[courseSlug]/[lessonSlug]
  // Pero NO proteger /cursos ni /cursos/[courseSlug] (páginas públicas)
  const isLessonPage = /^\/cursos\/[^\/]+\/[^\/]+$/.test(request.nextUrl.pathname)
  const isProtectedLesson = isLessonPage && !request.nextUrl.pathname.endsWith('/quiz')

  // Rutas de autenticación (login, register)
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname)

  // Si está en una ruta protegida y NO está autenticado → redirigir a login
  if ((isProtectedRoute || isProtectedLesson) && !user) {
    console.log('⚠️ [Middleware] Ruta protegida sin auth → Redirigiendo a /login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname) // Para redirigir después del login
    return NextResponse.redirect(loginUrl)
  }

  // Si está en una ruta de autenticación (login/register) y YA está autenticado → redirigir según el rol
  if (isAuthRoute && user) {
    console.log('🔍🔍🔍 [Middleware] Usuario autenticado en ruta de auth, verificando rol...')

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('📊 [Middleware] Rol obtenido:', userProfile?.role)

    // Redirigir a panel de administración si es admin o instructor
    if (userProfile?.role === 'admin' || userProfile?.role === 'instructor') {
      console.log('👑👑👑 [Middleware] Admin/Instructor → Redirigiendo a /admin/cursos')
      return NextResponse.redirect(new URL('/admin/cursos', request.url))
    }

    // Usuario normal redirigido a /dashboard
    console.log('👤 [Middleware] Usuario normal → Redirigiendo a /dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log('✅ [Middleware] Permitiendo acceso')
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
