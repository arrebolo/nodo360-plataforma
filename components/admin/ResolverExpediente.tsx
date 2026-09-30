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
 * Lo minimo que puede medir la nota para rechazar o retirar. Tiene que coincidir
 * con MINIMO_DE_LA_NOTA del servidor, que es quien manda.
 *
 * Se acepto un rechazo con la nota «000», y esa nota llega TAL CUAL al correo del
 * candidato: es lo unico que va a leer sobre por que no salio adelante.
 */
const MINIMO_DE_LA_NOTA = 20

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
  const [noAnunciar, setNoAnunciar] = useState(false)
  const [cargando, setCargando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const largoDeLaNota = notas.trim().length
  const notaSuficiente = largoDeLaNota >= MINIMO_DE_LA_NOTA
  const avisoDeLaNota = notaSuficiente
    ? undefined
    : `Escribe al menos ${MINIMO_DE_LA_NOTA} caracteres: esta nota llega tal cual a la persona (van ${largoDeLaNota}).`

  /**
   * El contador se pinta SIEMPRE, tambien cuando la nota ya vale.
   *
   * Antes solo aparecia si faltaban caracteres, y eso tiene un problema practico:
   * si el navegador sirve un bundle viejo en cache, no hay forma de distinguir
   * «no hay contador porque la nota vale» de «no hay contador porque este codigo
   * no es el nuevo». Visible siempre, se ve de un golpe cual de las dos es.
   */
  const contador = `${largoDeLaNota}/${MINIMO_DE_LA_NOTA} caracteres`

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
          no_anunciar: noAnunciar,
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
        <p className={`text-xs ${notaSuficiente ? 'text-white/40' : 'text-amber-400'}`}>
          {contador}
          {!notaSuficiente && ` · ${avisoDeLaNota}`}
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={() => resolver('retirada')}
          disabled={!notaSuficiente || cargando !== null}
          title={avisoDeLaNota}
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
          <span className="text-white/30">
            (obligatorias para rechazar, mínimo {MINIMO_DE_LA_NOTA} caracteres)
          </span>
        </span>
        <textarea
          className={clase}
          rows={2}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
        <span className={`mt-1 block text-xs ${notaSuficiente ? 'text-white/40' : 'text-amber-400'}`}>
          {contador}
          {!notaSuficiente && ' · hacen falta para rechazar'}
        </span>
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

      {/*
        NO ANUNCIAR: para poder probar el flujo completo —correo, notificación,
        rol— sin dejar un anuncio de prueba en un canal público. La primera prueba
        publicó en #anuncios de verdad y hubo que borrarlo a mano.

        No marca la fecha del anuncio, así que el anuncio queda pendiente y se
        puede publicar después si se quiere.
      */}
      <label className="flex items-start gap-2 text-sm text-white/70">
        <input
          type="checkbox"
          checked={noAnunciar}
          onChange={(e) => setNoAnunciar(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-white/10 bg-white/5"
        />
        <span>
          No anunciar en Discord ni en Telegram
          <span className="block text-xs text-white/40">
            Para pruebas. Aprueba igual y avisa a la persona, pero no publica nada.
            El anuncio queda pendiente.
          </span>
        </span>
      </label>

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
          disabled={!notaSuficiente || cargando !== null}
          title={avisoDeLaNota}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando === 'rechazada' ? 'Rechazando…' : 'Rechazar'}
        </button>
      </div>
    </div>
  )
}
