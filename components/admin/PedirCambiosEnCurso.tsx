'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'

/**
 * Lo minimo que puede medir el comentario, tras recortar espacios. Tiene que
 * coincidir con MINIMO_DEL_COMENTARIO del servidor, que es quien manda: esto solo
 * evita el viaje y explica por que.
 *
 * El comentario llega tal cual al instructor, en el correo y en la notificacion.
 * «000» no le dice nada a nadie.
 */
const MINIMO_DEL_COMENTARIO = 20

export function PedirCambiosEnCurso({
  accion,
}: {
  accion: (formData: FormData) => void | Promise<void>
}) {
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)

  const largo = comentario.trim().length
  const suficiente = largo >= MINIMO_DEL_COMENTARIO

  return (
    <form
      action={accion}
      onSubmit={() => setEnviando(true)}
      className="space-y-3"
    >
      <div>
        <label htmlFor="comentario-cambios" className="block text-sm text-white/70 mb-2">
          Qué hay que cambiar{' '}
          <span className="text-white/40">
            (obligatorio, mínimo {MINIMO_DEL_COMENTARIO} caracteres)
          </span>
        </label>
        <textarea
          id="comentario-cambios"
          name="comment"
          rows={4}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Concreto y accionable: qué lección, qué falta, qué habría que corregir."
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
        />
        <p className={`mt-1 text-xs ${suficiente ? 'text-white/40' : 'text-amber-400/80'}`}>
          {suficiente
            ? `${largo}/${MINIMO_DEL_COMENTARIO} caracteres`
            : `Escribe al menos ${MINIMO_DEL_COMENTARIO} caracteres: esto llega tal cual al instructor (van ${largo}).`}
        </p>
      </div>

      <button
        type="submit"
        disabled={!suficiente || enviando}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-300 transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MessageSquare className="h-4 w-4" />
        {enviando ? 'Enviando…' : 'Pedir cambios'}
      </button>

      <p className="text-xs text-white/40">
        El curso vuelve al instructor para que lo corrija y lo reenvíe. No se rechaza
        ni se archiva.
      </p>
    </form>
  )
}
