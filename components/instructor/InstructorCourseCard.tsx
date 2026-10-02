'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Impedimento } from '@/lib/instructor/puede-enviarse'
import { estadoVisibleDelCurso } from '@/lib/cursos/estado-visible'
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
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived' | 'coming_soon' | 'changes_requested'
  /**
   * Hace falta para distinguir «en revision» de «publicado con cambios en revision»:
   * en el segundo caso la version publicada sigue viendose, y quien escribe el curso
   * necesita saberlo antes de tocar nada.
   */
  published_at?: string | null
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
  /**
   * Lo que impide enviar este curso a revisión, calculado en el servidor con las mismas
   * reglas que va a aplicar el envío. `null` = nada lo impide.
   */
  impedimento?: Impedimento | null
}

const levelConfig = {
  beginner: { label: 'Principiante', color: 'bg-green-500/10 text-green-400' },
  intermediate: { label: 'Intermedio', color: 'bg-yellow-500/10 text-yellow-400' },
  advanced: { label: 'Avanzado', color: 'bg-red-500/10 text-red-400' },
}

export default function InstructorCourseCard({
  course,
  onStatusChange,
  impedimento = null,
}: InstructorCourseCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(course.status)
  // NI alert() NI confirm().
  //
  // Los dos desaparecen al primer clic y no dejan rastro: en la auditoria, el motivo
  // por el que no se podia enviar un curso «solo salia en la consola». Lo que explica
  // que falta se queda en la tarjeta, donde se puede leer con calma.
  const [error, setError] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<null | 'enviar' | 'duplicar'>(null)
  const router = useRouter()

  // Del sitio compartido: aqui habia una copia de la tabla de estados, con otros
  // nombres que en el panel de administracion para los mismos estados.
  const estado = estadoVisibleDelCurso(
    { status: currentStatus, published_at: course.published_at },
    { para: 'autor' }
  )
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

  // Enviar a revisión (para cursos en draft, rejected o changes_requested)
  const handleSubmitForReview = async () => {
    if (isSubmitting) return
    setConfirmando(null)
    setIsSubmitting(true)
    setError(null)

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
        const data = await res.json().catch(() => ({}))
        setError(
          [data.error, data.details].filter(Boolean).join(': ') ||
            `No se pudo enviar a revisión (${res.status}).`
        )
      }
    } catch (e) {
      console.error('Error enviando a revisión:', e)
      setError('No se pudo enviar a revisión: no hubo respuesta del servidor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDuplicate = async () => {
    if (isDuplicating) return
    setConfirmando(null)
    setIsDuplicating(true)
    setError(null)

    try {
      const res = await fetch(`/api/instructor/courses/${course.id}/duplicate`, {
        method: 'POST',
      })

      if (res.ok) {
        // router.refresh() y no window.location.reload(): no hace falta volver a
        // cargar la pagina entera, y asi no se pierde lo que haya escrito en los
        // filtros de arriba.
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(
          [data.error, data.details].filter(Boolean).join(': ') ||
            `No se pudo duplicar el curso (${res.status}).`
        )
      }
    } catch (e) {
      console.error('Error duplicando:', e)
      setError('No se pudo duplicar el curso: no hubo respuesta del servidor.')
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
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${estado.clases}`}>
            <span aria-hidden="true">{estado.icono}</span>
            {estado.etiqueta}
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
        {(durationHours ?? 0) > 0 && (
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

      {/* LO QUE FALTA PARA PODER ENVIAR, dicho antes de que nadie lo intente */}
      {impedimento && impedimento.clave !== 'estado' && (
        <p className="mb-4 text-sm text-amber-300/90">{impedimento.motivo}</p>
      )}

      {/* LO QUE HA FALLADO, en la tarjeta */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
        >
          <p className="font-semibold text-red-400">No se pudo hacer</p>
          <p className="mt-1 text-red-300/90">{error}</p>
        </div>
      )}

      {/* La confirmacion, dentro de la pagina */}
      {confirmando && (
        <div className="mb-4 rounded-xl border border-white/15 bg-white/5 p-3 text-sm">
          <p className="text-white/80">
            {confirmando === 'enviar'
              ? '¿Enviar este curso a revisión? Lo revisará la administración antes de publicarlo.'
              : '¿Crear una copia de este curso como borrador?'}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={confirmando === 'enviar' ? handleSubmitForReview : handleDuplicate}
              className="px-3 py-1.5 rounded-lg bg-brand-light/20 text-brand-light hover:bg-brand-light/30 transition-colors"
            >
              Sí, {confirmando === 'enviar' ? 'enviar' : 'duplicar'}
            </button>
            <button
              onClick={() => setConfirmando(null)}
              className="px-3 py-1.5 rounded-lg text-white/60 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

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

          {/* VISTA PREVIA.
              /cursos/<slug> es la pagina publica, y de un curso sin publicar no
              ensena el curso: ensena «no disponible». La vista previa del instructor
              es otra ruta, y es la que sirve mientras se escribe. */}
          <Link
            href={
              currentStatus === 'published'
                ? `/cursos/${course.slug}`
                : `/dashboard/instructor/cursos/${course.id}/preview`
            }
            target={currentStatus === 'published' ? '_blank' : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            {currentStatus === 'published' ? 'Ver publicado' : 'Vista previa'}
          </Link>

          {/* Duplicar */}
          <button
            onClick={() => { setError(null); setConfirmando('duplicar') }}
            disabled={isDuplicating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            title="Duplicar curso"
          >
            <Copy className="w-4 h-4" />
            {isDuplicating ? '...' : 'Duplicar'}
          </button>

          {/* ENVIAR A REVISION.
              Si falta algo —sin especialidad, sin verificacion vigente, sin modulos o
              sin lecciones—, el boton no manda una peticion que el servidor va a
              rechazar: lleva al editor, que es donde se arregla, con el motivo a la
              vista. Las reglas se calculan en el servidor y son las del envio. */}
          {(currentStatus === 'draft' || currentStatus === 'rejected' || currentStatus === 'changes_requested') && (
            impedimento ? (
              <Link
                href={`/dashboard/instructor/cursos/${course.id}?aviso=${impedimento.clave}`}
                title={impedimento.motivo}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                Falta algo para enviar
              </Link>
            ) : (
              <button
                onClick={() => { setError(null); setConfirmando('enviar') }}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-light bg-brand-light/10 hover:bg-brand-light/20 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSubmitting ? 'Enviando...' : currentStatus === 'changes_requested' ? 'Editar y reenviar' : currentStatus === 'rejected' ? 'Reenviar' : 'Enviar a revisión'}
              </button>
            )
          )}

          {/* Mientras se revisan los cambios de un curso publicado, lo importante no es
              repetir el estado —ya esta arriba— sino que lo publicado sigue en pie. */}
          {estado.esperaRevision && estado.sigueVisible && (
            <span className="text-xs text-white/50">
              Lo publicado sigue visible
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
