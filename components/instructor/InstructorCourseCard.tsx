'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Pencil,
  Eye,
  BookOpen,
  Clock,
  Users,
  Calendar,
  Copy,
  Send,
Loader2,
  Share2
} from 'lucide-react'

interface Course {
  id: string
  title: string
  slug: string
  level: 'beginner' | 'intermediate' | 'advanced'
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived' | 'coming_soon'
  is_free: boolean
  price?: number | null
  total_modules: number | null
  total_lessons: number | null
  total_duration_minutes?: number | null
  updated_at: string
  enrolled_count?: number
  thumbnail_url?: string | null
}

interface InstructorCourseCardProps {
  course: Course
  onStatusChange?: (courseId: string, newStatus: string) => void
}

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  pending_review: { label: 'En revisión', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  published: { label: 'Publicado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Rechazado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  archived: { label: 'Archivado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  coming_soon: { label: 'Proximamente', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
}

const levelConfig = {
  beginner: { label: 'Principiante', color: 'bg-green-500/10 text-green-400' },
  intermediate: { label: 'Intermedio', color: 'bg-yellow-500/10 text-yellow-400' },
  advanced: { label: 'Avanzado', color: 'bg-red-500/10 text-red-400' },
}

export default function InstructorCourseCard({ course, onStatusChange }: InstructorCourseCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(course.status)
  const router = useRouter()

  const status = statusConfig[currentStatus] || statusConfig.draft
  const level = levelConfig[course.level] || levelConfig.beginner

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const durationHours = course.total_duration_minutes
    ? Math.round(course.total_duration_minutes / 60)
    : null

  // Enviar a revisión (para cursos en draft o rejected)
  const handleSubmitForReview = async () => {
    if (isSubmitting) return

    if (!confirm('¿Enviar este curso a revisión? Un administrador lo revisará antes de publicarlo.')) {
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/instructor/courses/${course.id}/submit-review`, {
        method: 'POST',
      })

      if (res.ok) {
        setCurrentStatus('pending_review')
        if (onStatusChange) {
          onStatusChange(course.id, 'pending_review')
        }
        router.refresh()
      } else {
        const data = await res.json()
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error
        alert(errorMsg || 'Error al enviar a revisión')
      }
    } catch (error) {
      console.error('Error enviando a revisión:', error)
      alert('Error al enviar a revisión')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDuplicate = async () => {
    if (isDuplicating) return

    if (!confirm('¿Crear una copia de este curso como borrador?')) return

    setIsDuplicating(true)

    try {
      const res = await fetch(`/api/instructor/courses/${course.id}/duplicate`, {
        method: 'POST',
      })

      if (res.ok) {
        // Recargar la pagina para ver el nuevo curso
        window.location.reload()
      } else {
        alert('Error al duplicar el curso')
      }
    } catch (error) {
      console.error('Error duplicando:', error)
      alert('Error al duplicar el curso')
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <div className="group relative bg-white/5 hover:bg-white/[0.07] border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all duration-300">
      {/* Header: Titulo + Badges */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate group-hover:text-[#f7931a] transition-colors">
            {course.title}
          </h3>
          <p className="text-sm text-white/40 truncate mt-1">/{course.slug}</p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${status.color}`}>
            {status.label}
          </span>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${course.is_free ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#f7931a]/10 text-[#f7931a]'}`}>
            {course.is_free ? 'Gratis' : `${course.price || 0}€`}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-white/50 mb-4">
        <span className={`px-2 py-0.5 rounded text-xs ${level.color}`}>
          {level.label}
        </span>
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          {course.total_modules || 0} modulos · {course.total_lessons || 0} lecciones
        </span>
        {durationHours && (
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {durationHours}h
          </span>
        )}
        {course.enrolled_count !== undefined && (
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {course.enrolled_count} alumnos
          </span>
        )}
      </div>

      {/* Footer: Ultima edicion + Acciones */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <span className="flex items-center gap-1.5 text-xs text-white/40">
          <Calendar className="w-3.5 h-3.5" />
          Editado {formatDate(course.updated_at)}
        </span>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* Promocionar (solo cursos publicados) */}
          {currentStatus === 'published' && (
            <Link
              href={`/dashboard/instructor/referidos/nuevo?course=${course.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-400 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Promocionar
            </Link>
          )}

          {/* Editar */}
          <Link
            href={`/dashboard/instructor/cursos/${course.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </Link>

          {/* Preview */}
          <Link
            href={`/cursos/${course.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Link>

          {/* Duplicar */}
          <button
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            title="Duplicar curso"
          >
            <Copy className="w-4 h-4" />
            {isDuplicating ? '...' : 'Duplicar'}
          </button>

          {/* Enviar a revisión (solo para draft o rejected) */}
          {(currentStatus === 'draft' || currentStatus === 'rejected') && (
            <button
              onClick={handleSubmitForReview}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-light bg-brand-light/10 hover:bg-brand-light/20 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? 'Enviando...' : currentStatus === 'rejected' ? 'Reenviar' : 'Enviar a revisión'}
            </button>
          )}

          {/* Indicador de estado para pending_review */}
          {currentStatus === 'pending_review' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-orange-400 bg-orange-500/10 rounded-lg">
              En revisión
            </span>
          )}

          {/* Indicador de estado para published */}
          {currentStatus === 'published' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-400 bg-emerald-500/10 rounded-lg">
              Publicado
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
