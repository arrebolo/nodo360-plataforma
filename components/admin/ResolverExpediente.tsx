'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  id: string
  estado: 'pendiente' | 'aprobada'
  requiereAcreditacion: boolean
  permiteEvaluadorExterno: boolean
  oralActual: string | null
  practicaActual: string | null
}

const RESULTADOS = ['pendiente', 'apto', 'no_apto'] as const

/**
 * Resuelve un expediente. Las reglas de verdad estan en el servidor —para
 * aprobar, las dos partes aptas, y la acreditacion si la especialidad la
 * exige— y aqui se repiten solo para no dejar pulsar en balde.
 */
export default function ResolverExpediente({
  id,
  estado,
  requiereAcreditacion,
  permiteEvaluadorExterno,
  oralActual,
  practicaActual,
}: Props) {
  const router = useRouter()
  const [oral, setOral] = useState(oralActual ?? 'pendiente')
  const [practica, setPractica] = useState(practicaActual ?? 'pendiente')
  const [notas, setNotas] = useState('')
  const [externo, setExterno] = useState(false)
  const [tipoAcred, setTipoAcred] = useState('')
  const [refAcred, setRefAcred] = useState('')
  const [cargando, setCargando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const acreditacionLista = !requiereAcreditacion || (tipoAcred.trim() !== '' && refAcred.trim() !== '')
  const puedeAprobar = oral === 'apto' && practica === 'apto' && acreditacionLista
  const clase =
    'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-white/30'

  async function resolver(decision: 'aprobada' | 'rechazada' | 'retirada') {
    setCargando(decision)
    setError(null)
    try {
      const res = await fetch('/api/admin/verificaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          decision,
          evaluator_notes: notas,
          oral_result: oral,
          practical_result: practica,
          evaluator_is_external: externo,
          accreditation_type: tipoAcred,
          accreditation_ref: refAcred,
        }),
      })
      const datos = await res.json()
      if (!res.ok || !datos.success) {
        setError(datos.error ?? 'No se pudo resolver')
        return
      }
      router.refresh()
    } catch {
      setError('No se pudo resolver')
    } finally {
      setCargando(null)
    }
  }

  // Una aprobada solo admite retirarla, y eso pide motivo.
  if (estado === 'aprobada') {
    return (
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs text-white/50 block mb-1">Motivo de la retirada</span>
          <textarea
            className={clase}
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Queda registrado y es obligatorio"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={() => resolver('retirada')}
          disabled={notas.trim() === '' || cargando !== null}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando === 'retirada' ? 'Retirando…' : 'Retirar la verificación'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-white/50 block mb-1">Repreguntas</span>
          <select className={clase} value={oral} onChange={(e) => setOral(e.target.value)}>
            {RESULTADOS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-white/50 block mb-1">Parte práctica</span>
          <select className={clase} value={practica} onChange={(e) => setPractica(e.target.value)}>
            {RESULTADOS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      {requiereAcreditacion && (
        <div className="grid md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-white/50 block mb-1">Tipo de acreditación</span>
            <input
              className={clase}
              value={tipoAcred}
              onChange={(e) => setTipoAcred(e.target.value)}
              placeholder="Colegiación, título…"
            />
          </label>
          <label className="block">
            <span className="text-xs text-white/50 block mb-1">Referencia</span>
            <input
              className={clase}
              value={refAcred}
              onChange={(e) => setRefAcred(e.target.value)}
              placeholder="Número o referencia"
            />
          </label>
        </div>
      )}

      <label className="block">
        <span className="text-xs text-white/50 block mb-1">
          Notas del evaluador{' '}
          <span className="text-white/30">(obligatorias para rechazar)</span>
        </span>
        <textarea
          className={clase}
          rows={2}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </label>

      {permiteEvaluadorExterno && (
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={externo}
            onChange={(e) => setExterno(e.target.checked)}
            className="w-4 h-4 rounded border-white/10 bg-white/5"
          />
          La firma un evaluador externo a Nodo360
        </label>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => resolver('aprobada')}
          disabled={!puedeAprobar || cargando !== null}
          title={puedeAprobar ? undefined : 'Hacen falta las dos partes aptas' + (requiereAcreditacion ? ' y la acreditación' : '')}
          className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 text-sm hover:bg-green-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando === 'aprobada' ? 'Aprobando…' : 'Aprobar'}
        </button>
        <button
          onClick={() => resolver('rechazada')}
          disabled={notas.trim() === '' || cargando !== null}
          title={notas.trim() === '' ? 'Un rechazo necesita explicarse' : undefined}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando === 'rechazada' ? 'Rechazando…' : 'Rechazar'}
        </button>
      </div>
    </div>
  )
}
