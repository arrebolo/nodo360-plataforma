import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { CourseForm } from '@/components/admin/CourseForm'

export const metadata = {
  title: 'Editar Curso | Admin - Nodo360',
}

async function getCourse(id: string) {
  const { supabase } = await requireAdmin()

  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !course) {
    return null
  }

  return course
}

export default async function EditarCursoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const course = await getCourse(id)

  if (!course) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/cursos/${course.id}`}
          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Editar Curso</h1>
          <p className="text-white/60">{course.title}</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <CourseForm course={course} mode="edit" />
      </div>
    </div>
  )
}
