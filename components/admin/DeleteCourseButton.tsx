'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { mensajeDeRespuesta } from '@/lib/ui/errores'
import { DialogoDeConfirmacion } from '@/components/ui/DialogoDeConfirmacion'

interface DeleteCourseButtonProps {
  courseId: string
  courseTitle: string
}

export function DeleteCourseButton({ courseId, courseTitle }: DeleteCourseButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  // LA CONFIRMACION Y EL ERROR, EN PANTALLA: ni confirm() ni alert(). El nativo lo
  // gobierna el navegador —se descarta solo segun quien mire— y el alert desaparece al
  // primer clic sin dejar rastro, que es como estas acciones «fallaban sin avisar».
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async () => {
    setConfirmando(false)
    setError(null)

    setIsDeleting(true)

    try {
      console.log('🗑️ [Delete Button] Eliminando curso:', courseId)

      // Llamar al endpoint de delete
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(await mensajeDeRespuesta(response, 'No se pudo eliminar el curso.'))
      }

      console.log('✅ [Delete Button] Curso eliminado')
      router.push('/admin/cursos')
      router.refresh()
    } catch (error) {
      console.error('❌ [Delete Button] Error:', error)
      setError(error instanceof Error ? error.message : 'No se pudo eliminar el curso.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <DialogoDeConfirmacion
        abierto={confirmando}
        titulo={`¿Borrar el curso «${courseTitle}»?`}
        textoDeConfirmar="Sí, borrar el curso"
        trabajando={isDeleting}
        onConfirmar={handleDelete}
        onCancelar={() => setConfirmando(false)}
      >
        <p>Se borran el curso, sus módulos y todas sus lecciones.</p>
        <p>
          Si el curso estuvo publicado, lo que han hecho los alumnos no se va con él: el
          progreso y los certificados cuelgan de la copia publicada. Lo que desaparece es
          el curso como obra editable.
        </p>
        <p className="text-white/50">No se puede deshacer.</p>
      </DialogoDeConfirmacion>

      <button
        type="button"
        onClick={() => { setError(null); setConfirmando(true) }}
        disabled={isDeleting}
        className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className={`w-5 h-5 ${isDeleting ? 'animate-pulse' : ''}`} />
        {isDeleting ? 'Eliminando...' : 'Eliminar Curso'}
      </button>

      {error && (
        <p className="max-w-md text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}


