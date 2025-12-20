import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import type { Course } from '@/types/database'
import { DeleteCourseButton } from './DeleteCourseButton'

export const metadata = {
  title: 'Cursos | Admin - Nodo360',
}

async function getCourses() {
  const { supabase } = await requireAdmin()

  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching courses:', error)
    return []
  }

  return courses as Course[]
}

export default async function AdminCursosPage() {
  const courses = await getCourses()

  const statusColors = {
    draft: 'bg-yellow-500/20 text-yellow-400',
    published: 'bg-green-500/20 text-green-400',
    archived: 'bg-gray-500/20 text-gray-400',
  }

  const statusLabels = {
    draft: 'Borrador',
    published: 'Publicado',
    archived: 'Archivado',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cursos</h1>
          <p className="text-white/60">Gestiona los cursos de la plataforma</p>
        </div>
        <Link
          href="/admin/cursos/nuevo"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Curso
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{courses.length}</p>
          <p className="text-sm text-white/60">Total Cursos</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-400">
            {courses.filter(c => c.status === 'published').length}
          </p>
          <p className="text-sm text-white/60">Publicados</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-yellow-400">
            {courses.filter(c => c.status === 'draft').length}
          </p>
          <p className="text-sm text-white/60">Borradores</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">
            {courses.reduce((acc, c) => acc + (c.enrolled_count || 0), 0)}
          </p>
          <p className="text-sm text-white/60">Total Estudiantes</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {courses.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Curso</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Estudiantes</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Precio</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white/60">Estado</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-white/60">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((curso) => (
                <tr key={curso.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{curso.title}</p>
                      <p className="text-white/40 text-sm">/{curso.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/70">{curso.enrolled_count || 0}</td>
                  <td className="px-6 py-4 text-white/70">
                    {curso.is_free ? 'Gratis' : `$${curso.price}`}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[curso.status as keyof typeof statusColors]}`}>
                      {statusLabels[curso.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/cursos/${curso.id}`}
                        className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/cursos/${curso.id}/editar`}
                        className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <DeleteCourseButton courseId={curso.id} courseTitle={curso.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <p className="text-white/50 mb-4">No hay cursos creados</p>
            <Link
              href="/admin/cursos/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white rounded-xl font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear primer curso
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
