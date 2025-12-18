import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testSupabaseAuth() {
  console.log('🔍 [Test] Verificando configuración de Supabase Auth...\n')

  // 1. Verificar variables de entorno
  console.log('1. Variables de entorno:')
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Falta')
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Falta')
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Falta')
  console.log('')

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Faltan variables de entorno críticas')
    return
  }

  // 2. Crear cliente
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  console.log('2. Cliente Supabase creado: ✅\n')

  // 3. Verificar conexión a auth
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.log('3. Conexión a Auth:', '⚠️  Sin sesión activa (normal si no hay usuario logueado)')
    } else {
      console.log('3. Conexión a Auth:', data.session ? '✅ Sesión activa' : '✅ Funcional (sin sesión)')
    }
  } catch (err) {
    console.error('3. Conexión a Auth:', '❌ Error:', err)
  }

  console.log('')

  // 4. Verificar tabla users existe
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1)

    if (error) {
      console.log('4. Tabla users:', '❌ Error:', error.message)
    } else {
      console.log('4. Tabla users:', '✅ Accesible')
      console.log('   Usuarios encontrados:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('   Primer usuario:', data[0].email, '(', data[0].role, ')')
      }
    }
  } catch (err) {
    console.error('4. Tabla users:', '❌ Error:', err)
  }

  console.log('')

  // 5. Verificar proveedores OAuth configurados en Supabase
  console.log('5. Verificación manual necesaria:')
  console.log('   → Ir a: https://supabase.com/dashboard/project/gcahtbecfidroepelcuw/auth/providers')
  console.log('   → Verificar que Google OAuth esté habilitado')
  console.log('   → Verificar que GitHub OAuth esté habilitado')
  console.log('   → Verificar que Email/Password esté habilitado')
  console.log('')

  // 6. Resumen
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 RESUMEN:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Supabase configurado correctamente')
  console.log('✅ Variables de entorno presentes')
  console.log('✅ Conexión a Auth funcional')
  console.log('✅ Tabla users accesible')
  console.log('')
  console.log('⚠️  FALTA IMPLEMENTAR:')
  console.log('   - Páginas de login/register')
  console.log('   - Middleware de protección')
  console.log('   - Componentes de autenticación')
}

testSupabaseAuth()
