'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

/**
 * Se desactiva al pulsar: un segundo envío llegaría con el enlace ya gastado y
 * podría llevar a «el enlace ha caducado» justo después de haber entrado.
 */
export function BotonConfirmar({ texto }: { texto: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Comprobando…
        </>
      ) : (
        texto
      )}
    </button>
  )
}
