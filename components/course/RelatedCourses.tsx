'use client'

import { useState, useEffect } from 'react'
import { CourseCard } from './CourseCard'
import { getCourseProgress } from '@/lib/utils/progress'
import type { CourseWithInstructor } from '@/types/database'

interface RelatedCoursesProps {
  courses: CourseWithInstructor[]
  currentCourseId?: string
  title?: string
  limit?: number
}

export function RelatedCourses({
  courses,
  currentCourseId,
  title = 'Cursos Relacionados',
  limit = 3
}: RelatedCoursesProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filtrar curso actual y limitar resultados
  const filteredCourses = courses
    .filter(course => course.id !== currentCourseId)
    .slice(0, limit)

  if (filteredCourses.length === 0) {
    return null
  }

  const getProgressForCourse = (courseId: string) => {
    if (!mounted || typeof window === 'undefined') {
      return { completed: 0, total: 0, percentage: 0, isCompleted: false }
    }

    // Aquí deberíamos obtener las lecciones del curso para calcular el progreso correcto
    // Por ahora retornamos progreso básico
    return { completed: 0, total: 10, percentage: 0, isCompleted: false }
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-white mb-8">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={getProgressForCourse(course.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
