import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCourseProgressForUser } from '@/lib/progress/getCourseProgress'
import ModuleList from '@/components/course/ModuleList'
import EnrollButton from '@/components/course/EnrollButton'
import type { Metadata } from 'next'

// Configuración de Next.js para rutas dinámicas
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CoursePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('title, description')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!course) {
    return {
      title: 'Curso no encontrado | Nodo360',
    }
  }

  return {
    title: `${course.title} | Nodo360`,
    description: course.description || `Aprende ${course.title} con Nodo360`,
  }
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params

  console.log('🚀 [CoursePage] Renderizando curso:', slug)

  const supabase = await createClient()

  // 1. Obtener información básica del curso
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, slug, title, description, level, thumbnail_url, banner_url, is_free, is_premium')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (courseError || !course) {
    console.error('❌ [CoursePage] Curso no encontrado:', courseError)
    notFound()
  }

  console.log('✅ [CoursePage] Curso encontrado:', course.title)

  // 2. Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.log('ℹ️  [CoursePage] Usuario no autenticado')
    // Para cursos gratuitos, podemos mostrar contenido limitado
    // Para este caso, redirigimos a login
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]">
        <header className="border-b border-white/10 bg-[#1a1f2e]/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <span className="text-white font-bold text-xl">NODO360</span>
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-bold text-white mb-6">{course.title}</h1>
          <p className="text-gray-300 text-lg mb-8">{course.description}</p>
          <Link
            href={`/login?redirect=/cursos/${slug}`}
            className="inline-block px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-xl transition"
          >
            Iniciar Sesión para Ver el Curso
          </Link>
        </div>
      </div>
    )
  }

  // 3. Verificar inscripción
  const { data: enrollment } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .maybeSingle()

  const isEnrolled = !!enrollment

  console.log('📊 [CoursePage] Usuario inscrito:', isEnrolled)

  // 4. Obtener progreso completo (TODO calculado en servidor)
  const courseProgress = isEnrolled
    ? await getCourseProgressForUser(course.id, user.id)
    : {
        modules: [],
        globalProgress: { totalLessons: 0, completedLessons: 0, percentage: 0 }
      }

  // 5. Obtener primera lección del curso (para botón de inscripción)
  let firstLessonSlug: string | undefined
  if (!isEnrolled) {
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1a1f2e]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-white font-bold text-xl">NODO360</span>
            </Link>
            <Link
              href="/cursos"
              className="text-white/70 hover:text-white transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Ver todos los cursos
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#1a1f2e] to-[#252b3d] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Course Info */}
            <div>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
                <Link href="/cursos" className="hover:text-white transition">
                  Cursos
                </Link>
                <span>/</span>
                <span className="text-white/70">{course.title}</span>
              </nav>

              {/* Level & Free Badge */}
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  course.level === 'beginner'
                    ? 'bg-[#4caf50]/20 text-[#4caf50]'
                    : course.level === 'intermediate'
                    ? 'bg-[#ff6b35]/20 text-[#ff6b35]'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {course.level === 'beginner' && '🟢 Principiante'}
                  {course.level === 'intermediate' && '🟡 Intermedio'}
                  {course.level === 'advanced' && '🔴 Avanzado'}
                </span>
                {course.is_free && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#4caf50]/20 text-[#4caf50]">
                    100% GRATIS
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                {course.title}
              </h1>

              {/* Description */}
              <p className="text-xl text-white/70 mb-8">
                {course.description}
              </p>

              {/* Progress or Enroll */}
              {isEnrolled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-500">
                      ✓ Inscrito en este curso
                    </span>
                    <span className="text-gray-400">
                      {courseProgress.globalProgress.percentage}% completado
                    </span>
                  </div>

                  {/* Barra de progreso global */}
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-[#ff6b35] to-[#f7931a] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${courseProgress.globalProgress.percentage}%` }}
                    />
                  </div>

                  <p className="text-sm text-gray-400">
                    {courseProgress.globalProgress.completedLessons} de {courseProgress.globalProgress.totalLessons} lecciones completadas
                  </p>
                </div>
              ) : (
                <EnrollButton
                  courseId={course.id}
                  courseSlug={course.slug}
                  isEnrolled={false}
                  isAuthenticated={true}
                  firstLessonSlug={firstLessonSlug}
                  className="w-full"
                />
              )}
            </div>

            {/* Right: Thumbnail */}
            <div>
              <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-[#ff6b35]/20 to-[#f7931a]/20 border border-white/10">
                {course.banner_url || course.thumbnail_url ? (
                  <img
                    src={course.banner_url || course.thumbnail_url!}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-12">
                      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8">Contenido del curso</h2>

          {isEnrolled ? (
            <ModuleList
              courseSlug={course.slug}
              modules={courseProgress.modules}
            />
          ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
              <p className="text-gray-400 mb-6">Inscríbete en el curso para acceder a todo el contenido</p>
              <div className="max-w-md mx-auto">
                <EnrollButton
                  courseId={course.id}
                  courseSlug={course.slug}
                  isEnrolled={false}
                  isAuthenticated={true}
                  firstLessonSlug={firstLessonSlug}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
