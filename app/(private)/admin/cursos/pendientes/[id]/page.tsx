import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { estadoVisibleDelCurso } from '@/lib/cursos/estado-visible'
import { requireAdmin } from '@/lib/admin/auth'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  BookOpen,
  Layers,
  Clock,
  Eye,
} from 'lucide-react'
import { sendCourseApprovedEmail } from '@/lib/email/course-approved'
import { sendCourseChangesRequestedEmail } from '@/lib/email/course-changes-requested'
import { sendCourseRejectedEmail } from '@/lib/email/course-rejected'
import { anunciarCursoPublicado } from '@/lib/courses/anunciar-publicacion'
import { createInAppNotification, broadcastCourseChangesRequested } from '@/lib/notifications/broadcast'
import { PedirCambiosEnCurso } from '@/components/admin/PedirCambiosEnCurso'

/**
 * SIEMPRE DINAMICA.
 *
 * Esta pantalla existe para decir el estado real de los cursos, y el estado cambia por
 * caminos que no pasan por aqui: un instructor reenvia un curso a revision desde su
 * panel y esta lista se queda con el HTML de antes. Paso de verdad: un curso en
 * pending_review que aqui seguia saliendo como si nada, porque submit-review invalidaba
 * /admin/cursos/pendientes pero no /admin/cursos.
 *
 * Se arregla por los dos lados —la ruta tambien se invalida al reenviar—, pero el que
 * no depende de que nadie se acuerde es este.
 */
export const dynamic = 'force-dynamic'


interface ReviewCoursePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ReviewCoursePageProps) {
  const { id } = await params
  return {
    title: 'Revisar Curso',
  }
}

