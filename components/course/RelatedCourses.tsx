'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CourseCard } from './CourseCard'
import PageHeader from '@/components/ui/PageHeader'
import { cx, tokens } from '@/lib/design/tokens'
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
  limit = 3,
}: RelatedCoursesProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filtrar curso actual y limitar resultados
  const filteredCourses = courses
    .filter((course) => course.id !== currentCourseId)
    .slice(0, limit)

  if (filteredCourses.length === 0) {
    return null
  }

  return (
    <section className={tokens.layout.sectionGap}>
      <PageHeader title={title} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            id={course.id}
            title={course.title}
            slug={course.slug}
            description={course.description ?? undefined}
            thumbnailUrl={course.thumbnail_url ?? undefined}
            modulesCount={course.total_modules || 0}
            lessonsCount={course.total_lessons || 0}
            isEnrolled={false}
            isCompleted={false}
            progressPercent={0}
            isComingSoon={course.total_lessons === 0}
            onView={() => router.push(`/cursos/${course.slug}`)}
            onStart={() => router.push(`/cursos/${course.slug}`)}
            onContinue={() => router.push(`/cursos/${course.slug}`)}
          />
        ))}
      </div>
    </section>
  )
}


