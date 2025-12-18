// app/(public)/cursos/[courseSlug]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCourseForLanding, type CourseForLanding } from '@/lib/db/courses-learning'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  isCourseDraft,
  isCoursePublished,
  isCourseComingSoon,
  isCourseArchived,
  canEnrollInCourse,
  getCourseStatusConfig,
  normalizeCourseStatus,
} from '@/lib/utils/course-status'
import { isAdmin, type PlatformRole } from '@/lib/auth/roles'

// ============================================================
// TIPOS
// ============================================================
interface PageProps {
  params: Promise<{ courseSlug: string }>
}

// ============================================================
// SEO DINÁMICO
// ============================================================
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { courseSlug } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('title, meta_title, meta_description, description, banner_url, thumbnail_url')
    .eq('slug', courseSlug)
    .single()

  if (!course) {
    return { title: 'Curso no encontrado | Nodo360' }
  }

  return {
    title: course.meta_title || `${course.title} | Nodo360`,
    description: course.meta_description || course.description || 'Curso de Web3 y Blockchain en español',
    openGraph: {
      title: course.meta_title || course.title,
      description: course.meta_description || course.description || '',
      images: course.banner_url || course.thumbnail_url ? [course.banner_url || course.thumbnail_url] : [],
    },
  }
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================
export default async function CoursePage({ params }: PageProps) {
  const { courseSlug } = await params
  const supabase = await createClient()

  // 1) Obtener usuario y su rol
  const { data: { user } } = await supabase.auth.getUser()
  let userRole: PlatformRole = 'student'

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role) {
      userRole = userData.role as PlatformRole
    }
  }

  // 2) Obtener curso con estructura completa
  const course = await getCourseForLanding(courseSlug, user?.id)

  if (!course) {
    notFound()
  }

  // 3) Verificar acceso según estado del curso
  const courseStatus = normalizeCourseStatus(course.status)
  const userIsAdmin = isAdmin(userRole)

  // Draft: solo visible para admins
  if (isCourseDraft(courseStatus) && !userIsAdmin) {
    notFound()
  }

  // Archived: mostrar mensaje especial pero permitir ver
  // (se manejará en el componente)

  // 4) Determinar si está inscrito
  const isEnrolled = !!course.userEnrollment?.is_enrolled

  // 5) Obtener certificado (si está inscrito)
  let certificate: { certificate_number: string; issued_at: string } | null = null

  if (isEnrolled && user) {
    const { data: cert } = await supabase
      .from('certificates')
      .select('certificate_number, issued_at')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle()

    if (cert) {
      certificate = cert
    }
  }

  // ============================================================
  // Calcular datos de progreso para usuarios inscritos
  // ============================================================
  let progressPercent = 0
  let completedLessons = 0
  let totalLessons = 0
  let firstIncompleteLessonSlug: string | null = null

  if (isEnrolled) {
    // Calcular desde los módulos del curso
    totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
    completedLessons = course.modules.reduce(
      (acc, m) => acc + m.lessons.filter((l) => l.status === 'completed').length,
      0
    )
    progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    // Encontrar primera lección incompleta
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (lesson.status !== 'completed') {
          firstIncompleteLessonSlug = lesson.slug
          break
        }
      }
      if (firstIncompleteLessonSlug) break
    }

    // Si todas completadas, usar la primera lección para repasar
    if (!firstIncompleteLessonSlug && course.modules[0]?.lessons[0]) {
      firstIncompleteLessonSlug = course.modules[0].lessons[0].slug
    }
  }

  const isCompleted = progressPercent === 100

  // ============================================================
  // BIFURCACIÓN: Landing vs Dashboard
  // ============================================================
  if (!isEnrolled) {
    return <CourseLandingView course={course} user={user} userRole={userRole} />
  } else {
    return (
      <CourseLandingView
        course={course}
        user={user}
        userRole={userRole}
        isEnrolled={true}
        progressPercent={progressPercent}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
        firstIncompleteLessonSlug={firstIncompleteLessonSlug}
        isCompleted={isCompleted}
        certificate={certificate}
      />
    )
  }
}

