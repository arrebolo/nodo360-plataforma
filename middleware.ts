import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Rutas de admin que requieren rol de admin
  const adminRoutes = ['/admin']
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  // Si es ruta protegida y no hay usuario, redirigir a login
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si es ruta de admin, verificar rol
  if (isAdminRoute && user) {
    // Obtener el rol del usuario desde user_metadata o desde la base de datos
    const userRole = user.user_metadata?.role || 'user'

    // También podemos verificar por email para admins específicos
    const adminEmails = ['admin@nodo360.com', 'alberto@nodo360.com']
    const isAdmin = userRole === 'admin' || adminEmails.includes(user.email || '')

    if (!isAdmin) {
      // No es admin, redirigir al dashboard normal
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Si el usuario está logueado y va a login/registro, redirigir a dashboard
  const authRoutes = ['/login', '/registro']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/registro',
  ],
}
