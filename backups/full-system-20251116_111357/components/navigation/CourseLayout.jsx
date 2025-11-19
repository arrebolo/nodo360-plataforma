import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import CourseSidebar from '@/components/navigation/CourseSidebar'

export default function CourseLayout({ children, courseData, breadcrumbItems }) {
  return (
    <div className="min-h-screen bg-black">
      {/* Breadcrumbs */}
      <Breadcrumbs customItems={breadcrumbItems} />

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Sidebar */}
        {courseData && (
          <CourseSidebar 
            courseData={courseData}
            userProgress={{
              completedLessons: [], // Aquí irán las lecciones completadas del usuario
              currentLesson: null
            }}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
