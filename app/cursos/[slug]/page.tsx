import Link from 'next/link'
import { AvisoEducativo } from '@/components/legal/AvisoEducativo'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCourseProgressForUser } from '@/lib/progress/getCourseProgress'
import { hasEntitlement } from '@/lib/billing/entitlements'
import ModuleList from '@/components/course/ModuleList'
import EnrollButton from '@/components/course/EnrollButton'
import CourseHero from '@/components/course/CourseHero'
import { Footer } from '@/components/navigation/Footer'
import Button from '@/components/ui/Button'
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
      images: course.thumbnail_url ? [{ url: course.thumbnail_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Nodo360`,
      description,
      images: course.thumbnail_url ? [course.thumbnail_url] : [],
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

  // 2. Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. Si no hay usuario, mostrar vista de login
  if (!user) {
    return (
      <div className="min-h-screen bg-dark">
        <div className={cx(tokens.layout.container, tokens.layout.sectionGap)}>
          {/* Hero compacto para no autenticado */}
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 sm:p-8">
            <div className="space-y-4">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                {course.title}
              </h1>
              <p className="text-white/60 text-sm max-w-2xl">
                {course.description}
              </p>
              <div className="pt-4">
                <Button variant="primary" href={`/login?redirect=/cursos/${slug}`}>
                  Iniciar sesión para ver el curso
                  <span aria-hidden className="text-white/80">→</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // 4. Verificar entitlement para cursos premium
  const isPremium = course.is_premium === true
  const hasPremiumAccess = isPremium
    ? await hasEntitlement(user.id, course.id)
    : true // cursos no-premium no requieren entitlement

  // Quien puede gestionar el curso ve los avisos de gestión (por ejemplo, que
  // falta la imagen de portada). Un visitante no debe leerlos nunca.
  // isPreview solo cubre los cursos sin publicar; estos tres están publicados,
  // así que hace falta comprobar el rol también aquí.
  const { data: perfil } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const canManage =
    isPreview ||
    perfil?.role === 'admin' ||
    course.instructor_id === user.id

  // 5. Verificar inscripción
  const { data: enrollment } = await supabase
    .from('course_enrollments')
    .select('id, completed_at, progress_percentage')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .maybeSingle()

  const isEnrolled = !!enrollment

  // Curso ya terminado: por fecha de finalizacion o por progreso al 100 %.
  const yaCompletado =
    !!enrollment?.completed_at || (enrollment?.progress_percentage ?? 0) >= 100

  // Su certificado, para enlazarlo desde el aviso
  const { data: certificado } = yaCompletado
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
  const estadoQuiz = yaCompletado && !certificado
    ? await getCourseQuizStatus(course.id, user.id)
    : null
  const examenPendiente = !!estadoQuiz?.hasQuiz && !estadoQuiz.userPassed

  // 6. Obtener progreso completo
  const courseProgress = isEnrolled
    ? await getCourseProgressForUser(course.id, user.id)
    : {
        modules: [],
        globalProgress: { totalLessons: 0, completedLessons: 0, percentage: 0 },
      }

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
            ) : isEnrolled ? (
              <ModuleList courseSlug={course.slug} modules={courseProgress.modules} />
            ) : (
              <div className="relative overflow-hidden bg-dark-surface border border-white/10 rounded-2xl p-8 text-center">
                {/* Efecto de fondo sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-light/5 to-transparent pointer-events-none" />

                <div className="relative">
                  {/* Icono */}
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-light/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">
                    Contenido del curso
                  </h3>
                  <p className="text-white/60 mb-6 max-w-sm mx-auto">
                    Inscríbete en el curso para acceder a todo el contenido
                  </p>

                  <div className="max-w-xs mx-auto">
                    <EnrollButton
                      courseId={course.id}
                      courseSlug={course.slug}
                      courseLevel={course.level || 'beginner'}
                      isEnrolled={false}
                      isAuthenticated={true}
                      firstLessonSlug={firstLessonSlug}
                    />
                  </div>
                </div>
              </div>
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
