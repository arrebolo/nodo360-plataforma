'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { CourseWithInstructor } from '@/types/database'
import { Footer } from '@/components/navigation/Footer'
import { PageHeader } from '@/components/ui/PageHeader'
import { BookOpen, Users, PlayCircle } from 'lucide-react'

interface CursosClientProps {
  allCourses: CourseWithInstructor[]
}

export function CursosClient({ allCourses }: CursosClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'free' | 'premium'>('all')

  // Leer query param al montar y cuando cambie
  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter === 'premium') {
      setActiveTab('premium')
    } else if (filter === 'free') {
      setActiveTab('free')
    } else {
      setActiveTab('all')
    }
  }, [searchParams])

  // Filtrar cursos segun tab activo
  const filteredCourses = allCourses.filter(course => {
    if (activeTab === 'free') return course.is_free
    if (activeTab === 'premium') return !course.is_free
    return true // 'all' muestra todos
  })

  const freeCourses = allCourses.filter(c => c.is_free)
  const premiumCourses = allCourses.filter(c => !c.is_free)

  const handleTabChange = (tab: 'all' | 'free' | 'premium') => {
    setActiveTab(tab)
    if (tab === 'all') {
      router.push('/cursos')
    } else {
      router.push(`/cursos?filter=${tab}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#070a10]">
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f7931a]/20 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-[#f7931a]" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Aprende Bitcoin y Blockchain
            <span className="block mt-2 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] bg-clip-text text-transparent">
              desde cero
            </span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Cursos gratuitos y premium en espanol para dominar el futuro del dinero y la tecnologia descentralizada
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white shadow-lg'
                  : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Todos ({allCourses.length})
            </button>
            <button
              onClick={() => handleTabChange('free')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'free'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Gratuitos ({freeCourses.length})
            </button>
            <button
              onClick={() => handleTabChange('premium')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'premium'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-lg'
                  : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Premium ({premiumCourses.length})
            </button>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-16 text-center">
              <BookOpen className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/50 text-lg">No hay cursos disponibles en esta categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/cursos/${course.slug}`}
                  className="group"
                >
                  <article className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-[#ff6b35]/10 to-[#f7931a]/10 flex items-center justify-center">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-center p-8">
                          <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center mb-4">
                            <BookOpen className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Level & Free Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          course.level === 'beginner'
                            ? 'bg-green-500/20 text-green-400'
                            : course.level === 'intermediate'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {course.level === 'beginner' && 'Principiante'}
                          {course.level === 'intermediate' && 'Intermedio'}
                          {course.level === 'advanced' && 'Avanzado'}
                        </span>
                        {course.is_free && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            GRATIS
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#f7931a] transition-colors">
                        {course.title}
                      </h3>

                      {/* Description */}
                      <p className="text-white/60 text-sm mb-4 line-clamp-2">
                        {course.description || 'Sin descripcion'}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-white/50">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{course.total_modules || 0} modulos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <PlayCircle className="w-4 h-4" />
                          <span>{course.total_lessons || 0} lecciones</span>
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

      <Footer />
    </div>
  )
}
