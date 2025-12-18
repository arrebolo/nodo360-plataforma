// app/api/admin/users/role/route.ts
//
// API para cambiar roles de usuarios
// Usa service_role para bypassear RLS y evitar recursión
//
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { isValidRole } from '@/lib/auth/roles'

// Cliente con service_role (bypasa RLS)
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    // 1) Cliente normal: verificar auth y rol
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el usuario actual es admin
    const { data: me, error: meError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (meError) {
      console.error('❌ [Admin/Role] Error obteniendo rol:', meError)
      return NextResponse.json(
        { error: 'Error verificando permisos' },
        { status: 500 }
      )
    }

    if (me?.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado - Solo admins pueden cambiar roles' },
        { status: 403 }
      )
    }

    // 2) Leer body
    const body = await req.json()

    if (!body.userId || !body.newRole) {
      return NextResponse.json(
        { error: 'userId y newRole son requeridos' },
        { status: 400 }
      )
    }

    if (!isValidRole(body.newRole)) {
      return NextResponse.json(
        { error: 'Rol no válido. Permitidos: student, instructor, mentor, admin' },
        { status: 400 }
      )
    }

    // 3) Cliente service role: hacer UPDATE sin RLS
    const { error } = await supabaseAdmin
      .from('users')
      .update({ role: body.newRole })
      .eq('id', body.userId)

    if (error) {
      console.error('❌ [Admin/Role] Error al cambiar rol:', error)
      return NextResponse.json(
        { error: 'Error al cambiar rol' },
        { status: 500 }
      )
    }

    console.log(`✅ [Admin/Role] Rol cambiado: ${body.userId} → ${body.newRole}`)

    return NextResponse.json(
      { success: true, message: `Rol cambiado a ${body.newRole}` },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ [Admin/Role] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
