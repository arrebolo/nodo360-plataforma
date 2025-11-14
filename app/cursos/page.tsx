import Link from 'next/link'
import { getAllCourses } from '@/lib/db/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cursos de Bitcoin y Blockchain | Nodo360',
  description: 'Aprende Bitcoin, Blockchain y tecnologías descentralizadas con nuestros cursos gratuitos.',
}

export default async function CursosPage() {
  const courses = await getAllCourses()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1a1f2e]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-white font-bold text-xl">NODO360</span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/cursos" className="text-[#ff6b35] font-medium">
                Cursos
              </Link>
              <Link href="/recursos" className="text-white/70 hover:text-white transition">
                Recursos
              </Link>
              <Link href="/comunidad" className="text-white/70 hover:text-white transition">
                Comunidad
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Aprende Bitcoin y Blockchain
            <span className="block mt-2 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] bg-clip-text text-transparent">
              desde cero
            </span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Cursos gratuitos y en español para dominar el futuro del dinero y la tecnología descentralizada
          </p>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {courses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/50 text-lg">No hay cursos disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/cursos/${course.slug}`}
                  className="group"
                >
                  <article className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-[#ff6b35]/50 transition-all duration-300 hover:scale-105">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-[#ff6b35]/20 to-[#f7931a]/20 flex items-center justify-center">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-8">
                          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <span className="text-white/50 text-sm">Sin imagen</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Level Badge */}
                      <div className="flex items-center justify-between mb-3">
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
                            GRATIS
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#ff6b35] transition-colors">
                        {course.title}
                      </h3>

                      {/* Description */}
                      <p className="text-white/60 text-sm mb-4 line-clamp-2">
                        {course.description || 'Sin descripción'}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-white/50">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span>{course.total_modules} módulos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{course.total_lessons} lecciones</span>
                        </div>
                      </div>

                      {/* Instructor */}
                      {course.instructor && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-xs text-white font-bold">
                              {course.instructor.full_name?.[0] || 'I'}
                            </div>
                            <span className="text-xs text-white/50">
                              {course.instructor.full_name || 'Instructor'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
