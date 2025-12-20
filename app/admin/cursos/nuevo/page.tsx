import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { CourseForm } from '@/components/admin/CourseForm'

export const metadata = {
  title: 'Nuevo Curso | Admin - Nodo360',
}

export default async function NuevoCursoPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/cursos"
          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nuevo Curso</h1>
          <p className="text-white/60">Crea un nuevo curso para la plataforma</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <CourseForm mode="create" />
      </div>
    </div>
  )
}
