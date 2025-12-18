// app/admin/cursos/[id]/page.tsx
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  CourseForm,
  type CourseFormValues,
  type LearningPathSummary,
} from '@/components/admin/CourseForm'

export const metadata: Metadata = {
  title: 'Editar Curso | Admin Nodo360',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminCourseEditPage({ params }: PageProps) {
  console.log('[AdminCourseEditPage] Iniciando...')

  const resolvedParams = await params
  const { id } = resolvedParams

  // Validar formato UUID antes de consultar Supabase
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    console.error('[AdminCourseEditPage] ID invalido (no es UUID):', id)
    notFound()
  }

  const supabase = await createClient()

  // Verificar autenticacion
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('[AdminCourseEditPage] Usuario no autenticado')
    redirect('/login')
  }

  // Verificar rol admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    console.error('[AdminCourseEditPage] Usuario no es admin')
    redirect('/')
  }

  console.log('[AdminCourseEditPage] Cargando curso:', id)

  // 1) CARGAR CURSO
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      subtitle,
      description,
      duration_label,
      is_premium,
      is_certifiable,
      published_at,
      difficulty_level,
      topic_category
    `)
    .eq('id', id)
    .maybeSingle()

  if (courseError || !course) {
    console.error('[AdminCourseEditPage] Error cargando curso:', courseError?.message)
    notFound()
  }

  console.log('[AdminCourseEditPage] Curso cargado:', course.title)

  // 2) CARGAR RUTAS DISPONIBLES (para el selector)
  const { data: paths, error: pathsError } = await supabase
    .from('learning_paths')
    .select('id, slug, name, is_active, position')
    .order('position', { ascending: true })

  if (pathsError) {
    console.error('[AdminCourseEditPage] Error cargando rutas:', pathsError.message)
  }

  // 3) CARGAR path_courses DEL CURSO (solo path_id, SIN JOIN)
  const { data: pathCourseRows, error: pcError } = await supabase
    .from('path_courses')
    .select('path_id')
    .eq('course_id', id)

  if (pcError) {
    console.error('[AdminCourseEditPage] Error cargando path_courses:', pcError.message)
  }

  // Extraer IDs de rutas
  const pathIds = (pathCourseRows ?? [])
    .map((row) => row.path_id as string)
    .filter(Boolean)

  // 4) CARGAR DATOS DE LAS RUTAS ASIGNADAS (query separada)
  let assignedPaths: LearningPathSummary[] = []

  if (pathIds.length > 0) {
    const { data: pathsData, error: lpError } = await supabase
      .from('learning_paths')
      .select('id, slug, name, is_active')
      .in('id', pathIds)

    if (lpError) {
      console.error('[AdminCourseEditPage] Error cargando rutas asignadas:', lpError.message)
    } else {
      // Quitar duplicados por seguridad
      const unique = new Map<string, LearningPathSummary>()
      for (const p of pathsData ?? []) {
        unique.set(p.id, p as LearningPathSummary)
      }
      assignedPaths = Array.from(unique.values())
    }
  }

  console.log('[AdminCourseEditPage] Rutas asignadas:', assignedPaths.length)

  // 5) OBTENER path_id PRINCIPAL (primera relacion)
  const primaryPathId = pathIds.length > 0 ? pathIds[0] : null

  // 6) CARGAR MODULOS DEL CURSO
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, title, order_index')
    .eq('course_id', id)
    .order('order_index', { ascending: true })

  if (modulesError) {
    console.error('[AdminCourseEditPage] Error cargando modulos:', modulesError)
  }

  // 7) CARGAR LECCIONES DEL CURSO (a traves de los modulos)
  const moduleIds = (modules ?? []).map(m => m.id)
  let lessons: {
    id: string
    title: string
    slug: string
    order_index: number
    video_duration_minutes: number | null
    video_url: string | null
    slides_url: string | null
    resources_url: string | null
    module_id: string
  }[] = []

  if (moduleIds.length > 0) {
    const { data: lessonsData, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title, slug, order_index, video_duration_minutes, video_url, slides_url, resources_url, module_id')
      .in('module_id', moduleIds)
      .order('order_index', { ascending: true })

    if (lessonsError) {
      console.error('[AdminCourseEditPage] Error cargando lecciones:', lessonsError)
    } else {
      lessons = lessonsData ?? []
    }
  }

  console.log('[AdminCourseEditPage] Modulos:', modules?.length ?? 0, 'Lecciones:', lessons.length)

  // Preparar datos iniciales
  const initialData: CourseFormValues = {
    id: course.id,
    title: course.title ?? '',
    slug: course.slug ?? '',
    subtitle: course.subtitle ?? '',
    description: course.description ?? '',
    duration_label: course.duration_label ?? '',
    is_premium: course.is_premium ?? false,
    is_certifiable: course.is_certifiable ?? false,
    published_at: course.published_at ?? null,
    difficulty_level: course.difficulty_level ?? '',
    topic_category: course.topic_category ?? '',
    path_id: primaryPathId,
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header con enlace a vista pública */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/cursos"
            className="text-[13px] text-[#5A9FD4] hover:text-[#7AB8E8] transition-colors"
          >
            ← Volver al listado
          </Link>
        </div>
        <Link
          href={`/cursos/${course.slug}`}
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-400 hover:bg-amber-500/20 transition-all"
        >
          Ver curso público
          <span>↗</span>
        </Link>
      </div>

      <CourseForm
        mode="edit"
        initialData={initialData}
        paths={paths ?? []}
        assignedPaths={assignedPaths}
      />

      {/* ===== ESTRUCTURA DEL CURSO ===== */}
      <section className="bg-[rgba(38,36,33,0.96)] border border-[rgba(250,244,237,0.12)] rounded-[18px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-semibold text-[#FAF4ED] flex items-center gap-2">
            <span>📚</span> Estructura del Curso
          </h2>
          <Link
            href={`/admin/cursos/${course.id}/modulos`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all hover:-translate-y-0.5"
          >
            Gestionar Módulos
            <span>→</span>
          </Link>
        </div>

        {/* Estadísticas */}
        <div className="rounded-xl border border-[rgba(250,244,237,0.1)] bg-[#1F1E1B]/50 p-4 mb-4">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{modules?.length ?? 0}</p>
              <p className="text-[12px] text-[#6F665C]">Módulos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{lessons.length}</p>
              <p className="text-[12px] text-[#6F665C]">Lecciones</p>
            </div>
          </div>
        </div>

        {/* Aviso si no hay módulos */}
        {(!modules || modules.length === 0) && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
            <p className="text-sm text-amber-400">
              ⚠️ Este curso no tiene módulos. Los alumnos no verán contenido hasta que añadas módulos y lecciones.
            </p>
            <Link
              href={`/admin/cursos/${course.id}/modulos/nuevo`}
              className="inline-flex items-center gap-1 mt-2 text-sm text-amber-300 hover:text-amber-200 underline"
            >
              Crear primer módulo →
            </Link>
          </div>
        )}

        {modules && modules.length > 0 ? (
          <div className="space-y-6">
            {modules.map((mod) => {
              const moduleLessons = lessons.filter((l) => l.module_id === mod.id)

              return (
                <div key={mod.id} className="space-y-3">
                  {/* Header del modulo */}
                  <div className="flex items-center gap-3 border-b border-[rgba(250,244,237,0.1)] pb-2">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/30 text-[11px] font-bold text-[#F7931A]">
                      {mod.order_index}
                    </span>
                    <h3 className="text-[15px] font-medium text-[#FAF4ED]">
                      {mod.title}
                    </h3>
                    <span className="text-[11px] text-[#6F665C]">
                      ({moduleLessons.length} lecciones)
                    </span>
                  </div>

                  {/* Lista de lecciones */}
                  {moduleLessons.length > 0 ? (
                    <div className="pl-10 space-y-2">
                      {moduleLessons.map((lesson, idx) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#2C2A28]/50 hover:bg-[#2C2A28] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-[11px] text-[#6F665C] w-5 text-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[13px] text-[#FAF4ED] truncate">
                                {lesson.title}
                              </p>
                              <p className="text-[10px] text-[#6F665C] font-mono truncate">
                                /{lesson.slug}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Indicadores de contenido */}
                            {lesson.video_url && (
                              <span className="text-[9px] rounded-full bg-[#4CAF7A]/15 px-1.5 py-0.5 text-[#4CAF7A] border border-[#4CAF7A]/40">
                                video
                              </span>
                            )}
                            {lesson.slides_url && (
                              <span className="text-[9px] rounded-full bg-[#F7931A]/15 px-1.5 py-0.5 text-[#F7931A] border border-[#F7931A]/40">
                                slides
                              </span>
                            )}
                            {lesson.resources_url && (
                              <span className="text-[9px] rounded-full bg-[#5A9FD4]/15 px-1.5 py-0.5 text-[#5A9FD4] border border-[#5A9FD4]/40">
                                recursos
                              </span>
                            )}

                            {/* Duracion */}
                            {lesson.video_duration_minutes && (
                              <span className="text-[10px] text-[#6F665C]">
                                {lesson.video_duration_minutes}min
                              </span>
                            )}

                            {/* Enlace a edicion */}
                            <a
                              href={`/admin/lecciones/${lesson.id}`}
                              className="text-[11px] text-[#5A9FD4] hover:text-[#7AB8E8] hover:underline ml-2"
                            >
                              Editar →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="pl-10 text-[12px] text-[#6F665C] italic">
                      Este modulo no tiene lecciones
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[14px] text-[#6F665C]">
              Este curso todavia no tiene modulos.
            </p>
            <p className="text-[12px] text-[#6F665C] mt-1">
              Puedes crearlos desde Supabase o implementar un panel de modulos.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
