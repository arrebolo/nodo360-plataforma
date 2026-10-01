import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Obtiene todas las estadísticas del dashboard admin
 */
export async function getAdminStats() {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Stats básicos
  const [
    { count: coursesCount },
    { count: modulesCount },
    { count: lessonsCount },
    { count: usersCount },
    { count: enrollmentsCount },
    { count: badgesCount },
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('modules').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    // UNA CUENTA SIN CONFIRMAR NO ES UN USUARIO.
    //
    // La fila de public.users nace al registrarse, no al confirmar —medido—, asi
    // que un `count(*)` a secas cuenta tambien a quien escribio mal su direccion
    // y nunca volvio. Desde la 105, email_confirmed_at refleja auth.users.
    //
    // VA CON EL CLIENTE DE SERVICIO, y no es un capricho: email_confirmed_at esta
    // cerrada para authenticated, y en PostgREST FILTRAR por una columna que no
    // puedes leer devuelve 42501. Medido, y con una trampa encima: con
    // `head: true` el error llega VACIO y el count a null, asi que esta tarjeta
    // habria mostrado el total en blanco sin decir por que.
    admin.from('users').select('*', { count: 'exact', head: true })
      .not('email_confirmed_at', 'is', null),
    supabase.from('course_enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('badges').select('*', { count: 'exact', head: true }),
  ])

  // Usuarios activos (última semana)
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { count: activeUsersCount } = await supabase
    .from('xp_events')
    .select('user_id', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString())

  // XP otorgado esta semana
  const { data: xpThisWeek } = await supabase
    .from('xp_events')
    .select('xp_amount')
    .gte('created_at', oneWeekAgo.toISOString())

  const totalXpThisWeek = xpThisWeek?.reduce((sum, event) => sum + event.xp_amount, 0) || 0

  // Hitos desbloqueados hoy
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: badgesUnlockedToday } = await supabase
    .from('user_badges')
    .select('*', { count: 'exact', head: true })
    .gte('unlocked_at', today.toISOString())

  // Lecciones completadas hoy
  const { count: lessonsCompletedToday } = await supabase
    .from('user_progress')
    .select('*', { count: 'exact', head: true })
    .eq('is_completed', true)
    .gte('completed_at', today.toISOString())

  return {
    courses: coursesCount || 0,
    modules: modulesCount || 0,
    lessons: lessonsCount || 0,
    users: usersCount || 0,
    enrollments: enrollmentsCount || 0,
    badges: badgesCount || 0,
    activeUsers: activeUsersCount || 0,
    totalXpThisWeek,
    badgesUnlockedToday: badgesUnlockedToday || 0,
    lessonsCompletedToday: lessonsCompletedToday || 0,
  }
}

/**
 * Obtiene actividad diaria de los últimos 7 días
 */
export async function getActivityLastWeek() {
  const supabase = await createClient()
  const days = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)

    const { count } = await supabase
      .from('xp_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDate.toISOString())

    days.push({
      date: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      count: count || 0
    })
  }

  return days
}

/**
 * Obtiene distribución de usuarios por nivel
 */
export async function getUsersByLevel() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('user_gamification_stats')
    .select('current_level')

  if (!users) return []

  const levelCounts: { [key: number]: number } = {}
  users.forEach(user => {
    const level = user.current_level || 1
    levelCounts[level] = (levelCounts[level] || 0) + 1
  })

  return Object.entries(levelCounts)
    .map(([level, count]) => ({ level: parseInt(level), count }))
    .sort((a, b) => a.level - b.level)
}

/** Los roles que existen en `users.role`. Sirve para validar lo que llega por la URL. */
const ROLES = ['admin', 'mentor', 'instructor', 'student', 'council'] as const
type Rol = (typeof ROLES)[number]

/**
 * Obtiene lista de usuarios con paginación
 * Usa admin client para bypass RLS y obtener stats de gamificación
 */
