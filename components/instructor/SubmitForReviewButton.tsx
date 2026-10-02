'use client'

import { useState } from 'react'
import { Send, Loader2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCambiosSinGuardar } from '@/components/instructor/CambiosSinGuardar'

interface SubmitForReviewButtonProps {
  courseId: string
  currentStatus: string
}

export function SubmitForReviewButton({ courseId, currentStatus }: SubmitForReviewButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  // EL ERROR SE QUEDA EN LA PANTALLA.
  //
  // Antes esto era un `alert()`, y un alert lo cierra cualquier cosa —una
  // automatizacion, un navegador que los bloquea, un clic distraido— y no deja
  // rastro: en la auditoria el motivo del rechazo «solo salia en la consola». Un
  // mensaje que explica que falta tiene que poder leerse con calma.
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { hayCambios } = useCambiosSinGuardar()

  // SE COMPRUEBA AQUI TAMBIEN, no solo al abrir la confirmacion.
  //
  // El formulario sigue en pantalla mientras se pide confirmacion: se puede abrirla,
  // cambiar algo y pulsar «Si, enviar». Comprobarlo solo al abrir deja esa ventana, y
  // el envio lee la base —lo guardado—, no lo que se ve.
  const AVISO_SIN_GUARDAR =
    'Guarda los cambios antes de enviar: el envío comprueba lo que hay guardado.'

  const handleSubmit = async () => {
    if (hayCambios) {
      setError(AVISO_SIN_GUARDAR)
      setShowConfirm(false)
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/submit-review`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error
        throw new Error(errorMsg || 'Error al enviar a revisión')
      }

      router.refresh()
      setShowConfirm(false)
    } catch (e) {
      console.error('Error:', e)
      setError(e instanceof Error ? e.message : 'No se pudo enviar a revisión.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const aviso = error ? (
    <div
      role="alert"
      className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
    >
      <p className="font-semibold text-red-400">No se pudo enviar a revisión</p>
      <p className="mt-1 text-red-300/90">{error}</p>
    </div>
  ) : null

  if (showConfirm) {
    return (
      <div className="flex flex-col gap-3">
        {aviso}
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">¿Enviar a revisión?</span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-brand-light text-white text-sm font-medium rounded-lg hover:bg-brand transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Sí, enviar'
            )}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-white/10 text-white/70 text-sm rounded-lg hover:bg-white/20 transition"
          >
            Cancelar
          </button>
        </div>
        <Link
          href="/dashboard/instructor/guia"
          target="_blank"
          className="inline-flex items-center gap-1 text-xs text-brand-light hover:text-brand transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Ver guía de revisión antes de enviar
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {aviso}
      {hayCambios && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300"
        >
          <p className="font-semibold text-amber-400">Tienes cambios sin guardar</p>
          <p className="mt-1 text-amber-300/90">
            El envío lee lo que hay guardado, no lo que se ve en el formulario. Guarda
            los cambios antes de enviar.
          </p>
        </div>
      )}
    <button
      onClick={() => {
        // SIN GUARDAR NO SE ENVIA. El servidor lee la base: enviar con la
        // especialidad elegida pero no guardada se rechazaba por algo que en pantalla
        // parecia resuelto.
        if (hayCambios) {
          setError(AVISO_SIN_GUARDAR)
          return
        }
        setShowConfirm(true)
      }}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-light/20 border border-brand-light/30 text-brand-light font-semibold rounded-xl hover:bg-brand-light/30 transition"
    >
      <Send className="w-4 h-4" />
      {currentStatus === 'rejected' || currentStatus === 'changes_requested'
        ? 'Reenviar a revisión'
        : 'Enviar a revisión'}
    </button>
    </div>
  )
}
