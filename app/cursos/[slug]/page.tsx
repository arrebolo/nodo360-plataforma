import Link from 'next/link'
import { AvisoEducativo } from '@/components/legal/AvisoEducativo'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCourseProgressForUser, getCourseSyllabus } from '@/lib/progress/getCourseProgress'
import { estadoDeLaMatricula } from '@/lib/progress/estadoMatricula'
import { hasEntitlement } from '@/lib/billing/entitlements'
import ModuleList from '@/components/course/ModuleList'
import EnrollButton from '@/components/course/EnrollButton'
import CourseHero from '@/components/course/CourseHero'
import { Footer } from '@/components/navigation/Footer'
import PageHeader from '@/components/ui/PageHeader'
import { CourseJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { resolveCourseAccess } from '@/lib/courses/access'
import { CoursePreviewBanner } from '@/components/course/CoursePreviewBanner'
import { CourseUnavailable } from '@/components/course/CourseUnavailable'
import { tokens, cx } from '@/lib/design/tokens'
import { ChevronRight, Lock } from 'lucide-react'
import type { Metadata } from 'next'
import { CourseAlreadyCompleted } from '@/components/course/CourseAlreadyCompleted'
import { getCourseQuizStatus } from '@/lib/quiz/checkCourseQuiz'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CoursePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

  const { data: course } = await supabase
    .from('courses')
    .select('title, description, thumbnail_url, level, status, instructor_id')
    .eq('slug', slug)
    .single()

  if (!course) {
    return {
      title: 'Curso no encontrado',
    }
  }

  const { canView, isPreview } = await resolveCourseAccess(course)

  // El curso existe pero esta persona no puede verlo: se le muestra la pagina
  // de "curso no disponible". Se da el titulo, nunca la descripcion.
  if (!canView) {
    return {
      title: `${course.title} | Nodo360`,
      description: 'Este curso no está disponible en este momento.',
      robots: { index: false, follow: false },
    }
  }

  // Un borrador no se indexa aunque su instructor o un admin pueda abrirlo
  if (isPreview) {
    return {
      title: `${course.title} (vista previa)`,
      robots: { index: false, follow: false },
    }
  }

  const title = course.title
  const description = course.description || `Aprende ${course.title} con Nodo360`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Nodo360`,
      description,
      url: `${baseUrl}/cursos/${slug}`,
      type: 'article',
      // Sin images: la pone app/cursos/[slug]/opengraph-image.tsx, que lleva el
      // titulo, el nivel y el numero de lecciones. La portada del curso puede ser
      // una foto remota (Unsplash), y una vista previa no deberia depender de un
      // tercero ni salir sin texto.
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Nodo360`,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/cursos/${slug}`,
    },
  }
}


export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params

  const supabase = await createClient()

  // 1. Obtener información del curso CON módulos y lecciones para conteo preciso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select(`
      id,
      slug,
      title,
      description,
      long_description,
      level,
      status,
      thumbnail_url,
      banner_url,
      is_free,
      is_premium,
      price,
      total_modules,
      total_lessons,
      total_duration_minutes,
      enrolled_count,
      instructor_id,
      instructor:users!courses_instructor_id_fkey (
        id,
        full_name,
        avatar_url,
        role
      ),
      modules (
        id,
        lessons (id)
      )
    `)
    .eq('slug', slug)
    .single()

  if (courseError || !course) {
    notFound()
  }

  // Regla unica de visibilidad: publicado -> todos; borrador -> admin e
  // instructor del curso; el resto, 404. Ver lib/courses/access.ts
  const { canView, isPreview } = await resolveCourseAccess(course)

  // El curso existe pero no es para esta persona: pagina amable en vez de 404.
  // El 404 se reserva para cursos que no existen (el notFound de arriba).
  if (!canView) {
    return (
      <CourseUnavailable
        courseId={course.id}
        courseTitle={course.title}
        status={course.status}
      />
    )
  }

  // Calcular conteos reales desde los datos (no depender de campos stored)
  const actualModulesCount = course.modules?.length || 0
  const actualLessonsCount = course.modules?.reduce(
    (acc, m) => acc + (m.lessons?.length || 0),
    0
  ) || 0

  // 2. Sesion, si la hay.
  //
  // La ficha del curso es PUBLICA: titulo, descripcion, temario y JSON-LD se
  // leen sin cuenta. Antes, quien llegaba sin sesion recibia un sucedaneo con
  // el titulo y un boton de acceso, de modo que un buscador veia una pagina
  // practicamente vacia y un visitante no podia saber que se estudia aqui.
  // Lo que sigue pidiendo cuenta es matricularse y todo lo que guarda estado.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. Verificar entitlement para cursos premium
  // Se mantiene el muro tal cual: sin sesion no hay entitlement posible, asi
  // que un curso premium sigue sin ensenar su contenido.
  const isPremium = course.is_premium === true
  const hasPremiumAccess = isPremium
    ? user
      ? await hasEntitlement(user.id, course.id)
      : false
    : true // cursos no-premium no requieren entitlement

  // Quien puede gestionar el curso ve los avisos de gestión (por ejemplo, que
  // falta la imagen de portada). Un visitante no debe leerlos nunca.
  // isPreview solo cubre los cursos sin publicar; estos tres están publicados,
  // así que hace falta comprobar el rol también aquí.
  const { data: perfil } = user
    ? await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null }

  const canManage =
    !!user &&
    (isPreview || perfil?.role === 'admin' || course.instructor_id === user.id)

  // 4. Verificar inscripción
  const { data: enrollment } = user
    ? await supabase
        .from('course_enrollments')
        .select('id, completed_at, progress_percentage')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .maybeSingle()
    : { data: null }

  const isEnrolled = !!enrollment

  // Curso ya terminado. NO se deduce de completed_at ni del porcentaje
  // guardado: los dos se quedan viejos cuando el curso crece, y la pagina
  // acababa anunciando "ya has completado este curso" encima de un 67 %.
  // Se cuenta contra las lecciones que el curso tiene hoy.
  const totalLecciones = actualLessonsCount
  const hechasDelCurso = user
    ? ((
        await supabase
          .from('user_progress')
          .select('lesson_id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .in('lesson_id', (course.modules ?? []).flatMap((m: any) => (m.lessons ?? []).map((l: any) => l.id)))
      ).count ?? 0)
    : 0

  const matricula = estadoDeLaMatricula({
    completadoEn: enrollment?.completed_at ?? null,
    leccionesTotales: totalLecciones,
    leccionesHechas: hechasDelCurso,
    matriculado: !!enrollment,
  })

  const yaCompletado = matricula.loTermino

  // Su certificado, para enlazarlo desde el aviso
  const { data: certificado } = user && yaCompletado
    ? await supabase
        .from('certificates')
        .select('id, certificate_number, issued_at')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .eq('type', 'course')
        .maybeSingle()
    : { data: null }

  // Ha terminado las lecciones y no hay certificado: puede ser que le falte el
  // examen final, que desde el 25/09/2026 es condicion para emitirlo. Hay que
  // saberlo para poder decirselo, porque un aviso que se calla se parece
  // demasiado a un fallo.
  const estadoQuiz = user && yaCompletado && !certificado
    ? await getCourseQuizStatus(course.id, user.id)
    : null
  const examenPendiente = !!estadoQuiz?.hasQuiz && !estadoQuiz.userPassed

  // 5. El temario.
  // Con matricula, con su progreso y sus candados. Sin ella -haya sesion o
  // no- el temario a secas: los titulos de las lecciones, que es justo lo que
  // alguien necesita para decidir si el curso le sirve.
  const courseProgress = user && isEnrolled
    ? await getCourseProgressForUser(course.id, user.id)
    : await getCourseSyllabus(course.id)

  // 7. Obtener primera lección del curso
  let firstLessonSlug: string | undefined
  const { data: firstModule } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', course.id)
    .order('order_index', { ascending: true })
    .limit(1)
    .single()

  if (firstModule) {
    const { data: firstLesson } = await supabase
      .from('lessons')
      .select('slug')
      .eq('module_id', firstModule.id)
      .order('order_index', { ascending: true })
      .limit(1)
      .single()

    firstLessonSlug = firstLesson?.slug
  }


  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

  return (
    <div className="min-h-screen bg-dark">
      {isPreview && <CoursePreviewBanner />}

      {/* Structured Data */}
      <CourseJsonLd
        title={course.title}
        description={course.description}
        thumbnailUrl={course.thumbnail_url}
        level={course.level || 'beginner'}
        isFree={course.is_free ?? true}
        price={course.price ?? 0}
        slug={course.slug}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', url: baseUrl },
          { name: 'Cursos', url: `${baseUrl}/cursos` },
          { name: course.title, url: `${baseUrl}/cursos/${course.slug}` },
        ]}
      />

      <div className={cx(tokens.layout.container, tokens.layout.sectionGap)}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-white/50">
          <Link href="/cursos" className="hover:text-white transition">
            Cursos
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white/70">{course.title}</span>
        </nav>

        {yaCompletado && (
          <div className="mb-6">
            <CourseAlreadyCompleted
              completedAt={enrollment?.completed_at ?? certificado?.issued_at ?? null}
              certificateId={certificado?.id ?? null}
              certificateNumber={certificado?.certificate_number ?? null}
              examenPendiente={examenPendiente}
              cursoSlug={course.slug}
              leccionesNuevas={matricula.leccionesNuevas}
            />
          </div>
        )}

        {/* HERO DEL CURSO */}
        <CourseHero
          course={{
            id: course.id,
            slug: course.slug,
            title: course.title,
            description: course.description ?? null,
            level: (course.level || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
            status: (course.status || 'published') as 'draft' | 'published' | 'archived' | 'coming_soon',
            is_free: course.is_free ?? false,
            price: course.price ?? null,
            total_modules: actualModulesCount > 0 ? actualModulesCount : null,
            total_lessons: actualLessonsCount > 0 ? actualLessonsCount : null,
            total_duration_minutes: course.total_duration_minutes ?? null,
            enrolled_count: course.enrolled_count ?? null,
            banner_url: course.banner_url ?? null,
            thumbnail_url: course.thumbnail_url ?? null,
            instructor_id: course.instructor_id ?? null,
            instructor: course.instructor as unknown as { id: string; full_name: string | null; avatar_url: string | null; role: string | null } | null,
          }}
          canManage={canManage}
          isEnrolled={isEnrolled}
          progressPct={courseProgress?.globalProgress?.percentage ?? null}
          hrefContinue={hasPremiumAccess ? `/api/continue?courseSlug=${course.slug}` : undefined}
          hrefEnroll={hasPremiumAccess ? `/api/enroll?courseId=${course.id}` : undefined}
          hrefDashboard="/dashboard"
        />

        {/* SOBRE ESTE CURSO
            La descripcion larga estaba en la base de datos y no se pintaba en
            ninguna parte. Es el texto que explica de verdad de que va el curso,
            y es lo que mas peso tiene para quien todavia esta decidiendo. */}
        {course.long_description && (
          <div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">
              Sobre este curso
            </h2>
            <p className="text-white/70 whitespace-pre-wrap leading-relaxed">
              {course.long_description}
            </p>
          </div>
        )}

        {/* CONTENIDO DEL CURSO */}
        <div className="mt-6">
          <PageHeader
            title="Contenido del curso"
            subtitle={`${actualModulesCount} módulos · ${actualLessonsCount} lecciones`}
          />

          <div className="mt-4">
            {isPremium && !hasPremiumAccess ? (
              /* Gate premium: usuario autenticado pero sin entitlement */
              <div className="relative overflow-hidden bg-dark-surface border border-amber-500/20 rounded-2xl p-8 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />

                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-amber-400" />
                  </div>

                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 mb-4">
                    Curso Premium
                  </span>

                  <h3 className="text-lg font-semibold text-white mb-2">
                    Contenido exclusivo
                  </h3>
                  <p className="text-white/60 mb-2 max-w-sm mx-auto">
                    Este curso requiere acceso premium para ver su contenido.
                  </p>
                  <p className="text-white/40 text-sm max-w-sm mx-auto">
                    Contacta al equipo de Nodo360 para obtener acceso.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* El temario se ve siempre: con o sin sesion, con o sin
                    matricula. Antes solo lo veia quien ya se habia inscrito,
                    asi que para decidir si el curso te sirve habia que
                    inscribirse primero. */}
                <ModuleList courseSlug={course.slug} modules={courseProgress.modules} />

                {!isEnrolled && (
                  <div className="mt-4 relative overflow-hidden bg-dark-surface border border-white/10 rounded-2xl p-6 sm:p-8 text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-light/5 to-transparent pointer-events-none" />

                    <div className="relative">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Las lecciones se leen sin cuenta
                      </h3>
                      <p className="text-white/60 mb-6 max-w-md mx-auto">
                        Con una cuenta gratuita se guarda tu progreso y se
                        desbloquean las notas, el examen final y el certificado
                        verificable al terminar.
                      </p>

                      <div className="max-w-xs mx-auto">
                        <EnrollButton
                          courseId={course.id}
                          courseSlug={course.slug}
                          courseLevel={course.level || 'beginner'}
                          isEnrolled={false}
                          isAuthenticated={!!user}
                          firstLessonSlug={firstLessonSlug}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <AvisoEducativo tipo="curso" />
      </div>

      <Footer />
    </div>
  )
}
