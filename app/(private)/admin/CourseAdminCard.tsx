'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  BookOpen,
  Layers,
  Users,
  Edit,
  Copy,
  Power,
} from 'lucide-react'

type CourseAdminCardProps = {
  course: {
    id: string
    title: string
    description?: string
    status: 'draft' | 'published'
    modules?: any[]
    enrollments?: { count: number }[]
  }
}

export default function CourseAdminCard({ course }: CourseAdminCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const modulesCount = course.modules?.length || 0
  const enrollmentsCount = course.enrollments?.[0]?.count || 0

  // ============================
  // Toggle status (draft/published)
  // ============================
  const handleToggleStatus = async () => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(
        `/admin/cursos/${course.id}/toggle-status`,
        { method: 'POST' }
      )

      if (!res.ok) {
        throw new Error('Error al cambiar el estado')
      }

      router.refresh()
    } catch (err) {
      console.error('❌ Toggle status error:', err)
      alert('No se pudo cambiar el estado del curso')
    } finally {
      setLoading(false)
    }
  }

  // ============================
  // Duplicate course
  // ============================
  const handleDuplicate = async () => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(
        `/admin/cursos/${course.id}/duplicate`,
        { method: 'POST' }
      )

      const data = await res.json()

      if (!res.ok || !data?.id) {
        throw new Error('Error al duplicar el curso')
      }

      router.push(`/admin/cursos/${data.id}`)
    } catch (err) {
      console.error('❌ Duplicate error:', err)
      alert('No se pudo duplicar el curso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="group relative bg-gradient-to-br from-white/5 via-white/[0.03] to-transparent backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-[#ff6b35]/40 transition-all duration-300">

      {/* Status badge */}
      <div className="absolute top-4 right-4">
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${
            course.status === 'published'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}
        >
          {course.status === 'published' ? 'Publicado' : 'Borrador'}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2">
        {course.title}
      </h3>

      {/* Description */}
      {course.description && (
        <p className="text-sm text-white/60 mb-4 line-clamp-2">
          {course.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-white/60 mb-6">
        <div className="flex items-center gap-1">
          <Layers className="w-4 h-4" />
          {modulesCount} módulos
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {enrollmentsCount} inscritos
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/cursos/${course.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
        >
          <Edit className="w-4 h-4" />
          Editar
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDuplicate}
            disabled={loading}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-50"
            title="Duplicar curso"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleStatus}
            disabled={loading}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-50"
            title="Publicar / Despublicar"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
