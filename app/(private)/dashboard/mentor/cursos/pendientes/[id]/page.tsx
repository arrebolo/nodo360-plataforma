import { createClient } from '@/lib/supabase/server'
import { requireMentor } from '@/lib/auth/requireMentor'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  BookOpen,
  Layers,
  Clock,
  Eye,
  ExternalLink,
  Play,
} from 'lucide-react'
import { sendCourseApprovedEmail } from '@/lib/email/course-approved'
import { sendCourseRejectedEmail } from '@/lib/email/course-rejected'

interface ReviewCoursePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ReviewCoursePageProps) {
  return {
    title: 'Revisar Curso | Mentor Nodo360',
  }
}

// Server Action: Aprobar curso
async function approveCourse(courseId: string) {
  'use server'

  const { userId } = await requireMentor()
  const supabase = await createClient()

  // Llamar a la función RPC submit_course_review
  const { data: result, error } = await supabase.rpc('submit_course_review', {
    p_course_id: courseId,
    p_reviewer_id: userId,
    p_decision: 'approved',
    p_feedback: null,
  })

  if (error) {
    console.error('❌ [Mentor] Error en RPC submit_course_review:', error)
    throw new Error('Error al aprobar el curso: ' + error.message)
  }

  if (!result?.success) {
    throw new Error(result?.error || 'Error al aprobar el curso')
  }

  console.log(`✅ [Mentor] Course ${courseId} approved by mentor ${userId}`)

  // Obtener datos del curso para el email
  const { data: course } = await supabase
    .from('courses')
    .select(`
      title, slug,
      users!courses_instructor_id_fkey (
        email,
        full_name
      )
    `)
    .eq('id', courseId)
    .single()

  // Enviar email al instructor (non-blocking)
  if (course?.users) {
    const instructor = course.users as any
    sendCourseApprovedEmail({
      to: instructor.email,
      instructorName: instructor.full_name || 'Instructor',
      courseName: course.title,
      courseSlug: course.slug,
    }).catch(err => console.error('Error enviando email de aprobación:', err))
  }

  revalidatePath('/dashboard/mentor/cursos/pendientes')
  revalidatePath('/admin/cursos/pendientes')
  revalidatePath('/admin/cursos')
  revalidatePath('/cursos')
  redirect('/dashboard/mentor/cursos/pendientes')
}

// Server Action: Rechazar curso
async function rejectCourse(courseId: string, formData: FormData) {
  'use server'

  const { userId } = await requireMentor()
  const supabase = await createClient()

  const reason = formData.get('reason') as string

  if (!reason || reason.trim().length < 10) {
    throw new Error('Debes proporcionar un motivo de rechazo (mínimo 10 caracteres)')
  }

  // Llamar a la función RPC submit_course_review
  const { data: result, error } = await supabase.rpc('submit_course_review', {
    p_course_id: courseId,
    p_reviewer_id: userId,
    p_decision: 'rejected',
    p_feedback: reason.trim(),
  })

  if (error) {
    console.error('❌ [Mentor] Error en RPC submit_course_review:', error)
    throw new Error('Error al rechazar el curso: ' + error.message)
  }

  if (!result?.success) {
    throw new Error(result?.error || 'Error al rechazar el curso')
  }

  console.log(`❌ [Mentor] Course ${courseId} rejected by mentor ${userId}. Reason: ${reason}`)

  // Obtener datos del curso para el email
  const { data: course } = await supabase
    .from('courses')
    .select(`
      title,
      users!courses_instructor_id_fkey (
        email,
        full_name
      )
    `)
    .eq('id', courseId)
    .single()

  // Enviar email al instructor (non-blocking)
  if (course?.users) {
    const instructor = course.users as any
    sendCourseRejectedEmail({
      to: instructor.email,
      instructorName: instructor.full_name || 'Instructor',
      courseName: course.title,
      courseId: courseId,
      rejectionReason: reason.trim(),
    }).catch(err => console.error('Error enviando email de rechazo:', err))
  }

  revalidatePath('/dashboard/mentor/cursos/pendientes')
  revalidatePath('/admin/cursos/pendientes')
  revalidatePath('/admin/cursos')
  redirect('/dashboard/mentor/cursos/pendientes')
}