// ============================================================
// COMPONENTE: Landing Pública (y Dashboard unificado)
// ============================================================
function CourseLandingView({
  course,
  user,
  userRole,
  isEnrolled = false,
  progressPercent = 0,
  completedLessons = 0,
  totalLessons = 0,
  firstIncompleteLessonSlug = null,
  isCompleted = false,
  certificate = null,
}: {
  course: CourseForLanding
  user: any
  userRole: PlatformRole
  isEnrolled?: boolean
  progressPercent?: number
  completedLessons?: number
  totalLessons?: number
  firstIncompleteLessonSlug?: string | null
  isCompleted?: boolean
  certificate?: { certificate_number: string; issued_at: string } | null
}) {
  const levelLabels = {
    beginner: 'Nivel Básico',
    intermediate: 'Nivel Intermedio',
    advanced: 'Nivel Avanzado',
  }

  const courseStatus = normalizeCourseStatus(course.status)
  const statusConfig = getCourseStatusConfig(courseStatus)
  const userIsAdmin = isAdmin(userRole)
  const showEnrollButton = canEnrollInCourse(courseStatus) && !isEnrolled
  const isComingSoon = isCourseComingSoon(courseStatus)
  const isDraft = isCourseDraft(courseStatus)
  const isArchived = isCourseArchived(courseStatus)

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">

        {/* ========== BANNER DE ESTADO (para admins o estados especiales) ========== */}
        {(isDraft || isArchived || isComingSoon) && (
          <div className={`mb-6 rounded-xl border p-4 ${
            isDraft
              ? 'border-gray-500/30 bg-gray-500/10'
              : isArchived
              ? 'border-red-500/30 bg-red-500/10'
              : 'border-yellow-500/30 bg-yellow-500/10'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusConfig.badgeBg} ${statusConfig.badgeColor}`}>
                {statusConfig.label}
              </span>
              <span className={`text-sm ${
                isDraft ? 'text-gray-400' : isArchived ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {statusConfig.description}
              </span>
              {userIsAdmin && isDraft && (
                <Link
                  href={`/admin/cursos/${course.id}`}
                  className="ml-auto text-xs text-amber-400 hover:underline"
                >
                  Editar curso →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ========== HERO ========== */}
        <section className="mb-12 grid gap-8 md:grid-cols-[1fr_400px]">

          {/* Columna izquierda: Info */}
          <div>
            {/* Badges */}
            <div className="mb-4 flex flex-wrap gap-2">
              {/* Badge de estado si no es published */}
              {!isCoursePublished(courseStatus) && (
                <span className={`rounded-full px-3 py-1 text-xs font-medium border ${statusConfig.badgeBg} ${statusConfig.badgeColor} border-current/30`}>
                  {statusConfig.label}
                </span>
              )}
              {course.is_free && (
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/30">
                  Gratis
                </span>
              )}
              {course.is_premium && (
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/30">
                  Premium
                </span>
              )}
              {course.level && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70 border border-white/10">
                  {levelLabels[course.level] || 'Básico'}
                </span>
              )}
              {course.is_certifiable && (
                <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-medium text-sky-400 border border-sky-500/30">
                  Certificado
                </span>
              )}
            </div>

            {/* Título */}
            <h1 className="mb-3 text-3xl font-bold md:text-4xl lg:text-5xl">
              {course.title}
            </h1>

            {/* Subtítulo */}
            {course.subtitle && (
              <p className="mb-4 text-lg text-white/70 md:text-xl">
                {course.subtitle}
              </p>
            )}

            {/* Descripción corta */}
            {course.description && (
              <p className="mb-6 max-w-2xl text-white/60">
                {course.description}
              </p>
            )}

            {/* Stats */}
            <div className="mb-6 flex flex-wrap gap-4 text-sm text-white/50">
              {course.total_modules > 0 && (
                <span>{course.total_modules} módulos</span>
              )}
              {course.total_lessons > 0 && (
                <span>{course.total_lessons} lecciones</span>
              )}
              {course.duration_label && (
                <span>{course.duration_label}</span>
              )}
              {course.enrolled_count > 0 && (
                <span>{course.enrolled_count} estudiantes</span>
              )}
            </div>

            {/* ========== SECCIÓN DE PROGRESO (solo si está inscrito) ========== */}
            {isEnrolled && (
              <div className="mb-8 w-full max-w-md">
                <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
                  <span>Progreso del curso</span>
                  <span className={`font-medium ${isCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {progressPercent}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : 'bg-gradient-to-r from-amber-500 to-orange-400'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  {completedLessons} de {totalLessons} lecciones completadas
                  {isCompleted && ' ✓'}
                </p>
              </div>
            )}

            {/* ========== SECCIÓN DE CERTIFICADO (si completado) ========== */}
            {isEnrolled && isCompleted && course.is_certifiable && (
              <div className="mb-8 w-full max-w-md rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎓</span>
                  <div className="flex-1">
                    <p className="font-medium text-emerald-400">
                      {certificate ? '¡Certificado obtenido!' : '¡Curso completado!'}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {certificate
                        ? `N° ${certificate.certificate_number}`
                        : 'Certificado en proceso de generación'}
                    </p>
                  </div>
                  {certificate && (
                    <Link
                      href={`/certificados/${certificate.certificate_number}`}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-emerald-400 transition-colors"
                    >
                      Ver
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* CTA - Condicional según estado */}
            <div className="flex flex-wrap gap-4">
              {/* ========== USUARIO INSCRITO ========== */}
              {isEnrolled && firstIncompleteLessonSlug && (
                <>
                  {isCompleted ? (
                    // Curso completado - botón de repasar
                    <Link
                      href={`/cursos/${course.slug}/${firstIncompleteLessonSlug}`}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-8 py-3 font-semibold text-emerald-400 transition-all hover:-translate-y-0.5 hover:bg-emerald-500/20"
                    >
                      Repasar contenido →
                    </Link>
                  ) : (
                    // En progreso - botón de continuar
                    <Link
                      href={`/cursos/${course.slug}/${firstIncompleteLessonSlug}`}
                      className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 font-semibold text-black transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25"
                    >
                      {progressPercent > 0 ? 'Continuar curso' : 'Empezar curso'} →
                    </Link>
                  )}
                </>
              )}

              {/* ========== USUARIO NO INSCRITO - Botón de inscripción ========== */}
              {showEnrollButton && (
                <>
                  {user ? (
                    <form action="/api/enroll" method="POST">
                      <input type="hidden" name="courseId" value={course.id} />
                      <button
                        type="submit"
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 font-semibold text-black transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25"
                      >
                        {course.is_free ? 'Empezar Gratis' : `Inscribirme · ${course.price || 0}€`}
                      </button>
                    </form>
                  ) : (
                    <Link
                      href={`/login?redirect=/cursos/${course.slug}`}
                      className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 font-semibold text-black transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25"
                    >
                      Empezar Gratis
                    </Link>
                  )}
                </>
              )}

              {/* Estado: COMING_SOON - Botón de notificación */}
              {isComingSoon && (
                <button
                  disabled
                  className="rounded-xl bg-yellow-500/20 border border-yellow-500/30 px-8 py-3 font-semibold text-yellow-400 cursor-not-allowed"
                >
                  Próximamente disponible
                </button>
              )}

              {/* Estado: ARCHIVED - Botón deshabilitado */}
              {isArchived && (
                <button
                  disabled
                  className="rounded-xl bg-red-500/20 border border-red-500/30 px-8 py-3 font-semibold text-red-400 cursor-not-allowed"
                >
                  Curso archivado
                </button>
              )}

              {/* Estado: DRAFT - Botón para admins */}
              {isDraft && userIsAdmin && (
                <Link
                  href={`/admin/cursos/${course.id}`}
                  className="rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 px-8 py-3 font-semibold text-white transition-all hover:-translate-y-0.5"
                >
                  Editar borrador
                </Link>
              )}

              <a
                href="#curriculum"
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
              >
                Ver programa
              </a>
            </div>

            {/* Mensajes contextuales */}
            {!user && showEnrollButton && (
              <p className="mt-4 text-xs text-white/40">
                Necesitas crear una cuenta gratuita para guardar tu progreso.
              </p>
            )}
            {isComingSoon && (
              <p className="mt-4 text-xs text-yellow-400/60">
                Este curso estará disponible pronto. ¡Vuelve más tarde!
              </p>
            )}
            {isArchived && (
              <p className="mt-4 text-xs text-red-400/60">
                Este curso ya no acepta nuevas inscripciones.
              </p>
            )}
          </div>

          {/* Columna derecha: Card visual */}
          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white/5 p-6 backdrop-blur-sm">
              {/* Thumbnail */}
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="mb-4 aspect-video w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="mb-4 flex aspect-video w-full items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <span className="text-4xl">N</span>
                </div>
              )}

              {/* Beneficios */}
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Acceso 24/7 al contenido
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Progreso guardado automáticamente
                </li>
                {course.is_certifiable && (
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    Certificado al completar
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Quiz final por módulo
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Contenido en español
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ========== QUÉ VAS A APRENDER ========== */}
        {course.learning_objectives && course.learning_objectives.length > 0 && (
          <section className="mb-12 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <h2 className="mb-4 text-xl font-semibold md:text-2xl">
              Qué vas a aprender
            </h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {course.learning_objectives.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-white/70">
                  <span className="mt-1 text-emerald-400">●</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ========== REQUISITOS ========== */}
        {course.requirements && course.requirements.length > 0 && (
          <section className="mb-12 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <h2 className="mb-4 text-xl font-semibold md:text-2xl">
              Requisitos previos
            </h2>
            <ul className="space-y-2">
              {course.requirements.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 text-white/70">
                  <span className="text-amber-400">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ========== CURRÍCULUM ========== */}
        <section id="curriculum" className="mb-12 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <h2 className="mb-2 text-xl font-semibold md:text-2xl">
            Contenido del curso
          </h2>
          <p className="mb-6 text-sm text-white/50">
            {course.modules.length} módulos · {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lecciones
            {isEnrolled && ` · ${completedLessons} completadas`}
          </p>

          <div className="space-y-4">
            {course.modules.map((module, idx) => {
              // Calcular estado del módulo para usuarios inscritos
              const moduleLessonsCompleted = module.lessons.filter((l) => l.status === 'completed').length
              const moduleProgress = module.lessons.length > 0
                ? Math.round((moduleLessonsCompleted / module.lessons.length) * 100)
                : 0
              const moduleIsCompleted = moduleProgress === 100

              return (
                <div
                  key={module.id}
                  className={`rounded-2xl border overflow-hidden ${
                    isEnrolled && moduleIsCompleted
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : isEnrolled && moduleProgress > 0
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-white/10 bg-black/30'
                  }`}
                >
                  {/* Header del módulo */}
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="font-medium text-white">
                        {idx + 1}. {module.title}
                      </h3>
                      <p className="mt-1 text-xs text-white/50">
                        {module.lessons.length} lecciones
                        {module.hasQuiz && ' · Quiz final'}
                        {isEnrolled && moduleProgress > 0 && (
                          <span className={moduleIsCompleted ? 'text-emerald-400' : 'text-amber-400'}>
                            {' · '}{moduleProgress}%
                          </span>
                        )}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isEnrolled && moduleIsCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isEnrolled && moduleProgress > 0
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-white/30'
                    }`}>
                      {isEnrolled && moduleIsCompleted ? '✓' : isEnrolled && moduleProgress > 0 ? '▶' : '🔒'}
                    </span>
                  </div>

                  {/* Lista de lecciones (solo para usuarios inscritos) */}
                  {isEnrolled && (
                    <div className="border-t border-white/5 divide-y divide-white/5">
                      {module.lessons.map((lesson, lessonIdx) => {
                        const lessonCompleted = lesson.status === 'completed'
                        const lessonLocked = lesson.status === 'locked'

                        return (
                          <Link
                            key={lesson.id}
                            href={lessonLocked ? '#' : `/cursos/${course.slug}/${lesson.slug}`}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              lessonLocked
                                ? 'cursor-not-allowed opacity-50'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] flex-shrink-0 ${
                              lessonCompleted
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : lessonLocked
                                ? 'bg-white/10 text-white/30'
                                : 'bg-white/10 text-white/50'
                            }`}>
                              {lessonCompleted ? '✓' : lessonLocked ? '🔒' : lessonIdx + 1}
                            </span>
                            <span className={lessonCompleted ? 'text-white/70' : lessonLocked ? 'text-white/40' : 'text-white/80'}>
                              {lesson.title}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ========== DESCRIPCIÓN LARGA ========== */}
        {course.long_description && (
          <section className="mb-12 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <h2 className="mb-4 text-xl font-semibold md:text-2xl">
              Sobre este curso
            </h2>
            <p className="whitespace-pre-line text-white/70">
              {course.long_description}
            </p>
          </section>
        )}

        {/* ========== CTA FINAL PARA USUARIOS INSCRITOS ========== */}
        {isEnrolled && firstIncompleteLessonSlug && (
          <section className={`rounded-3xl border p-8 text-center ${
            isCompleted
              ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-green-500/10'
              : 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10'
          }`}>
            <h2 className="mb-2 text-2xl font-bold">
              {isCompleted ? '¡Felicidades!' : '¡Sigue aprendiendo!'}
            </h2>
            <p className="mb-6 text-white/60">
              {isCompleted
                ? 'Has completado este curso. Puedes repasar el contenido cuando quieras.'
                : `Llevas ${progressPercent}% completado. ¡Continúa donde lo dejaste!`}
            </p>
            <Link
              href={`/cursos/${course.slug}/${firstIncompleteLessonSlug}`}
              className={`inline-block rounded-xl px-10 py-4 text-lg font-semibold transition-all hover:-translate-y-0.5 ${
                isCompleted
                  ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:shadow-lg hover:shadow-amber-500/25'
              }`}
            >
              {isCompleted ? 'Repasar contenido' : progressPercent > 0 ? 'Continuar curso' : 'Empezar curso'} →
            </Link>
          </section>
        )}

        {/* ========== CTA FINAL PARA USUARIOS NO INSCRITOS ========== */}
        {showEnrollButton && (
          <section className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-8 text-center">
            <h2 className="mb-2 text-2xl font-bold">
              ¿Listo para empezar?
            </h2>
            <p className="mb-6 text-white/60">
              Únete a {course.enrolled_count || 0}+ estudiantes que ya están aprendiendo
            </p>

            {user ? (
              <form action="/api/enroll" method="POST" className="inline-block">
                <input type="hidden" name="courseId" value={course.id} />
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-10 py-4 text-lg font-semibold text-black transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25"
                >
                  {course.is_free ? 'Empezar Curso Gratis' : `Inscribirme · ${course.price || 0}€`}
                </button>
              </form>
            ) : (
              <Link
                href={`/login?redirect=/cursos/${course.slug}`}
                className="inline-block rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-10 py-4 text-lg font-semibold text-black transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/25"
              >
                Crear Cuenta y Empezar
              </Link>
            )}
          </section>
        )}

        {/* CTA para Coming Soon */}
        {isComingSoon && (
          <section className="rounded-3xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 p-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-yellow-400">
              Próximamente
            </h2>
            <p className="mb-6 text-white/60">
              Este curso estará disponible pronto. ¡Mantente atento!
            </p>
            <button
              disabled
              className="rounded-xl bg-yellow-500/20 border border-yellow-500/30 px-10 py-4 text-lg font-semibold text-yellow-400 cursor-not-allowed"
            >
              Disponible pronto
            </button>
          </section>
        )}

        {/* CTA para Archived */}
        {isArchived && (
          <section className="rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-500/10 to-orange-500/10 p-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-red-400">
              Curso archivado
            </h2>
            <p className="mb-6 text-white/60">
              Este curso ya no está disponible para nuevas inscripciones.
            </p>
            <Link
              href="/cursos"
              className="inline-block rounded-xl bg-white/10 border border-white/20 px-10 py-4 text-lg font-semibold text-white transition-all hover:bg-white/20"
            >
              Ver otros cursos
            </Link>
          </section>
        )}

      </div>
    </div>
  )
}

