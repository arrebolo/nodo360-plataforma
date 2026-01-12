'use client'

import { useRouter } from 'next/navigation'
import { CourseCard } from './CourseCard'
import { Card } from '@/components/ui/Card'
import { BookOpen } from 'lucide-react'
import type { CourseWithInstructor } from '@/types/database'

interface CourseGridProps {
  courses: CourseWithInstructor[]
  getProgress?: (courseId: string) => {
    completed: number
    total: number
    percentage: number
    isCompleted?: boolean
  }
}

export function CourseGrid({ courses, getProgress }: CourseGridProps) {
  const router = useRouter()

  if (courses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <BookOpen className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
        <p className="text-neutral-500">No se encontraron cursos</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        const progress = getProgress ? getProgress(course.id) : undefined
        const isEnrolled = !!progress && progress.percentage > 0
        const isCompleted = !!progress?.isCompleted || (progress?.percentage === 100)

        return (
          <CourseCard
            key={course.id}
            id={course.id}
            title={course.title}
            slug={course.slug}
            description={course.description ?? undefined}
            thumbnailUrl={course.thumbnail_url ?? undefined}
            modulesCount={course.total_modules || 0}
            lessonsCount={course.total_lessons || 0}
            isEnrolled={isEnrolled}
            isCompleted={isCompleted}
            progressPercent={progress?.percentage || 0}
            isComingSoon={course.total_lessons === 0}
            onView={() => router.push(`/cursos/${course.slug}`)}
            onStart={() => router.push(`/cursos/${course.slug}`)}
            onContinue={() => router.push(`/cursos/${course.slug}`)}
          />
        )
      })}
    </div>
  )
}