// Server Action: Aprobar curso
async function approveCourse(courseId: string, formData: FormData) {
  'use server'

  await requireAdmin()
  const supabase = await createClient()

  // «NO ANUNCIAR», como en las verificaciones.
  //
  // Sirve para dos cosas y las dos hacen falta: probar el flujo completo sin publicar
  // nada en Discord ni en Telegram, y publicar un curso sin montar un anuncio —una
  // correccion, algo que no toca pregonar—. Es una casilla: llega 'on' o nada.
  const noAnunciar = formData.get('no_anunciar') === 'on'

  // Obtener curso con info del instructor para el email y Discord
  const { data: course } = await createAdminClient()
    .from('courses')
    .select(`
      id, title, slug, description, level, thumbnail_url,
      users!courses_instructor_id_fkey (
        id,
        email,
        full_name
      )
    `)
    .eq('id', courseId)
    .single()

  // SE RECLAMA LA PRIMERA PUBLICACION, no se da por hecha.
  //
  // published_at solo se pone si estaba vacio, y solo quien consigue esa fila
  // anuncia. Asi un curso que se despublico, se edito y se vuelve a aprobar no
  // vuelve a salir en Discord ni en Telegram como si fuera nuevo, y conserva la
  // fecha de su primera publicacion —que es la que miran los triggers de la 114 y
  // la 115 para saber si alguna vez estuvo publicado—.
  const { data: reclamado, error } = await supabase
    .from('courses')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId)
    .is('published_at', null)
    .select('id')

  if (error) {
    throw new Error('Error al aprobar el curso: ' + error.message)
  }

  const esPrimeraPublicacion = (reclamado?.length ?? 0) === 1

  if (!esPrimeraPublicacion) {
    // Ya se habia publicado antes: se publica igual, pero sin tocar la fecha ni
    // anunciar nada.
    const { error: errorAlRepublicar } = await supabase
      .from('courses')
      .update({
        status: 'published',
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)

    if (errorAlRepublicar) {
      throw new Error('Error al aprobar el curso: ' + errorAlRepublicar.message)
    }
  }

  console.log(
    `✅ [Admin] Course ${courseId} approved and published` +
      (esPrimeraPublicacion ? ' (primera vez)' : ' (ya se habia publicado antes)')
  )

  // Enviar email al instructor (non-blocking)
  if (course?.users) {
    const instructor = course.users as any
    // EL RESULTADO SE MIRA, NO SOLO EL `.catch()`.
    //
    // Estos ayudantes NO LANZAN cuando Resend rechaza el envio: devuelven
    // `{ success, error }`. Asi que un `.catch()` a secas no se ejecuta nunca y un
    // correo perdido no dejaba rastro: el curso quedaba aprobado y su autor sin
    // enterarse. Sigue sin esperarse a proposito —quien aprueba no tiene que esperar
    // al correo— pero ahora el fallo se registra.
    sendCourseApprovedEmail({
      to: instructor.email,
      instructorName: instructor.full_name || 'Instructor',
      courseName: course.title,
      courseSlug: course.slug,
    })
      .then((envio) => {
        if (!envio.success) {
          console.error(`[Admin] Correo de curso aprobado NO enviado (curso ${courseId}):`, envio.error)
        }
      })
      .catch((err) => console.error('[Admin] Error enviando el correo de aprobación:', err))

    // LA NOTIFICACION EN LA PLATAFORMA, que hasta ahora no se creaba.
    // Al aprobar desde aqui el instructor recibia el correo y nada mas: si lo tenia
    // en otra bandeja, se enteraba entrando a mirar. La pantalla del mentor si la
    // creaba; esta no. Va sin bloquear, como el correo: que falle una notificacion
    // no puede dejar el curso sin publicar.
    createInAppNotification(
      instructor.id,
      'course_published',
      '\ud83c\udf89 \u00a1Tu curso ya est\u00e1 publicado!',
      `Tu curso "${course.title}" ha pasado la revisi\u00f3n y ya est\u00e1 publicado.`,
      `/cursos/${course.slug}`
    ).catch(err => console.error('Error creando notificacion de curso publicado:', err))

  }

  // EL ANUNCIO PUBLICO, SOLO LA PRIMERA VEZ. Discord llevaba su tarjeta desde
  // siempre; Telegram no llevaba nada. Van los dos, por separado, y fuera del
  // `if (course?.users)`: que no se sepa quien es el autor no es razon para no
  // anunciar el curso.
  if (esPrimeraPublicacion && !noAnunciar) {
    anunciarCursoPublicado(courseId).catch(err =>
      console.error('Error anunciando el curso publicado:', err)
    )
  } else if (noAnunciar) {
    console.log(`🔇 [Admin] «No anunciar» marcado: ${courseId} se publica sin anuncio`)
  }

  revalidatePath('/admin/cursos/pendientes')
  revalidatePath('/admin/cursos')
  revalidatePath('/cursos')
  redirect('/admin/cursos/pendientes')
}

/**
 * Lo minimo que puede medir el comentario, tras recortar espacios.
 *
 * Llega tal cual al instructor, en el correo y en la notificacion: un «000» no le
 * dice nada a nadie. El mismo numero esta en PedirCambiosEnCurso para desactivar el
 * boton, pero el que manda es este.
 */
const MINIMO_DEL_COMENTARIO = 20