export default async function MentorReviewCoursePage({ params }: ReviewCoursePageProps) {
  await requireMentor()
  const { id: courseId } = await params
  const supabase = await createClient()

  // Obtener curso
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      users!courses_instructor_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('id', courseId)
    .single()

  if (error || !course) {
    notFound()
  }

  // Verificar que está pendiente
  if (course.status !== 'pending_review') {
    redirect('/dashboard/mentor/cursos/pendientes')
  }

  // Obtener módulos con lecciones
  const { data: modules } = await supabase
    .from('modules')
    .select(`
      id,
      title,
      description,
      order_index,
      lessons (
        id,
        title,
        description,
        video_url,
        video_duration_minutes,
        order_index
      )
    `)
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  const instructor = course.users as any

  // Calcular estadísticas
  const totalModules = modules?.length || 0
  const totalLessons = modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0
  const totalDuration = modules?.reduce((acc, m) =>
    acc + (m.lessons?.reduce((lacc: number, l: any) => lacc + (l.video_duration_minutes || 0), 0) || 0), 0) || 0

  const approveAction = approveCourse.bind(null, courseId)
  const rejectAction = rejectCourse.bind(null, courseId)

  const levelLabels: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  }

  return (
    <div className="min-h-screen bg-dark p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/mentor/cursos/pendientes"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a pendientes
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{course.title}</h1>
                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">
                  Pendiente de revisión
                </span>
              </div>
              <p className="text-white/60">{course.description}</p>
            </div>

            {/* Preview button */}
            {course.slug && (
              <Link
                href={`/cursos/${course.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Vista previa
              </Link>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna principal - Contenido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info del curso */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Información del curso</h2>

              {course.thumbnail_url && (
                <div className="mb-4">
                  <Image
                    src={course.thumbnail_url}
                    alt={course.title}
                    width={400}
                    height={225}
                    className="w-full max-w-md h-auto rounded-xl object-cover"
                  />
                </div>
              )}

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-white/50">Nivel</dt>
                  <dd className="text-white mt-1">{levelLabels[course.level] || course.level}</dd>
                </div>
                <div>
                  <dt className="text-white/50">Precio</dt>
                  <dd className="text-white mt-1">
                    {course.is_free ? 'Gratis' : `${course.price || 0} EUR`}
                  </dd>
                </div>
                <div>
                  <dt className="text-white/50">Slug</dt>
                  <dd className="text-white mt-1 font-mono text-xs">{course.slug}</dd>
                </div>
                <div>
                  <dt className="text-white/50">Creado</dt>
                  <dd className="text-white mt-1">
                    {new Date(course.created_at).toLocaleDateString('es-ES')}
                  </dd>
                </div>
              </dl>

              {course.long_description && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <dt className="text-white/50 text-sm mb-2">Descripción larga</dt>
                  <dd className="text-white/80 text-sm whitespace-pre-line">
                    {course.long_description}
                  </dd>
                </div>
              )}
            </div>

            {/* Contenido del curso */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-light" />
                Contenido ({totalModules} módulos, {totalLessons} lecciones)
              </h2>

              {modules && modules.length > 0 ? (
                <div className="space-y-4">
                  {modules.map((module: any, index: number) => (
                    <div key={module.id} className="border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-6 h-6 rounded-full bg-brand-light/20 text-brand-light text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h3 className="font-medium text-white">{module.title}</h3>
                        <span className="text-xs text-white/50">
                          {module.lessons?.length || 0} lecciones
                        </span>
                      </div>

                      {module.description && (
                        <p className="text-sm text-white/60 ml-9 mb-2">{module.description}</p>
                      )}

                      {module.lessons && module.lessons.length > 0 && (
                        <ul className="ml-9 space-y-1">
                          {module.lessons
                            .sort((a: any, b: any) => a.order_index - b.order_index)
                            .map((lesson: any) => (
                              <li key={lesson.id} className="flex items-center gap-2 text-sm text-white/60">
                                {lesson.video_url ? (
                                  <Play className="w-3 h-3 text-green-400" />
                                ) : (
                                  <BookOpen className="w-3 h-3" />
                                )}
                                <span>{lesson.title}</span>
                                {lesson.video_duration_minutes && (
                                  <span className="text-white/40">
                                    ({lesson.video_duration_minutes} min)
                                  </span>
                                )}
                                {lesson.video_url && (
                                  <a
                                    href={lesson.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-brand-light hover:underline ml-auto"
                                  >
                                    Ver video
                                  </a>
                                )}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-sm">Sin contenido</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Instructor
              </h2>

              <div className="flex items-center gap-3">
                {instructor?.avatar_url ? (
                  <Image
                    src={instructor.avatar_url}
                    alt={instructor.full_name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-brand-light/20 flex items-center justify-center">
                    <span className="text-brand-light font-bold">
                      {instructor?.full_name?.[0] || '?'}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{instructor?.full_name || 'Sin nombre'}</p>
                  <p className="text-sm text-white/50">{instructor?.email}</p>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Estadísticas</h2>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-white/50">Módulos</dt>
                  <dd className="text-white font-medium">{totalModules}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Lecciones</dt>
                  <dd className="text-white font-medium">{totalLessons}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">Duración total</dt>
                  <dd className="text-white font-medium">
                    {totalDuration > 0 ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m` : 'Sin definir'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Acciones */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Tu Decisión</h2>

              {/* Aprobar */}
              <form action={approveAction}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 border border-green-500/30 text-green-400 font-semibold rounded-xl hover:bg-green-500/30 transition"
                >
                  <CheckCircle className="w-5 h-5" />
                  Aprobar y Publicar
                </button>
              </form>

              {/* Rechazar */}
              <form action={rejectAction} className="space-y-3">
                <textarea
                  name="reason"
                  placeholder="Motivo del rechazo (mínimo 10 caracteres)...&#10;Ej: El contenido necesita más profundidad en el tema X"
                  required
                  minLength={10}
                  rows={4}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition resize-none"
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-400 font-semibold rounded-xl hover:bg-red-500/30 transition"
                >
                  <XCircle className="w-5 h-5" />
                  Rechazar con Feedback
                </button>
              </form>

              <p className="text-xs text-white/40 text-center">
                Al rechazar, proporciona feedback constructivo para ayudar al instructor a mejorar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
