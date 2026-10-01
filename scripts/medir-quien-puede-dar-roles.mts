/**
 * ¿Puede alguien que no es admin darse a sí mismo el rol de instructor?
 *
 *   npx tsx scripts/medir-quien-puede-dar-roles.mts
 *
 * LO QUE SE SOSPECHA
 *   `admin_assign_instructor(p_user_id, p_admin_id, ...)` comprueba que
 *   `p_admin_id` sea un admin activo en user_roles. Pero p_admin_id es un
 *   PARAMETRO, no `auth.uid()`. Y PostgREST expone las funciones: si
 *   `authenticated` tiene EXECUTE, cualquiera con sesion puede llamarla pasando el
 *   id de un admin cualquiera y saltarse la comprobacion. CLAUDE.md lo prohibe por
 *   escrito: «la identidad sale de auth.uid(), nunca de un parametro».
 *
 * COMO SE MIDE SIN TOCAR NADA REAL
 *   No se usa el id de ningun admin de verdad. Se crean DOS cuentas de usar y
 *   tirar: una a la que se le da el rol admin en user_roles (la «victima» cuyo id se
 *   suplanta) y otra que es un student normal y hace la llamada. Si funciona, queda
 *   demostrado que el parametro se cree lo que le digan. Las dos se borran.
 */
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL as string
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const svc = createClient(URL_BASE, env.SUPABASE_SERVICE_ROLE_KEY as string, { auth: { persistSession: false } })
const anon = createClient(URL_BASE, ANON, { auth: { persistSession: false } })

const MARCA = 'qa-roles'
const CLAVE = 'Medir-' + Math.random().toString(36).slice(2) + 'K3!'
const di = (ok: boolean | null, t: string, extra = '') =>
  console.log(`   ${ok === null ? '·   ' : ok ? 'OK  ' : 'FALLA'} ${t}${extra ? '  -> ' + extra : ''}`)

const creados: string[] = []

async function cuenta(nombre: string) {
  const { data, error } = await svc.auth.admin.createUser({
    email: `${MARCA}-${nombre}-${Date.now()}@nodo360-pruebas.invalid`, password: CLAVE, email_confirm: true,
  })
  if (error) throw new Error(`${nombre}: ${error.message}`)
  creados.push(data.user.id)
  return { id: data.user.id, email: data.user.email as string }
}

try {
  // ── 1. ¿Se puede averiguar el id de un admin desde fuera? ─────────────────
  console.log('\n=== lo primero que haria falta: el id de un admin ===')
  const porAnon = await anon.from('users').select('id, role').eq('role', 'admin').limit(5)
  di(Boolean(porAnon.error) || (porAnon.data?.length ?? 0) === 0,
    'anon NO puede listar los admins',
    porAnon.error ? `${porAnon.error.code}` : `*** ${porAnon.data?.length} ids de admin a la vista`)

  const victima = await cuenta('falso-admin')
  const atacante = await cuenta('student')

  // Se le da el rol admin a la cuenta de usar y tirar, para no usar un admin real
  const { error: eRol } = await svc.from('user_roles')
    .insert({ user_id: victima.id, role: 'admin', is_active: true })
  if (eRol) throw new Error(`no se pudo preparar el falso admin: ${eRol.message}`)

  const comoStudent = createClient(URL_BASE, ANON, { auth: { persistSession: false } })
  const { error: el } = await comoStudent.auth.signInWithPassword({ email: atacante.email, password: CLAVE })
  if (el) throw new Error(el.message)
  const { data: perfil } = await svc.from('users').select('role').eq('id', atacante.id).single()
  di(perfil?.role === 'student', 'el que llama es un student normal', String(perfil?.role))

  // ── 2. ¿Es alcanzable la funcion por PostgREST con su sesion? ─────────────
  console.log('\n=== la llamada directa, con un id de admin inventado ===')
  const conIdFalso = await comoStudent.rpc('admin_assign_instructor', {
    p_user_id: atacante.id,
    p_admin_id: randomUUID(),
    p_bio: 'prueba',
    p_headline: null,
    p_reason: 'prueba',
  })
  di(Boolean(conIdFalso.error) || (conIdFalso.data as { success?: boolean })?.success === false,
    'con un p_admin_id que no es admin, se rechaza',
    conIdFalso.error ? `${conIdFalso.error.code}: ${conIdFalso.error.message.slice(0, 50)}`
      : JSON.stringify(conIdFalso.data).slice(0, 80))

  const alcanzable = !conIdFalso.error || conIdFalso.error.code !== '42501'
  di(null, 'la funcion es alcanzable por PostgREST con sesion de student',
    alcanzable ? 'SI' : 'no (42501: sin EXECUTE)')

  // ── 3. LA PRUEBA: con el id del falso admin ──────────────────────────────
  if (alcanzable) {
    console.log('\n=== y ahora con el id de un admin (el de usar y tirar) ===')
    const conIdDeAdmin = await comoStudent.rpc('admin_assign_instructor', {
      p_user_id: atacante.id,
      p_admin_id: victima.id,
      p_bio: 'prueba de escalada',
      p_headline: null,
      p_reason: 'prueba de escalada',
    })
    const salio = (conIdDeAdmin.data as { success?: boolean } | null)?.success === true
    di(!salio, '*** un student NO se puede dar el rol instructor',
      conIdDeAdmin.error ? `${conIdDeAdmin.error.code}: rechazado`
        : salio ? '*** SE LO DIO: escalada de privilegios' : JSON.stringify(conIdDeAdmin.data).slice(0, 80))

    const { data: despues } = await svc.from('users').select('role').eq('id', atacante.id).single()
    const { count: filas } = await svc.from('user_roles')
      .select('user_id', { count: 'exact', head: true }).eq('user_id', atacante.id)
    di(despues?.role === 'student' && (filas ?? 0) === 0,
      'y su rol sigue siendo student, sin filas en user_roles',
      `role=${despues?.role}, user_roles=${filas ?? 0}`)
  }

  // ── 4. Lo mismo con el de mentor ─────────────────────────────────────────
  const mentor = await comoStudent.rpc('admin_assign_mentor', {
    p_user_id: atacante.id, p_admin_id: victima.id, p_reason: 'prueba',
  })
  const salioMentor = (mentor.data as { success?: boolean } | null)?.success === true
  di(!salioMentor, 'tampoco el rol de mentor',
    mentor.error ? `${mentor.error.code}: rechazado` : salioMentor ? '*** SE LO DIO' : JSON.stringify(mentor.data).slice(0, 60))
} catch (e) {
  console.log(`\n*** se detuvo: ${(e as Error).message}`)
} finally {
  console.log('\n=== limpieza ===')
  for (const id of creados) {
    await svc.from('user_roles').delete().eq('user_id', id)
    await svc.from('instructor_profiles').delete().eq('user_id', id).then(() => {}, () => {})
    await svc.auth.admin.deleteUser(id)
  }
  const { data: resto } = await svc.auth.admin.listUsers({ perPage: 1000 })
  const quedan = (resto?.users ?? []).filter((u) => (u.email ?? '').includes(MARCA)).length
  di(quedan === 0, 'no queda ninguna cuenta de prueba', String(quedan))
}