// Server Action: Pedir cambios
//
// PEDIR CAMBIOS NO ES RECHAZAR. El curso vuelve al instructor en
// 'changes_requested' para que lo corrija y lo reenvie; no queda rechazado ni
// archivado. El estado ya existia en el enum y la interfaz del instructor ya lo
// entendia —la tarjeta dice «Cambios solicitados» y el boton pasa a «Editar y
// reenviar»—, pero no habia forma de ponerlo: no existia este boton.
async function requestChanges(courseId: string, formData: FormData) {
  'use server'

  await requireAdmin()
  const supabase = await createClient()

  const comment = ((formData.get('comment') as string) ?? '').trim()

  if (comment.length < MINIMO_DEL_COMENTARIO) {
    throw new Error(
      `El comentario llega tal cual al instructor: escribe al menos ${MINIMO_DEL_COMENTARIO} caracteres (van ${comment.length}).`
    )
  }

  const { data: course } = await createAdminClient()
    .from('courses')
    .select(`
      id, title,
      users!courses_instructor_id_fkey (
        id,
        email,
        full_name
      )
    `)
    .eq('id', courseId)
    .single()

  const { error } = await supabase
    .from('courses')
    .update({
      status: 'changes_requested',
      rejection_reason: comment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId)

  if (error) {
    throw new Error('Error al pedir cambios: ' + error.message)
  }

  console.log(`📝 [Admin] Course ${courseId} changes requested`)

  if (course?.users) {
    const instructor = course.users as any

    // EL RESULTADO SE MIRA, NO SOLO EL `.catch()`.
    //
    // Estos ayudantes NO LANZAN cuando Resend rechaza el envio: devuelven
    // `{ success, error }`. Asi que un `.catch()` a secas no se ejecuta nunca y un
    // correo perdido no dejaba rastro: el curso quedaba aprobado y su autor sin
    // enterarse. Sigue sin esperarse a proposito —quien aprueba no tiene que esperar
    // al correo— pero ahora el fallo se registra.
    sendCourseChangesRequestedEmail({
      to: instructor.email,
      instructorName: instructor.full_name || 'Instructor',
      courseName: course.title,
      courseId: courseId,
      mentorComments: [comment],
      revisadoPor: 'El equipo de Nodo360',
    })
      .then((envio) => {
        if (!envio.success) {
          console.error(`[Admin] Correo de cambios solicitados NO enviado (curso ${courseId}):`, envio.error)
        }
      })
      .catch((err) => console.error('[Admin] Error enviando el correo de cambios solicitados:', err))

    broadcastCourseChangesRequested(
      instructor.id,
      course.title,
      comment,
      { inApp: true, discord: false, telegram: false },
      'El equipo de Nodo360'
    ).catch(err => console.error('Error creando notificacion de cambios:', err))
  }

  revalidatePath('/admin/cursos/pendientes')
  revalidatePath('/admin/cursos')
  redirect('/admin/cursos/pendientes')
}

// Server Action: Rechazar curso
async function rejectCourse(courseId: string, formData: FormData) {
  'use server'

  await requireAdmin()
  const supabase = await createClient()

  const reason = formData.get('reason') as string

  if (!reason || reason.trim().length < 10) {
    throw new Error('Debes proporcionar un motivo de rechazo (mínimo 10 caracteres)')
  }

  // Obtener curso con info del instructor para el email
  const { data: course } = await createAdminClient()
    .from('courses')
    .select(`
      id, title,
      users!courses_instructor_id_fkey (
        email,
        full_name
      )
    `)
    .eq('id', courseId)
    .single()

  const { error } = await supabase
    .from('courses')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId)

  if (error) {
    throw new Error('Error al rechazar el curso: ' + error.message)
  }

  console.log(`❌ [Admin] Course ${courseId} rejected. Reason: ${reason}`)

  // Enviar email al instructor (non-blocking)
  if (course?.users) {
    const instructor = course.users as any
    // EL RESULTADO SE MIRA, NO SOLO EL `.catch()`.
    //
    // Estos ayudantes NO LANZAN cuando Resend rechaza el envio: devuelven
    // `{ success, error }`. Asi que un `.catch()` a secas no se ejecuta nunca y un
    // correo perdido no dejaba rastro: el curso quedaba aprobado y su autor sin
    // enterarse. Sigue sin esperarse a proposito —quien aprueba no tiene que esperar
    // al correo— pero ahora el fallo se registra.
    sendCourseRejectedEmail({
      to: instructor.email,
      instructorName: instructor.full_name || 'Instructor',
      courseName: course.title,
      courseId: courseId,
      rejectionReason: reason.trim(),
    })
      .then((envio) => {
        if (!envio.success) {
          console.error(`[Admin] Correo de rechazo NO enviado (curso ${courseId}):`, envio.error)
        }
      })
      .catch((err) => console.error('[Admin] Error enviando el correo de rechazo:', err))
  }

  revalidatePath('/admin/cursos/pendientes')
  revalidatePath('/admin/cursos')
  redirect('/admin/cursos/pendientes')
}

