'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { CourseGrid } from '@/components/course/CourseGrid'
import { Button } from '@/components/ui/Button'
import { getAllCourses } from '@/lib/db/courses-queries-client'
import { getCourseProgress } from '@/lib/utils/progress'
import type { CourseWithInstructor } from '@/types/database'
import Link from 'next/link'

type FilterType = 'all' | 'free' | 'premium' | 'in-progress'

export default function CursosPage() {
  const [courses, setCourses] = useState<CourseWithInstructor[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const data = await getAllCourses()
      setCourses(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressForCourse = (courseId: string) => {
    return { completed: 0, total: 10, percentage: 0 }
  }

  const filteredCourses = courses.filter((course) => {
    if (filter === 'all') return true
    if (filter === 'free') return course.is_free
    if (filter === 'premium') return !course.is_free
    if (filter === 'in-progress') {
      const progress = getProgressForCourse(course.id)
      return progress.percentage > 0 && progress.percentage < 100
    }
    return true
  })

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#F7931A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Cargando cursos...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="py-16 px-6 border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7931A]/10 border border-[#F7931A]/20 rounded-full text-[#F7931A] text-sm font-medium mb-6">
              <span>🎓</span>
              <span>Educación Bitcoin de calidad</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Aprende Bitcoin desde cero{' '}
              <span className="bg-gradient-to-r from-[#F7931A] to-[#FDB931] bg-clip-text text-transparent">
                hasta desarrollo blockchain
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Cursos gratuitos y premium en español para dominar el futuro del dinero
            </p>
            <Button variant="primary" size="lg">
              🚀 Comenzar ahora
            </Button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 px-6 border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { value: 'all' as FilterType, label: 'Todos', icon: '📚' },
              { value: 'free' as FilterType, label: 'Gratis', icon: '🆓' },
              { value: 'premium' as FilterType, label: 'Premium', icon: '🔒' },
              { value: 'in-progress' as FilterType, label: 'En Progreso', icon: '⏳' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  filter === f.value
                    ? 'bg-[#F7931A]/10 border border-[#F7931A] text-[#F7931A]'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] border border-[#2a2a2a]'
                }`}
              >
                <span className="mr-2">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                <span className="text-4xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                No hay cursos en esta categoría
              </h3>
              <p className="text-gray-400 mb-6">
                Prueba con otro filtro para ver más cursos
              </p>
              <Button variant="outline" onClick={() => setFilter('all')}>
                Ver todos los cursos
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-400">
                  Mostrando {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''}
                </p>
              </div>
              <CourseGrid courses={filteredCourses} getProgress={getProgressForCourse} />
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-[#2a2a2a]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#F7931A]/10 via-[#0a0a0a] to-[#FDB931]/10 rounded-2xl border border-[#F7931A]/20 p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              ¿Necesitas ayuda personalizada?
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Únete a nuestra comunidad y aprende junto a otros estudiantes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => (window.location.href = '/comunidad')}
              >
                💬 Ir a la comunidad
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => (window.location.href = '/mentoria')}
              >
                🎯 Mentoría 1-on-1
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
