import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * La guarda de administración PARA RUTAS DE API.
 *
 * POR QUE NO SIRVE requireAdmin() AQUI
 *   `requireAdmin()` llama a `redirect()`, que no devuelve: lanza. En una pantalla
 *   eso es exactamente lo que se quiere —te manda al sitio correcto—, pero en una
 *   ruta de API la excepción cae en su `try/catch`, que responde lo que tenga a mano.
 *   Medido con una sesión de instructor de verdad:
 *
 *     DELETE /api/admin/modules/<id>     500  {"error":"Error del servidor: NEXT_REDIRECT"}
 *     DELETE /api/admin/courses/<id>     500  {"error":"Error del servidor: NEXT_REDIRECT"}
 *     POST   /api/admin/modules/reorder  500  {"error":"Error del servidor: NEXT_REDIRECT"}
 *
 *   Ni siquiera es una redirección: es un 500 con el nombre de una excepción interna
 *   dentro. Quien llama no puede distinguir «no tienes permiso» de «se ha roto algo»,
 *   y en el cliente no hay forma de reaccionar bien a eso.
 *
 * LO QUE DEVUELVE
 *   401 si no hay sesión, 403 si la hay y no es administración. Esos dos, y no otros:
 *   son los que el protocolo tiene para esto.
 *
 * El rol sale de `public.users.role` con el cliente de SESION, no del cuerpo de la
 * petición ni de una cabecera.
 */
export type GuardaDeApi =
  | { ok: true; userId: string; rol: string }
  | { ok: false; respuesta: NextResponse }

function no(mensaje: string, estado: number): GuardaDeApi {
  return { ok: false, respuesta: NextResponse.json({ error: mensaje }, { status: estado }) }
}

export async function exigirAdminEnApi(): Promise<GuardaDeApi> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return no('No autorizado', 401)

  const { data: perfil } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const rol = (perfil?.role as string | undefined) ?? ''
  if (rol !== 'admin') {
    return no('Esto solo lo hace la administración.', 403)
  }

  return { ok: true, userId: user.id, rol }
}