export async function getUsers(
  page: number = 1,
  limit: number = 20,
  /** Texto libre: busca en nombre y en correo. */
  busqueda: string = '',
  /** Rol exacto, o '' para todos. */
  rol: string = ''
) {
  const admin = createAdminClient()
  const offset = (page - 1) * limit

  // email_confirmed_at llega con la migracion 105, y pedirla antes NO devuelve la
  // fila sin ese campo: devuelve 42703 y tumba la consulta entera, o sea que la
  // lista de usuarios saldria VACIA. Medido: «column users.email_confirmed_at
  // does not exist».
  //
  // Por eso la columna es opcional aqui. Si no esta, la lista se pinta igual y lo
  // unico que falta es la etiqueta «Sin confirmar». Asi da igual si se despliega
  // antes o despues de aplicar la migracion.
  const columnas = (conConfirmacion: boolean) => `
      id,
      email,
      full_name,
      role,
      is_beta,
      is_suspended,
      created_at,
      ${conConfirmacion ? 'email_confirmed_at,' : ''}
      user_gamification_stats (
        total_xp,
        current_level
      )
    `

  // El texto se ESCAPA, no se sustituye.
  //
  // Antes aqui habia `.replace(/[,()%_\\]/g, ' ')`, que cambiaba esos caracteres por
  // espacios. Para la coma y el parentesis era defendible, pero para el guion bajo
  // no: buscar «john_doe@…» se convertia en «john doe@…» y NO ENCONTRABA LA CUENTA.
  // Y los correos con guion bajo son de lo mas normal.
  //
  // Hay dos capas de escapado, y son distintas:
  //
  //   a) PostgREST. Dentro de `or(...)` la coma separa condiciones y el punto
  //      separa columna de operador. Se resuelve ENTRECOMILLANDO el valor; dentro
  //      de las comillas, `"` y `\` se escapan con `\`.
  //   b) LIKE. `%` y `_` son comodines. Se escapan con `\`, que es el caracter de
  //      escape por defecto de LIKE en Postgres. Y como ese `\` tiene que llegar
  //      entero a traves de la capa (a), va duplicado.
  //
  // Sin esto, buscar «100%» traia todo lo que empieza por 100, y «a_b» cualquier
  // «a?b».
  const patronDeBusqueda = (texto: string): string => {
    const escapado = texto
      // Primero el backslash: si no, se escaparian los que añaden los siguientes.
      .replace(/\\/g, '\\\\\\\\')
      .replace(/%/g, '\\\\%')
      .replace(/_/g, '\\\\_')
      // Y la comilla, que cerraria el valor entrecomillado de PostgREST.
      .replace(/"/g, '\\"')
    return `"%${escapado}%"`
  }

  const limpio = busqueda.trim()

  const pedir = (conConfirmacion: boolean) => {
    let q = admin.from('users').select(columnas(conConfirmacion), { count: 'exact' })

    if (limpio) {
      const patron = patronDeBusqueda(limpio)
      q = q.or(`full_name.ilike.${patron},email.ilike.${patron}`)
    }

    // El rol viene de la URL, asi que es texto de fuera: solo se acepta si es uno
    // de los roles que existen. Un `?role=cualquier-cosa` no llega a la consulta,
    // y de paso el tipo de la columna cuadra sin castear a ciegas.
    if (rol && (ROLES as readonly string[]).includes(rol)) {
      q = q.eq('role', rol as Rol)
    }

    return q.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  }

  let { data: users, error, count } = await pedir(true)

  // SE DICE SI LA COLUMNA ESTABA, y no se deja que el panel lo adivine.
  //
  // Sin la 105 la columna no existe, la consulta da 42703 y se reintenta sin ella.
  // Pero entonces `email_confirmed_at` llega `undefined` en todas las filas, y un
  // `!user.email_confirmed_at` pinta «Sin confirmar» en TODAS las cuentas —incluidas
  // las confirmadas—. Es peor que no decir nada: es decir algo falso de todo el
  // mundo. Quien pinta la etiqueta necesita saber la diferencia.
  let hayConfirmacion = true

  // Y SE REINTENTA SOLO SI EL ERROR ES 42703, la columna que no existe.
  //
  // Antes el reintento era para cualquier error, y eso convertia un fallo
  // cualquiera —la base caida, un permiso, un tiempo de espera— en «la columna no
  // esta»: la lista se pintaba sin la etiqueta y nadie se enteraba de que algo iba
  // mal. Un fallo que no es el esperado tiene que verse.
  if (error && error.code === '42703') {
    console.warn('[getUsers] Sin email_confirmed_at (42703), se reintenta sin ella:', error.message)
    hayConfirmacion = false
    ;({ data: users, error, count } = await pedir(false))
  }

  if (error) {
    console.error('Error fetching users:', error)
    return { users: [], total: 0, hayConfirmacion: false }
  }

  return {
    users: users || [],
    total: count || 0,
    /** false si la columna email_confirmed_at no existe todavia en la base. */
    hayConfirmacion
  }
}

/**
 * Cuantas cuentas hay de cada rol, EN TODA LA TABLA.
 *
 * El panel las contaba con `users.filter(u => u.role === 'admin').length` sobre
 * el resultado de getUsers, que es UNA PAGINA de 20. Con 24 cuentas, eso decia
 * «Admins 1» y «Mentores 0» porque el segundo admin y el unico mentor estaban en
 * la pagina 2. No era un recuento: era un recuento de la pagina.
 *
 * Y no cuenta a quien nunca confirmo su direccion, por lo mismo que las
 * estadisticas: una cuenta sin confirmar no es un usuario (migracion 105).
 *
 * Va con el cliente de servicio porque email_confirmed_at esta cerrada para
 * authenticated, y en PostgREST filtrar por una columna que no puedes leer
 * devuelve 42501 —con head:true, encima, el error llega vacio y el count a null—.
 */
export async function getUserRoleCounts() {
  const admin = createAdminClient()

  // `limit(0)` Y NO `head: true`, Y ES LO QUE PERMITE DISTINGUIR UN FALLO DE OTRO.
  //
  // Medido contra la base, filtrando por una columna inexistente:
  //
  //   head: true   ->  code=undefined  message=""              count=null
  //   limit(0)     ->  code="42703"    message="column ... does not exist"  count=null
  //
  // Con `head: true` el error llega SIN CODIGO y con el mensaje vacio, asi que no hay
  // forma de saber si fue la columna que falta o cualquier otra cosa. Con `limit(0)`
  // el codigo llega entero y el recuento es el mismo: 24 en los dos casos, cero filas.
  const base = () => admin.from('users').select('id', { count: 'exact' }).limit(0)

  const contar = async (filtrarConfirmadas: boolean) => {
    const q = () =>
      filtrarConfirmadas ? base().not('email_confirmed_at', 'is', null) : base()

    const [total, admins, mentores, instructores, estudiantes, sinConfirmar] = await Promise.all([
      q(),
      q().eq('role', 'admin'),
      q().eq('role', 'mentor'),
      q().eq('role', 'instructor'),
      q().eq('role', 'student'),
      filtrarConfirmadas
        ? base().is('email_confirmed_at', null)
        : Promise.resolve({ count: 0, error: null }),
    ])

    const respuestas = [total, admins, mentores, instructores, estudiantes, sinConfirmar]
    const errores = respuestas
      .map((r) => (r as { error?: { code?: string; message?: string } | null }).error)
      .filter(Boolean) as { code?: string; message?: string }[]

    const fallo = errores.length > 0 || respuestas.some((r) => r.count === null)
    // ¿Es «la columna no existe» o es otra cosa? De eso depende si se puede seguir.
    const faltaLaColumna = errores.some((e) => e.code === '42703')
    const detalle = errores[0]?.message ?? (fallo ? 'una de las consultas no devolvio recuento' : null)

    return {
      fallo,
      faltaLaColumna,
      detalle,
      cifras: {
        total: total.count ?? 0,
        admins: admins.count ?? 0,
        mentores: mentores.count ?? 0,
        instructores: instructores.count ?? 0,
        estudiantes: estudiantes.count ?? 0,
        sinConfirmar: sinConfirmar.count ?? 0,
      },
    }
  }

  // TRES DESENLACES, Y EL PANEL TIENE QUE PODER DISTINGUIRLOS.
  //
  // Si esta pagina se despliega antes de aplicar la 105, la columna no existe y las
  // seis consultas fallan con 42703. Ahi se puede seguir sin el filtro: los recuentos
  // siguen siendo los de la tabla entera —que es el fallo que esto arregla— y lo
  // unico que falta es descontar a quien no ha confirmado. Pero eso hay que DECIRLO.
  //
  // Y si el fallo es otro —la base caida, un permiso, un tiempo de espera—, no se
  // tapa con cifras que incluyen cuentas sin confirmar: se devuelve el error para que
  // la pagina lo ensene. Unas cifras calladamente distintas de lo que dicen ser son
  // peor que un aviso.
  const conFiltro = await contar(true)
  if (!conFiltro.fallo) {
    return { cifras: conFiltro.cifras, estado: 'ok' as const, detalle: null }
  }

  if (!conFiltro.faltaLaColumna) {
    console.error('[getUserRoleCounts] Las consultas de recuento fallaron:', conFiltro.detalle)
    return { cifras: null, estado: 'error' as const, detalle: conFiltro.detalle }
  }

  console.warn(
    '[getUserRoleCounts] Sin email_confirmed_at (42703, ¿falta la migración 105?). ' +
      'Se cuentan todas las cuentas, incluidas las sin confirmar.'
  )
  const sinFiltro = await contar(false)
  if (sinFiltro.fallo) {
    console.error('[getUserRoleCounts] Y tampoco sin el filtro:', sinFiltro.detalle)
    return { cifras: null, estado: 'error' as const, detalle: sinFiltro.detalle }
  }

  return { cifras: sinFiltro.cifras, estado: 'sin-columna' as const, detalle: null }
}

/**
 * Obtiene cursos más populares (por inscripciones)
 */
export async function getPopularCourses(limit: number = 5) {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      enrollments (count)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  return courses || []
}


