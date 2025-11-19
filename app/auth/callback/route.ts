// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('🚀🚀🚀 [Auth Callback] ===== CALLBACK EJECUTÁNDOSE ===== 🚀🚀🚀')

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')

  console.log('📍 [Auth Callback] Code:', code ? 'Presente' : 'Ausente')
  console.log('📍 [Auth Callback] Next:', next)
  console.log('📍 [Auth Callback] Full URL:', requestUrl.href)

  if (code) {
    try {
      const supabase = await createClient()

      console.log('🔄 [Auth Callback] Intercambiando código por sesión...')
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('❌❌❌ [Auth Callback] Error al intercambiar código:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=callback_error`)
      }

      console.log('✅ [Auth Callback] Sesión establecida correctamente')

      // Obtener usuario autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      console.log('👤 [Auth Callback] Usuario obtenido:')
      console.log('   - ID:', user?.id)
      console.log('   - Email:', user?.email)
      console.log('   - Error:', userError)

      if (user) {
        // INTENTAR TABLA 'users' PRIMERO
        console.log('🔍 [Auth Callback] Consultando tabla "users"...')
        const { data: userProfile, error: userProfileError } = await supabase
          .from('users')
          .select('role, full_name')
          .eq('id', user.id)
          .single()

        console.log('📊 [Auth Callback] Resultado tabla "users":')
        console.log('   - Data:', userProfile)
        console.log('   - Error:', userProfileError)

        let profile = userProfile
        let profileError = userProfileError

        // SI FALLA, INTENTAR TABLA 'profiles'
        if (userProfileError) {
          console.log('🔍 [Auth Callback] Consultando tabla "profiles"...')
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('user_id', user.id)
            .single()

          console.log('📊 [Auth Callback] Resultado tabla "profiles":')
          console.log('   - Data:', profileData)
          console.log('   - Error:', profileErr)

          profile = profileData
          profileError = profileErr
        }

        if (!profileError && profile) {
          console.log('✅✅✅ [Auth Callback] PERFIL ENCONTRADO:')
          console.log('   - Nombre:', profile.full_name)
          console.log('   - Rol:', profile.role)

          // Si hay parámetro next, usarlo
          if (next && next !== '/') {
            console.log('↪️ [Auth Callback] Usando parámetro next:', next)
            return NextResponse.redirect(new URL(next, requestUrl.origin))
          }

          // Redirigir según rol
          const isAdmin = profile.role === 'admin' || profile.role === 'instructor'

          console.log('🎯 [Auth Callback] Decisión de redirect:')
          console.log('   - Es admin/instructor:', isAdmin)
          console.log('   - Rol exacto:', profile.role)

          if (isAdmin) {
            console.log('👑👑👑 [Auth Callback] REDIRIGIENDO A /admin/cursos 👑👑👑')
            return NextResponse.redirect(new URL('/admin/cursos', requestUrl.origin))
          }

          console.log('👤 [Auth Callback] Usuario normal → /dashboard')
          return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
        } else {
          console.error('❌❌❌ [Auth Callback] NO SE PUDO LEER EL PERFIL')
          console.error('   - Error:', profileError)
          console.error('   - Verifica RLS en Supabase!')
          console.error('   - Verifica que la tabla "users" o "profiles" existe')
        }
      }

      // Fallback a dashboard si no se pudo determinar el rol
      console.log('⚠️⚠️⚠️ [Auth Callback] FALLBACK: Redirigiendo a /dashboard')
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    } catch (error) {
      console.error('❌❌❌ [Auth Callback] Error inesperado:', error)
      return NextResponse.redirect(
        new URL(`/login?error=callback_error`, requestUrl.origin)
      )
    }
  }

  console.log('❌ [Auth Callback] No hay código, redirigiendo a login')
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
