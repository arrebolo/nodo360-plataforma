import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { GraduationCap, Star, Users, BookOpen, Award, Search } from 'lucide-react'

export const metadata = {
  title: 'Instructores | Nodo360',
  description: 'Conoce a los instructores certificados de Nodo360',
}

export default async function InstructoresPage({
  searchParams,
}: {
  searchParams: Promise<{ ruta?: string; orden?: string }>
}) {
  const { ruta, orden = 'rating' } = await searchParams
  const supabase = await createClient()

  // Obtener rutas de aprendizaje para el filtro
  const { data: learningPaths } = await supabase
    .from('learning_paths')
    .select('id, title, slug, icon')
    .eq('is_active', true)
    .order('title')

  // Construir query de instructores
  let query = supabase
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
      created_at,
      users (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('is_active', true)

  // Filtrar por ruta si está seleccionada
  if (ruta) {
    const selectedPath = learningPaths?.find(p => p.slug === ruta)
    if (selectedPath) {
      query = query.contains('certified_paths', [selectedPath.id])
    }
  }

  // Ordenar
  switch (orden) {
    case 'estudiantes':
      query = query.order('total_students', { ascending: false })
      break
    case 'reciente':
      query = query.order('created_at', { ascending: false })
      break
    case 'rating':
    default:
      query = query.order('average_rating', { ascending: false })
      break
  }

  const { data: instructors } = await query

  // Obtener certificaciones activas para mostrar badges
  const { data: certifications } = await supabase
    .from('instructor_certifications')
    .select(`
      user_id,
      learning_path_id,
      learning_paths (
        id,
        title,
        icon
      )
    `)
    .eq('status', 'active')

  // Crear mapa de certificaciones por usuario
  const certMap = new Map<string, Array<{ id: string; title: string; icon: string }>>()
  certifications?.forEach((cert: any) => {
    if (!certMap.has(cert.user_id)) {
      certMap.set(cert.user_id, [])
    }
    if (cert.learning_paths) {
      const lp = cert.learning_paths as { id: string; title: string; icon: string }
      certMap.get(cert.user_id)!.push({
        id: lp.id,
        title: lp.title,
        icon: lp.icon,
      })
    }
  })

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <div className="bg-gradient-to-b from-orange-500/10 via-transparent to-transparent py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <GraduationCap className="w-8 h-8 text-orange-400" />
            </div>
            <h1 className="text-4xl font-bold text-white">Instructores</h1>
          </div>
          <p className="text-xl text-white/70 max-w-2xl">
            Aprende de los mejores. Nuestros instructores certificados comparten su conocimiento y experiencia.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Filtro por ruta */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Ruta:</label>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/instructores"
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  !ruta
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                Todas
              </Link>
              {learningPaths?.map((path) => (
                <Link
                  key={path.id}
                  href={`/instructores?ruta=${path.slug}${orden !== 'rating' ? `&orden=${orden}` : ''}`}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    ruta === path.slug
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {path.icon} {path.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Ordenar */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-gray-400">Ordenar:</label>
            <div className="flex gap-2">
              <Link
                href={`/instructores${ruta ? `?ruta=${ruta}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  orden === 'rating'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                Calificacion
              </Link>
              <Link
                href={`/instructores?orden=estudiantes${ruta ? `&ruta=${ruta}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  orden === 'estudiantes'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                Estudiantes
              </Link>
              <Link
                href={`/instructores?orden=reciente${ruta ? `&ruta=${ruta}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  orden === 'reciente'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                }`}
              >
                Reciente
              </Link>
            </div>
          </div>
        </div>

        {/* Grid de instructores */}
        {!instructors || instructors.length === 0 ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
            <Search className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 font-medium">No se encontraron instructores</p>
            <p className="text-sm text-gray-500 mt-1">
              {ruta ? 'Prueba quitando el filtro de ruta' : 'Aun no hay instructores certificados'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {instructors.map((instructor: any) => {
              const user = instructor.users
              const certs = certMap.get(instructor.user_id) || []

              return (
                <Link
                  key={instructor.id}
                  href={`/instructores/${instructor.user_id}`}
                  className="group rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-orange-500/30 hover:bg-white/[0.07] transition-all"
                >
                  {/* Header con avatar */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      {user?.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.full_name || 'Instructor'}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {user?.full_name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      {instructor.is_verified && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-dark">
                          <Award className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
                        {user?.full_name || 'Instructor'}
                      </h3>
                      {instructor.headline && (
                        <p className="text-sm text-gray-400 truncate">{instructor.headline}</p>
                      )}
                      {/* Rating */}
                      {instructor.total_reviews > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium text-white">
                            {instructor.average_rating?.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({instructor.total_reviews} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges de certificaciones */}
                  {certs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {certs.map((cert) => (
                        <span
                          key={cert.id}
                          className="px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400"
                          title={cert.title}
                        >
                          {cert.icon}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{instructor.total_courses} cursos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{instructor.total_students?.toLocaleString()} estudiantes</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
