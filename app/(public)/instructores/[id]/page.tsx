import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  GraduationCap,
  Star,
  Users,
  BookOpen,
  Award,
  Calendar,
  ExternalLink,
} from 'lucide-react'
import SendMessageButton from '@/components/messages/SendMessageButton'
import { textoDelSello, type Sello } from '@/lib/instructor/sellos'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('instructor_profiles')
    .select('users (full_name)')
    .eq('user_id', id)
    .eq('is_active', true)
    .single()

  const user = profile?.users as unknown as { full_name: string } | null

  return {
    title: user?.full_name ? `${user.full_name} - Instructor` : 'Instructor',
    description: `Perfil del instructor ${user?.full_name || ''} en Nodo360`,
  }
}

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Obtener perfil del instructor
  const { data: profile, error } = await supabase
    .from('instructor_profiles')
    .select(`
      id,
      user_id,
      bio,
      headline,
      specialties,
      certified_paths,
      total_courses,
      total_students,
      average_rating,
      total_reviews,
      is_verified,
      accepts_messages,
      created_at,
      users (
        id,
        full_name,
        avatar_url,
        bio
      )
    `)
    .eq('user_id', id)
    .eq('is_active', true)
    .single()

  if (error || !profile) {
    notFound()
  }

  const user = profile.users as unknown as {
    id: string
    full_name: string
    avatar_url: string | null
    bio: string | null
  }

  // La biografia de USERS es la que edita la persona en /dashboard/perfil.
  // instructor_profiles.bio existe, pero esa tabla tiene UNA fila en toda la base
  // y nadie la escribe: si esta vacia, la de users es la real.
  const biografia = user.bio?.trim() || profile.bio || null

  // LOS ENLACES SALEN DE UNA VISTA, Y VAN EN SU PROPIA CONSULTA.
  //
  // La vista es `enlaces_publicos_de_instructor` (migracion 103): solo devuelve
  // filas con perfil de instructor ACTIVO. En `users` esas cuatro columnas estan
  // cerradas para anon y para authenticated, porque un GRANT de columna no
  // distingue filas: la 101 las abrio para el perfil del instructor y con ellas
  // quedaron abiertos los enlaces de cualquier cuenta no-estudiante.
  //
  // Y van aparte del embed del perfil a proposito: pedirlas dentro hacia que un
  // 42501 tumbase la consulta entera y esta pagina devolviese 404 —medido: el
  // perfil existia y respondia 404 por cuatro redes sociales—. Separadas, lo que
  // falta si algo va mal es la seccion de enlaces, no el instructor.
  const { data: enlacesDeUsuario } = await supabase
    .from('enlaces_publicos_de_instructor')
    .select('website, twitter, linkedin, github')
    .eq('user_id', id)
    .maybeSingle()

  const redes = (enlacesDeUsuario ?? null) as {
    website: string | null
    twitter: string | null
    linkedin: string | null
    github: string | null
  } | null

  // twitter admite la URL o el nombre con arroba, asi que se normaliza aqui: la
  // base no lo impone porque las dos formas son razonables de escribir.
  const urlDeX = (v: string | null) => {
    const t = v?.trim()
    if (!t) return null
    if (/^https?:\/\//i.test(t)) return t
    return `https://x.com/${t.replace(/^@/, '')}`
  }

  const enlaces = [
    { etiqueta: 'Web', url: redes?.website?.trim() || null },
    { etiqueta: 'X', url: urlDeX(redes?.twitter ?? null) },
    { etiqueta: 'LinkedIn', url: redes?.linkedin?.trim() || null },
    { etiqueta: 'GitHub', url: redes?.github?.trim() || null },
  ].filter((e) => e.url)

  // Los sellos, por la vista publica que creo la 093.
  //
  // Antes esto leia instructor_certifications directamente y pedia
  // learning_paths (id, title, slug, icon). learning_paths NO tiene `title` ni
  // `icon` —son `name` y `emoji`—, asi que la consulta fallaba y este sello no
  // se ha pintado nunca. Mismo fallo que learning_paths.title en la #231.
  //
  // Y la tabla ya no es legible: llevaba dentro el numero de colegiacion y las
  // notas del evaluador, y la leia hasta la clave anonima.
  const { data: certifications } = await supabase
    .from('sellos_de_instructor')
    .select('certification_number, especialidad, especialidad_slug, issued_at, expires_at, vigente')
    .eq('user_id', id)
    .order('issued_at', { ascending: false })

  // El tick de verificado, a partir de los sellos que ya se acaban de leer.
  // Solo los vigentes: un sello caducado no es un sello, es un sello que fue.
  const sellosVigentes = ((certifications ?? []) as Sello[]).filter((s) => s.vigente)
  const textoSello = textoDelSello(sellosVigentes)

  // Obtener cursos publicados del instructor
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      description,
      thumbnail_url,
      enrolled_count,
      level,
      total_duration_minutes
    `)
    .eq('instructor_id', id)
    .eq('status', 'published')
    .order('enrolled_count', { ascending: false })

  // Check if current user is authenticated
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const isAuthenticated = !!currentUser
  const isOwnProfile = currentUser?.id === id

  return (
    <div className="min-h-screen bg-dark">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-b from-orange-500/10 via-transparent to-transparent">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Back link */}
          <Link
            href="/instructores"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a instructores
          </Link>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {user?.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.full_name || 'Instructor'}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white/10"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center border-4 border-white/10">
                  <span className="text-5xl font-bold text-white">
                    {user?.full_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              {/*
                El tick sale de los SELLOS, no de instructor_profiles.is_verified.
                Esa columna tiene UNA fila en toda la base, con is_verified a
                true y specialties a NULL: decia «verificado» sin nada detras.
                Si no hay ninguna verificacion aprobada y viva, no se pinta nada.
              */}
              {textoSello && (
                <div
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center border-4 border-dark"
                  title={textoSello}
                >
                  <Award className="w-5 h-5 text-white" aria-hidden="true" />
                  <span className="sr-only">{textoSello}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {user?.full_name || 'Instructor'}
              </h1>
              {profile.headline && (
                <p className="text-lg text-gray-400 mb-4">{profile.headline}</p>
              )}

              {/* Rating */}
              {profile.total_reviews > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xl font-bold text-white">
                      {profile.average_rating?.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    ({profile.total_reviews} calificaciones)
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">{profile.total_courses}</span>
                  <span className="text-gray-400">cursos</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Users className="w-5 h-5 text-green-400" />
                  <span className="text-white font-medium">{profile.total_students?.toLocaleString()}</span>
                  <span className="text-gray-400">estudiantes</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">Instructor desde</span>
                  <span className="text-white font-medium">
                    {new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio: la de users, que es la que se edita en /dashboard/perfil */}
            {biografia && (
              <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Acerca de</h2>
                <p className="text-gray-400 whitespace-pre-line">{biografia}</p>
              </section>
            )}

            {/* Los enlaces que la persona ha publicado sobre si misma */}
            {enlaces.length > 0 && (
              <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Dónde encontrarle</h2>
                <ul className="flex flex-wrap gap-2">
                  {enlaces.map((e) => (
                    <li key={e.etiqueta}>
                      <a
                        href={e.url!}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-colors hover:border-white/25 hover:text-white"
                      >
                        {e.etiqueta}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Cursos */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Cursos ({courses?.length || 0})
              </h2>

              {!courses || courses.length === 0 ? (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
                  <BookOpen className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">Este instructor aun no tiene cursos publicados</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {courses.map((course: any) => (
                    <Link
                      key={course.id}
                      href={`/cursos/${course.slug}`}
                      className="group flex gap-4 rounded-2xl bg-white/5 border border-white/10 p-4 hover:border-white/20 transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-white/10">
                        {course.thumbnail_url ? (
                          <Image
                            src={course.thumbnail_url}
                            alt={course.title}
                            width={128}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-sm text-gray-400 line-clamp-1 mt-1">
                            {course.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>{course.enrolled_count?.toLocaleString() || 0} estudiantes</span>
                          </div>
                          {course.level && (
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              course.level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                              course.level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {course.level === 'beginner' ? 'Principiante' :
                               course.level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                            </span>
                          )}
                          {course.total_duration_minutes && course.total_duration_minutes > 0 && (
                            <span className="text-gray-400">
                              {Math.round(course.total_duration_minutes / 60)}h
                            </span>
                          )}
                        </div>
                      </div>

                      <ExternalLink className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Certificaciones */}
            <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-orange-400" />
                Certificaciones
              </h2>

              {!certifications || certifications.length === 0 ? (
                <p className="text-gray-500 text-sm">Sin certificaciones activas</p>
              ) : (
                <div className="space-y-3">
                  {certifications.map((cert: any) => {
                    // La vista da la especialidad, no la ruta: el eje cambio en
                    // la 092. El icono es fijo porque una especialidad no tiene
                    // emoji, y cinco de las once no tienen ruta de la que
                    // heredarlo.
                    return (
                      <div
                        key={cert.certification_number}
                        className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="w-5 h-5 text-orange-400" aria-hidden="true" />
                          <span className="font-medium text-white">{cert.especialidad}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          <p>N.° {cert.certification_number}</p>
                          <p>
                            Emitida: {new Date(cert.issued_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Especialidades */}
            {profile.specialties && profile.specialties.length > 0 && (
              <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Especialidades</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Contacto */}
            {profile.accepts_messages && !isOwnProfile && (
              <section className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-2">¿Tienes preguntas?</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Este instructor acepta mensajes de estudiantes.
                </p>
                <SendMessageButton
                  instructorId={id}
                  instructorName={user?.full_name || 'Instructor'}
                  isAuthenticated={isAuthenticated}
                />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