export default async function ReviewCoursePage({ params }: ReviewCoursePageProps) {
  await requireAdmin()
  const { id: courseId } = await params
  const supabase = await createClient()

  // Obtener curso
  const { data: course, error } = await createAdminClient()
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
  // El tipo generado de courses.status no incluye 'pending_review' aunque la
  // base lo use desde la migracion 030; con el cliente de servicio, que si va
  // tipado, la comparacion no compila. Se compara como texto hasta que se
  // regeneren los tipos.
  if ((course.status as string) !== 'pending_review') {
    redirect('/admin/cursos/pendientes')
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

  // Primera publicacion o revision de un curso ya publicado. En el segundo caso hay una
  // version viva en el catalogo que no se toca mientras se decide, y aprobar la
  // sustituye: quien revisa tiene que saberlo antes de pulsar.
  const estado = estadoVisibleDelCurso(course, { para: 'admin' })

  // Calcular estadísticas
  const totalModules = modules?.length || 0
  const totalLessons = modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0
  const totalDuration = modules?.reduce((acc, m) =>
    acc + (m.lessons?.reduce((lacc: number, l: any) => lacc + (l.video_duration_minutes || 0), 0) || 0), 0) || 0

  const approveAction = approveCourse.bind(null, courseId)
  const rejectAction = rejectCourse.bind(null, courseId)
  const requestChangesAction = requestChanges.bind(null, courseId)

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/cursos/pendientes"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a pendientes
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{course.title}</h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${estado.clases}`}>
                  <span aria-hidden="true">{estado.icono}</span>
                  {estado.etiqueta}
                </span>
              </div>
              <p className="text-white/60">{course.description}</p>
            </div>

            {/* Preview button */}
            <Link
              href={`/admin/cursos/${courseId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
            >
              <Eye className="w-4 h-4" />
              Ver detalles completos
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna principal - Contenido */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info del curso */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Información del curso</h2>

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-white/50">Nivel</dt>
                  <dd className="text-white mt-1">
                    {course.level === 'beginner' ? 'Principiante' :
                     course.level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                  </dd>
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

                      {module.lessons && module.lessons.length > 0 && (
                        <ul className="ml-9 space-y-1">
                          {module.lessons
                            .sort((a: any, b: any) => a.order_index - b.order_index)
                            .map((lesson: any) => (
                              <li key={lesson.id} className="flex items-center gap-2 text-sm text-white/60">
                                <BookOpen className="w-3 h-3" />
                                <span>{lesson.title}</span>
                                {lesson.video_duration_minutes > 0 && (
                                  <span className="text-white/40">
                                    ({lesson.video_duration_minutes} min)
                                  </span>
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
              <h2 className="text-lg font-semibold text-white mb-4">Decisión</h2>

              {estado.sigueVisible && (
                <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-200">
                  <p className="font-semibold text-orange-300">Este curso ya está publicado</p>
                  <p className="mt-1">
                    Lo que estás revisando son cambios. La versión publicada sigue visible
                    para los alumnos mientras decides, y al aprobar la sustituye. Como no
                    es su primera publicación, no se anuncia en ningún sitio.
                  </p>
                </div>
              )}

              {/* Aprobar */}
              <form action={approveAction} className="space-y-3">
                <label className="flex items-start gap-2 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    name="no_anunciar"
                    className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5"
                  />
                  <span>
                    No anunciar en Discord ni en Telegram
                    <span className="block text-xs text-white/40">
                      El curso se publica igual. Útil para probar el flujo o para una
                      corrección que no toca pregonar.
                    </span>
                  </span>
                </label>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 border border-green-500/30 text-green-400 font-semibold rounded-xl hover:bg-green-500/30 transition"
                >
                  <CheckCircle className="w-5 h-5" />
                  Aprobar y publicar
                </button>
              </form>

              {/* Pedir cambios: ni aprobado ni rechazado, vuelve al instructor */}
              <div className="border-t border-white/10 pt-4">
                <PedirCambiosEnCurso accion={requestChangesAction} />
              </div>

              {/* Rechazar */}
              <form action={rejectAction} className="space-y-3 border-t border-white/10 pt-4">
                <textarea
                  name="reason"
                  placeholder="Motivo del rechazo (mínimo 10 caracteres)..."
                  required
                  minLength={10}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/40 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition resize-none"
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-400 font-semibold rounded-xl hover:bg-red-500/30 transition"
                >
                  <XCircle className="w-5 h-5" />
                  Rechazar
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
