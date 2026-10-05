'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { mensajeDeRespuesta } from '@/lib/ui/errores'
import { DialogoDeConfirmacion } from '@/components/ui/DialogoDeConfirmacion'

interface DeleteModuleButtonProps {
  moduleId: string
  moduleTitle: string
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

  courseId: string
}

export function DeleteModuleButton({
  moduleId,
  moduleTitle,
  courseId,
  api,
}: DeleteModuleButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  // El error, EN PANTALLA. Antes era un alert(), que lo cierra cualquier cosa y no
  // deja rastro: en la auditoria estas acciones «fallaban sin avisar».
  const [error, setError] = useState<string | null>(null)
  // Y LA CONFIRMACION, TAMBIEN EN PANTALLA. Era un confirm() del navegador, y en la
  // re-auditoria «borrar un modulo no pide confirmacion»: el dialogo nativo lo gobierna
  // el navegador y se descarta solo segun quien mire.
  const [confirmando, setConfirmando] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setConfirmando(false)
    setError(null)

    setIsDeleting(true)

    try {
      console.log('🗑️ [Delete Module] Eliminando módulo:', moduleId)

      const response = await fetch(`${api}/modules/${moduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error(await mensajeDeRespuesta(response, 'No se pudo eliminar el módulo.'))

      console.log('✅ [Delete Module] Módulo eliminado')
      router.refresh()
    } catch (error) {
      console.error('❌ [Delete Module] Error:', error)
      setError(error instanceof Error ? error.message : 'No se pudo eliminar el módulo.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <DialogoDeConfirmacion
        abierto={confirmando}
        titulo={`¿Borrar el módulo «${moduleTitle}»?`}
        textoDeConfirmar="Sí, borrar el módulo"
        trabajando={isDeleting}
        onConfirmar={handleDelete}
        onCancelar={() => setConfirmando(false)}
      >
        <p>Se borra el módulo y todas sus lecciones.</p>
        <p>
          El progreso de quien ya las hizo no se borra: desde la copia publicada cuelga
          de su propia copia, no de estas filas. Los módulos que queden se renumeran.
        </p>
        <p className="text-white/50">No se puede deshacer.</p>
      </DialogoDeConfirmacion>

      <button
        onClick={() => { setError(null); setConfirmando(true) }}
        disabled={isDeleting}
        title={`Borrar el módulo «${moduleTitle}»`}
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


