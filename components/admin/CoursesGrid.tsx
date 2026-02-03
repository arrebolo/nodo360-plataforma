'use client'

import CourseAdminCard from './CourseAdminCard'
import { CourseOutlineModal, useCourseOutline } from './CourseOutlineModal'

interface CoursesGridProps {
  courses: any[]
  returnTo: string
}

export default function CoursesGrid({ courses, returnTo }: CoursesGridProps) {
  const { isOpen, courseId, openOutline, closeOutline } = useCourseOutline()

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course: any) => (
          <CourseAdminCard
            key={course.id}
            course={course}
            returnTo={returnTo}
            onViewOutline={openOutline}
          />
        ))}
      </div>

      {courseId && (
        <CourseOutlineModal
          courseId={courseId}
          isOpen={isOpen}
          onClose={closeOutline}
        />
      )}
    </>
  )
}
