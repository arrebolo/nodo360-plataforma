import { CourseCard } from './CourseCard'
import type { CourseWithInstructor } from '@/types/database'

interface CourseGridProps {
  courses: CourseWithInstructor[]
  getProgress?: (courseId: string) => {
    completed: number
    total: number
    percentage: number
  }
}

export function CourseGrid({ courses, getProgress }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1a1a1a] flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <p className="text-white/50 text-lg">No se encontraron cursos</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          progress={getProgress ? getProgress(course.id) : undefined}
        />
      ))}
    </div>
  )
}
