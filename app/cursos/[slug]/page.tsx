import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCourseBySlug, getAllCourses } from '@/lib/db/queries'
import { LessonList } from '@/components/course'
import type { Metadata } from 'next'

interface CoursePageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const resolvedParams = await params
  const course = await getCourseBySlug(resolvedParams.slug)

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

// Commenting out generateStaticParams to make this a dynamic page
// export async function generateStaticParams() {
//   const courses = await getAllCourses()
//   return courses.map((course) => ({
//     slug: course.slug,
//   }))
// }

export default async function CoursePage({ params }: CoursePageProps) {
  const resolvedParams = await params
  console.log('🔍 Buscando curso con slug:', resolvedParams.slug)
  const course = await getCourseBySlug(resolvedParams.slug)
  console.log('📊 Curso encontrado:', course)

  if (!course) {
    notFound()
  }

  // Sort modules and lessons by order_index
  const sortedModules = course.modules?.sort((a, b) => a.order_index - b.order_index) || []
  sortedModules.forEach(module => {
    module.lessons = module.lessons?.sort((a, b) => a.order_index - b.order_index) || []
  })

  const totalLessons = sortedModules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0)
  const totalDuration = Math.round((course.total_duration_minutes || 0) / 60) // Convert to hours

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

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-2xl font-bold text-white mb-1">
                    {sortedModules.length}
                  </div>
                  <div className="text-sm text-white/50">Módulos</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-2xl font-bold text-white mb-1">
                    {totalLessons}
                  </div>
                  <div className="text-sm text-white/50">Lecciones</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="text-2xl font-bold text-white mb-1">
                    {totalDuration > 0 ? `${totalDuration}h` : '--'}
                  </div>
                  <div className="text-sm text-white/50">Duración</div>
                </div>
              </div>

              {/* CTA Button */}
              {sortedModules.length > 0 && sortedModules[0].lessons && sortedModules[0].lessons.length > 0 && (
                <Link
                  href={`/cursos/${course.slug}/${sortedModules[0].lessons[0].slug}`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#ff6b35]/20 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Comenzar curso
                </Link>
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
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8">Contenido del curso</h2>

          {/* Info Banner - Only for Premium Courses */}
          {course.is_premium && (
            <div className="bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-lg p-4 mb-6">
              <p className="text-white/90 text-sm">
                ℹ️ Las lecciones se desbloquean progresivamente. Completa cada lección para acceder a la siguiente.
                La primera lección siempre está disponible para que puedas probar el curso.
              </p>
            </div>
          )}

          <LessonList
            courseSlug={course.slug}
            modules={sortedModules}
            isPremium={course.is_premium || false}
          />
        </div>
      </section>

      {/* Instructor Section */}
      {course.instructor && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Instructor</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-2xl text-white font-bold">
                  {course.instructor.full_name?.[0] || 'I'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {course.instructor.full_name || 'Instructor'}
                  </h3>
                  {/* Bio field not available in type */}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
