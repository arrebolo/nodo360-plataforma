'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { CourseGrid } from '@/components/course/CourseGrid'
import { Button } from '@/components/ui/Button'
import { getAllCourses } from '@/lib/db/courses-queries-client'
import { getCourseProgress } from '@/lib/utils/progress'
import type { CourseWithInstructor } from '@/types/database'

export default function HomePage() {
  const [courses, setCourses] = useState<CourseWithInstructor[]>([])
  const [loading, setLoading] = useState(true)

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

  const freeCourses = courses.filter(c => c.is_free)

  const getProgressForCourse = (courseId: string) => {
    return { completed: 0, total: 10, percentage: 0, isCompleted: false }
  }

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
      <section className="py-24 px-6 border-b border-[#2a2a2a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7931A]/10 border border-[#F7931A]/20 rounded-full text-[#F7931A] text-sm font-medium mb-6">
              <span>🎓</span>
              <span>Aprende Bitcoin y Blockchain</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              Cursos{' '}
              <span className="bg-gradient-to-r from-[#F7931A] to-[#FDB931] bg-clip-text text-transparent">
                Gratuitos
              </span>
            </h1>
            <p className="text-2xl text-gray-400 mb-10 leading-relaxed">
              Aprende los fundamentos de Bitcoin y Blockchain desde cero, sin costo alguno
            </p>
          </div>
        </div>
      </section>

      {/* Free Courses Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {freeCourses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No hay cursos disponibles</p>
            </div>
          ) : (
            <CourseGrid courses={freeCourses} getProgress={getProgressForCourse} />
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 border-t border-[#2a2a2a]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-[#F7931A]/10 via-[#0a0a0a] to-[#FDB931]/10 rounded-2xl border border-[#F7931A]/20 p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              ¿Listo para Empezar?
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Explora todos nuestros cursos y comienza tu viaje en Bitcoin
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => (window.location.href = '/cursos')}
            >
              Ver Todos los Cursos Gratis
            </Button>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
