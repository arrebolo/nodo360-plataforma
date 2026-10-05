'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { mensajeDeRespuesta } from '@/lib/ui/errores'
import { DialogoDeConfirmacion } from '@/components/ui/DialogoDeConfirmacion'

interface DeleteLessonButtonProps {
  lessonId: string
  lessonTitle: string
  /**
   * A quien llamar: '/api/instructor' desde la zona del instructor, '/api/admin' desde
   * el panel. El permiso NO lo decide esto, lo decide la ruta: la de instructor exige
   * que el curso sea tuyo y la de admin exige admin. Esta aqui porque ninguna pantalla
   * de /dashboard/instructor debe llamar a /api/admin, y porque los cuatro botones del
   * editor del instructor recibian 403.
   */
  /**
   * SIN VALOR POR OMISION, a proposito: cada pantalla dice su zona y si alguien la
   * olvida no compila. Con `api = '/api/admin'` por defecto, olvidarse en una pantalla
   * de instructor no daba ni un aviso —llamaba al panel y, mientras ese endpoint dejara
   * pasar, «funcionaba»—. Eso es exactamente como llego aqui el unico incumplimiento
   * que quedaba de la regla.
   */
  api: string

  moduleId: string
  courseId: string
}

export function DeleteLessonButton({
  lessonId,
  lessonTitle,
  moduleId,
  courseId,
  api,
}: DeleteLessonButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  // El error, EN PANTALLA. Antes era un alert(), que lo cierra cualquier cosa y no
  // deja rastro: en la auditoria estas acciones «fallaban sin avisar».
  const [error, setError] = useState<string | null>(null)
  // Y LA CONFIRMACION, TAMBIEN EN PANTALLA: el confirm() del navegador se descarta solo
  // segun quien mire, y en la re-auditoria el borrado «no pedia confirmacion».
  const [confirmando, setConfirmando] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setConfirmando(false)
    setError(null)

    setIsDeleting(true)

    try {
      console.log('🗑️ [Delete Lesson] Eliminando lección:', lessonId)

      const response = await fetch(`${api}/lessons/${lessonId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error(await mensajeDeRespuesta(response, 'No se pudo eliminar la lección.'))

      console.log('✅ [Delete Lesson] Lección eliminada')
      router.refresh()
    } catch (error) {
      console.error('❌ [Delete Lesson] Error:', error)
      setError(error instanceof Error ? error.message : 'No se pudo eliminar la lección.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <DialogoDeConfirmacion
        abierto={confirmando}
        titulo={`¿Borrar la lección «${lessonTitle}»?`}
        textoDeConfirmar="Sí, borrar la lección"
        trabajando={isDeleting}
        onConfirmar={handleDelete}
        onCancelar={() => setConfirmando(false)}
      >
        <p>Desaparece del curso y las lecciones que queden se renumeran.</p>
        <p>
          El progreso de quien ya la hizo no se borra: desde la copia publicada cuelga de
          su propia copia, no de esta fila. Si alguien se queda al 100 % porque faltaba
          justo esta, podrá pedir su certificado como siempre.
        </p>
        <p className="text-white/50">No se puede deshacer.</p>
      </DialogoDeConfirmacion>

      <button
        onClick={() => { setError(null); setConfirmando(true) }}
        disabled={isDeleting}
        title={`Borrar la lección «${lessonTitle}»`}
        className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition disabled:opacity-50"
      >
        <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-pulse' : ''}`} />
      </button>
      {error && (
        <p className="max-w-[16rem] text-right text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}


