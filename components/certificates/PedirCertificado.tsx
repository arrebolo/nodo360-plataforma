'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Award, Loader2 } from 'lucide-react'
import { mensajeDeRespuesta } from '@/lib/ui/errores'

/**
 * «Emitir mi certificado», para quien ya cumple y todavía no lo tiene.
 *
 * POR QUE HACE FALTA UN BOTON
 *   El certificado se emitía en dos momentos: al marcar la última lección
 *   (app/api/progress) y al aprobar el examen (app/api/quiz/submit). Si alguien aprueba
 *   el examen y llega al 100 % MAS TARDE y por otro camino —por ejemplo porque se borró
 *   la lección que le faltaba, que ahora recalcula las matrículas—, no vuelve a pasar
 *   por ninguno de los dos y se queda cumpliendo las condiciones sin forma de pedirlo.
 *   `/api/certificates/generate` existía, pero no lo llamaba nadie.
 *
 * POR QUE UN BOTON Y NO EMITIRLO AL PINTAR LA PAGINA
 *   Escribir en la base durante el render es un efecto secundario en cada visita, y
 *   bastaría con que un prefetch del navegador tocara la página para emitir un
 *   certificado que nadie ha pedido. La condición la comprueba el servidor igual
 *   (`createCertificate` exige lecciones completas y examen aprobado); esto solo es
 *   quien lo pide.
 */
export function PedirCertificado({
  courseId,
  etiqueta = 'Emitir mi certificado',
}: {
  courseId: string
  etiqueta?: string
}) {
  const [emitiendo, setEmitiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const pedir = async () => {
    if (emitiendo) return
    setEmitiendo(true)
    setError(null)
    try {
      const res = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      if (!res.ok) {
        throw new Error(await mensajeDeRespuesta(res, 'No se pudo emitir el certificado.'))
      }
      // La página lo vuelve a leer y aparece el enlace al certificado.
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo emitir el certificado.')
      setEmitiendo(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={pedir}
        disabled={emitiendo}
        className="inline-flex items-center gap-2 self-start rounded-lg bg-green-500/20 px-3 py-1.5
                   text-sm font-semibold text-green-100 transition hover:bg-green-500/30
                   disabled:opacity-50"
      >
        {emitiendo ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Award className="h-4 w-4" aria-hidden="true" />
        )}
        {emitiendo ? 'Emitiendo…' : etiqueta}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}
