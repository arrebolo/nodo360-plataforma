'use client'

/**
 * Pedir UN dato, dentro de la página. El sustituto de `prompt()`.
 *
 * POR QUÉ NO `prompt()`
 *   Los tres botones de medios del editor —enlace, imagen y vídeo— pedían la URL con
 *   `window.prompt()`. Ese diálogo lo gobierna el navegador: BLOQUEA LA PESTAÑA entera
 *   mientras está abierto, en algunos navegadores está desactivado o se descarta solo,
 *   no se puede pegar con formato ni corregir con calma, y no se puede explicar al lado
 *   qué URL se espera. En la auditoría del flujo de instructor apareció como «el botón
 *   de enlace bloquea el navegador».
 *
 *   Aquí el dato se pide con un campo de verdad: se ve lo que hay escrito, se cancela
 *   con Escape, y el texto de ayuda dice qué formato vale.
 */
import { useEffect, useRef, useState } from 'react'

interface Props {
  abierto: boolean
  titulo: string
  /** Lo que acompaña al campo: qué se espera exactamente. */
  ayuda?: string
  etiqueta: string
  marcaDeAgua?: string
  /** Lo que ya había, para poder corregirlo en vez de volver a escribirlo. */
  valorInicial?: string
  textoDeConfirmar?: string
  /** Vacío = quitar lo que hubiera (un enlace se quita dejando el campo en blanco). */
  onConfirmar: (valor: string) => void
  onCancelar: () => void
}

/**
 * Cerrado no es «escondido»: no hay nada montado.
 *
 * Así el campo nace con el valor que toca cada vez que se abre, sin tener que ponérselo
 * desde un efecto —que es cascada de pintadas y se desincroniza si el valor cambia
 * mientras está cerrado—.
 */
export function DialogoDeUnDato(props: Props) {
  if (!props.abierto) return null
  return <Dentro {...props} />
}

function Dentro({
  titulo,
  ayuda,
  etiqueta,
  marcaDeAgua,
  valorInicial = '',
  textoDeConfirmar = 'Aceptar',
  onConfirmar,
  onCancelar,
}: Props) {
  const [valor, setValor] = useState(valorInicial)
  const campo = useRef<HTMLInputElement>(null)

  // El foco en el campo, con lo que había seleccionado. Escape cancela.
  useEffect(() => {
    const t = setTimeout(() => campo.current?.select(), 0)
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelar()
    }
    document.addEventListener('keydown', alPulsar)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', alPulsar)
    }
  }, [onCancelar])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
      onClick={onCancelar}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-del-dato"
        className="w-full max-w-md rounded-2xl border border-white/15 bg-[#12121a] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          onConfirmar(valor.trim())
        }}
      >
        <h2 id="titulo-del-dato" className="font-semibold text-white">
          {titulo}
        </h2>
        {ayuda && <p className="mt-1 text-sm text-white/60">{ayuda}</p>}

        <label className="mt-4 block text-sm text-white/70" htmlFor="campo-del-dato">
          {etiqueta}
        </label>
        <input
          ref={campo}
          id="campo-del-dato"
          type="text"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={marcaDeAgua}
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
        />

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-lg border border-brand-light/40 bg-brand-light/15 px-3 py-2 text-sm font-medium text-brand-light transition-colors hover:bg-brand-light/25"
          >
            {textoDeConfirmar}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DialogoDeUnDato
