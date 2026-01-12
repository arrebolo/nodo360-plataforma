import { requireAdmin } from '@/lib/admin/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { CourseFormCore } from '@/components/courses'
import { createCourse } from '@/lib/courses/course-actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Crear Nuevo Curso | Admin Nodo360',
}

export default async function NuevoCursoPage() {
  const { user } = await requireAdmin()

  // Server Action wrapper
  async function handleCreate(formData: FormData) {
    'use server'
    const { user: adminUser } = await requireAdmin()
    return createCourse(formData, {
      instructorId: adminUser.id,
      redirectTo: '/admin/cursos/{id}',
      revalidatePaths: ['/admin/cursos', '/cursos'],
    })
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/cursos"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a cursos
          </Link>

          <h1 className="text-4xl font-bold text-white mb-2">
            Crear Nuevo Curso
          </h1>
          <p className="text-white/70">
            Completa los detalles básicos del curso
          </p>
        </div>

        {/* Formulario */}
        <CourseFormCore
          action={handleCreate}
          backUrl="/admin/cursos"
          submitLabel="Crear Curso"
          submittingLabel="Creando..."
        />
      </div>
    </div>
  )
}
