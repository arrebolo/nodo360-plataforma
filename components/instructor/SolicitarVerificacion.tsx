'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Especialidad = {
  id: string
  nombre: string
  descripcion: string | null
  requiere_acreditacion: boolean
  /**
   * Si esa especialidad tiene examen UTILIZABLE: activo y con banco suficiente.
   * Cuatro examenes antiguos existen con cero preguntas, y antes de la 099 esto
   * prometia un examen que al intentarlo fallaba.
   */
  tiene_examen: boolean
}

/**
 * Pide una verificacion para uno mismo.
 *
 * No manda ningun user_id: la identidad la resuelve el servidor con auth.uid().
 * Mandarla desde aqui seria dejar que cualquiera abriera expedientes a nombre de
 * otra persona, porque PostgREST es alcanzable y la clave anonima es publica.
 */
export default function SolicitarVerificacion({
  especialidades,
}: {
  especialidades: Especialidad[]
}) {
  const router = useRouter()
  const [elegida, setElegida] = useState('')
  const [consiente, setConsiente] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esp = especialidades.find((e) => e.id === elegida)

  async function solicitar() {
    if (!elegida) return
    setCargando(true)
    setError(null)
    try {
      const res = await fetch('/api/instructor/verificacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialty_id: elegida, consentimiento_anuncio: consiente }),
      })
      const datos = await res.json()
      if (!res.ok || !datos.success) {
        setError(datos.error ?? 'No se pudo enviar la solicitud')
        return
      }
      setElegida('')
      setConsiente(false)
      router.refresh()
    } catch {
      setError('No se pudo enviar la solicitud')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs text-white/50 block mb-1">Especialidad</span>
        <select
          value={elegida}
          onChange={(e) => setElegida(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30"
        >
          <option value="">Elige una…</option>
          {especialidades.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
              {e.tiene_examen ? ' · con examen' : ' · entrevista y práctica'}
            </option>
          ))}
        </select>
      </label>

      {esp && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          {esp.descripcion && <p className="text-sm text-white/70">{esp.descripcion}</p>}

          {esp.tiene_examen ? (
            <p className="text-sm text-white/70">
              <strong className="text-white">Con examen.</strong> Quince preguntas de su
              banco, y después repreguntas en voz alta y una parte práctica. La nota no
              decide por sí sola.
            </p>
          ) : (
            <p className="text-sm text-white/70">
              <strong className="text-white">Sin examen todavía.</strong> Esta especialidad
              no tiene banco de preguntas, así que la verificación es{' '}
              <strong className="text-white">entrevista y parte práctica</strong>. Es el
              mismo camino que fiscalidad y derecho, y no es un atajo: lo que se valora es
              lo mismo.
            </p>
          )}
          {esp.requiere_acreditacion && (
            <p className="text-sm text-amber-400">
              Esta especialidad <strong>requiere acreditación profesional</strong>: hará falta
              el tipo y la referencia —colegiación o título— y los comprueba el evaluador.
              Aprobar un examen nuestro no basta.
            </p>
          )}
        </div>
      )}

      {/*
        EL CONSENTIMIENTO PARA EL ANUNCIO PUBLICO.
        Opcional y desmarcado por defecto. Se pide AQUI, al solicitar, y vale solo
        para esta solicitud: consentir una vez no consiente las siguientes. Si no
        se marca, no se publica nada en ningun sitio.
      */}
      <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={consiente}
          onChange={(e) => setConsiente(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-orange-500"
        />
        <span className="text-sm text-white/70">
          Acepto que, si mi verificación se aprueba, se anuncie en los canales de Nodo360
          (Discord y Telegram) con mi nombre público y mi especialidad.
          <span className="block text-xs text-white/40 mt-1">
            Opcional. Solo se publicaría tu nombre público, la especialidad y el enlace a tu
            perfil. Si se rechaza, no se anuncia nada.
          </span>
        </span>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={solicitar}
        disabled={!elegida || cargando}
        className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 text-sm hover:bg-orange-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cargando ? 'Enviando…' : 'Pedir la verificación'}
      </button>

      <p className="text-xs text-white/40">
        Queda pendiente hasta que el equipo de Nodo360 la evalúe. Si te la rechazan,
        puedes volver a pedirla pasados 30 días.
      </p>
    </div>
  )
}
