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

  // El texto se escapa antes de entrar en un `or`.
  //
  // En PostgREST la coma separa condiciones y el punto separa columna de
  // operador, asi que un correo con coma —o un parentesis— partiria el filtro en
  // dos condiciones invalidas. Tambien fuera % y _, que son comodines de LIKE:
  // buscar «100%» debe buscar eso, no «todo lo que empiece por 100».
  const limpio = busqueda.trim().replace(/[,()%_\\]/g, ' ').trim()

  const pedir = (conConfirmacion: boolean) => {
    let q = admin.from('users').select(columnas(conConfirmacion), { count: 'exact' })

    if (limpio) {
      q = q.or(`full_name.ilike.%${limpio}%,email.ilike.%${limpio}%`)
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

  if (error) {
    // Sin la 105 la columna no existe y esto es 42703. Se repite sin ella para que
    // la lista se pinte igual.
    console.warn('[getUsers] Reintento sin email_confirmed_at:', error.message || error.code)
    ;({ data: users, error, count } = await pedir(false))
  }

  if (error) {
    console.error('Error fetching users:', error)
    return { users: [], total: 0 }
  }

  return {
    users: users || [],
    total: count || 0
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

  const base = () => admin.from('users').select('id', { count: 'exact', head: true })

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

    const fallo = [total, admins, mentores, instructores, estudiantes, sinConfirmar].some(
      (r) => r.error || r.count === null
    )

    return {
      fallo,
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

  // PRIMERO CON EL FILTRO, Y SI NO SE PUEDE, SIN EL.
  //
  // No es defensa por si acaso: medido. Si esta pagina se despliega antes de
  // aplicar la 105, la columna no existe, las seis consultas fallan y las seis
  // tarjetas se quedarian a CERO —peor que los numeros equivocados que arreglan—.
  // Y el fallo no se ve: con `head: true` PostgREST devuelve el error con el
  // mensaje vacio y el count a null, sin codigo.
  //
  // Sin el filtro los recuentos siguen siendo los de la tabla entera, que es el
  // fallo que habia que arreglar; lo unico que falta es descontar a quien no ha
  // confirmado. Se avisa por consola y se sigue.
  const conFiltro = await contar(true)
  if (!conFiltro.fallo) return conFiltro.cifras

  console.warn(
    '[getUserRoleCounts] No se pudo filtrar por email_confirmed_at (¿falta la migración 105?). ' +
      'Se cuentan todas las cuentas, incluidas las sin confirmar.'
  )
  const sinFiltro = await contar(false)
  return sinFiltro.cifras
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


