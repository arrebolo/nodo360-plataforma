'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** Copia un comando al portapapeles. Sin JavaScript, el comando se selecciona a mano. */
export function BotonCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sin permiso para el portapapeles (http, iframe): no se puede hacer nada
      // mejor que dejar el comando a la vista para seleccionarlo.
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white transition"
      aria-label={copiado ? 'Comando copiado' : 'Copiar el comando'}
    >
      {copiado ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {copiado ? 'Copiado' : 'Copiar'}
    </button>
  )
}
