import { requireInstructorLike } from '@/lib/auth/requireInstructor'
import { CourseFormCore } from '@/components/courses'
import { createCourse } from '@/lib/courses/course-actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Crear Curso | Instructor',
}

export default async function NewInstructorCoursePage() {
  const { userId } = await requireInstructorLike()

  // Server Action wrapper
  async function handleCreate(formData: FormData) {
    'use server'
    const { userId: instructorId } = await requireInstructorLike()
    return createCourse(formData, {
      instructorId,
      redirectTo: '/dashboard/instructor/cursos/{id}',
      revalidatePaths: ['/dashboard/instructor/cursos', '/cursos'],
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/instructor/cursos"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mis cursos
        </Link>

        <h1 className="text-2xl font-semibold">Crear curso</h1>
        <p className="text-sm text-white/60">
          Define lo básico. Luego añadiremos módulos y lecciones.
        </p>
      </div>

      {/* Form */}
      <CourseFormCore
        action={handleCreate}
        backUrl="/dashboard/instructor/cursos"
        submitLabel="Crear Curso"
        submittingLabel="Creando..."
      />
    </div>
  )
}
