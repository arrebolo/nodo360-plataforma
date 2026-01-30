import { requireInstructorLike } from '@/lib/auth/requireInstructor'
import { CourseFormCore } from '@/components/courses'
import { createCourse } from '@/lib/courses/course-actions'
import Link from 'next/link'
import { ArrowLeft, Info } from 'lucide-react'

export const metadata = {
  title: 'Crear Curso | Instructor',
}

export default async function NewInstructorCoursePage() {
  const { userId } = await requireInstructorLike()

  // Server Action wrapper - cursos de instructor inician como borrador
  async function handleCreate(formData: FormData) {
    'use server'
    const { userId: instructorId } = await requireInstructorLike()

    // Forzar status = 'draft' para cursos de instructor
    const modifiedFormData = new FormData()
    formData.forEach((value, key) => {
      if (key === 'status') {
        modifiedFormData.append(key, 'draft')
      } else {
        modifiedFormData.append(key, value)
      }
    })
    // Asegurar que status esté presente
    if (!modifiedFormData.has('status')) {
      modifiedFormData.append('status', 'draft')
    }

    return createCourse(modifiedFormData, {
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

      {/* Info sobre proceso de aprobación */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-blue-300 font-medium">Proceso de publicacion</p>
          <p className="text-white/60 mt-1">
            Tu curso comenzara como borrador. Cuando este listo, podras enviarlo a revision.
            Un mentor lo revisara antes de publicarlo.
          </p>
          <Link
            href="/guia-revision"
            className="inline-flex items-center gap-1 mt-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            Lee nuestra guia de revision antes de enviar
            <ArrowLeft className="w-3 h-3 rotate-180" />
          </Link>
        </div>
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
