'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Edit, Trash2, Eye, BookOpen, Users, Clock } from 'lucide-react'
import { deleteCourse } from '@/lib/admin/actions'
import { toast } from 'sonner'

interface CourseAdminCardProps {
  course: {
    id: string
    title: string
    slug: string
    description: string
    level: 'beginner' | 'intermediate' | 'advanced'
    is_free: boolean
    is_premium: boolean
    thumbnail_url: string | null
    created_at: string
    modules?: { count: number }[]
    lessons?: { count: number }[]
    enrollments?: { count: number }[]
  }
  onDelete?: () => void
}

export default function CourseAdminCard({ course, onDelete }: CourseAdminCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const modulesCount = course.modules?.[0]?.count || 0
  const lessonsCount = course.lessons?.[0]?.count || 0
  const enrollmentsCount = course.enrollments?.[0]?.count || 0

  const handleDelete = async () => {
    setDeleting(true)
    const result = await deleteCourse(course.id)

    if (result.success) {
      toast.success('Curso eliminado correctamente')
      onDelete?.()
    } else {
      toast.error(result.error || 'Error al eliminar curso')
    }
    setDeleting(false)
    setShowDeleteConfirm(false)
  }

  const levelConfig = {
    beginner: { label: 'Principiante', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    intermediate: { label: 'Intermedio', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    advanced: { label: 'Avanzado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  }

  const statusConfig = course.is_free
    ? { label: 'Gratis', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' }
    : { label: 'Premium', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-[#ff6b35]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,53,0.15)]"
      >
        {/* Thumbnail */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#1a1f2e] to-[#252b3d]">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white/20" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1f2e] via-transparent to-transparent opacity-60" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm ${levelConfig[course.level].color}`}>
              {levelConfig[course.level].label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-[#ff6b35] transition-colors">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-white/60 mb-4 line-clamp-2">
            {course.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-6 text-xs text-white/50">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#24D4FF]" />
              <span>{modulesCount} módulos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#00C98D]" />
              <span>{lessonsCount} lecciones</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#ff6b35]" />
              <span>{enrollmentsCount}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {/* View */}
            <Link
              href={`/cursos/${course.slug}`}
              target="_blank"
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#24D4FF]/50 rounded-lg text-white text-sm font-medium transition-all hover:shadow-[0_0_20px_rgba(36,212,255,0.2)] flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Ver
            </Link>

            {/* Edit */}
            <Link
              href={`/admin/cursos/${course.id}`}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] hover:from-[#ff7a45] hover:to-[#ffa52a] text-white text-sm font-medium rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,107,53,0.3)] flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Link>

            {/* Delete */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Slug */}
          <p className="text-xs text-white/30 mt-3 font-mono">
            /cursos/{course.slug}
          </p>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(255,107,53,0.2)]"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>

            <h3 className="text-xl font-bold text-white text-center mb-2">
              ¿Eliminar curso?
            </h3>
            <p className="text-white/60 text-center mb-6">
              Esta acción no se puede deshacer. Se eliminarán todos los módulos, lecciones y progreso asociados.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all disabled:opacity-50 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
