'use client'

/**
 * Un botón que, antes de enviar su formulario, pide confirmación en la página.
 *
 * POR QUÉ EXISTE
 *   Los botones de borrar que llaman a la API ya tienen su diálogo
 *   (`DeleteModuleButton`, `DeleteLessonButton`, `DeleteCourseButton`). Pero quedaban
 *   dos borrados que no pasan por la API, sino por una *server action* dentro de un
 *   `<form>`: la «Zona de peligro» de la ficha de un módulo, en el panel y en el
 *   editor del instructor. Ahí no había confirmación **de ninguna clase**: un clic y
 *   el módulo se iba.
 *
 *   La diferencia importa: un componente de cliente no puede envolver una server
 *   action sin cambiar lo que hace. Así que esto no sustituye al formulario —se queda
 *   tal cual, con su comprobación de propiedad y su redirección—, solo se pone delante:
 *   el botón no envía, abre el diálogo, y al confirmar llama a `form.requestSubmit()`.
 *
 * LO QUE NO HACE
 *   No cambia la regla de lo que se borra. La ficha del módulo se niega a borrarlo si
 *   tiene lecciones («elimínalas primero») y eso sigue igual: aquí solo se añade la
 *   pregunta que faltaba.
 */
import { useRef, useState } from 'react'
import { DialogoDeConfirmacion } from '@/components/ui/DialogoDeConfirmacion'

interface Props {
  /** Lo que pone el botón que se ve en la página. */
  children: React.ReactNode
  /** El título del diálogo: «¿Borrar el módulo «X»?». */
  titulo: string
  /** Qué pasa exactamente si se confirma. */
  explicacion: React.ReactNode
  /** Lo que pone el botón que confirma. */
  textoDeConfirmar: string
  disabled?: boolean
  className?: string
}

export function ConfirmarYEnviar({
  children,
  titulo,
  explicacion,
  textoDeConfirmar,
  disabled = false,
  className,
}: Props) {
  const [abierto, setAbierto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const boton = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={boton}
        // `type="button"`, NO `submit`: si fuera submit, el formulario se enviaría al
        // pulsarlo y el diálogo llegaría tarde.
        type="button"
        disabled={disabled || enviando}
        onClick={() => setAbierto(true)}
        className={className}
      >
        {children}
      </button>

      <DialogoDeConfirmacion
        abierto={abierto}
        titulo={titulo}
        textoDeConfirmar={textoDeConfirmar}
        trabajando={enviando}
        onConfirmar={() => {
          setEnviando(true)
          // El formulario de este botón: un <button> sabe en qué formulario está, así
          // que no hace falta pasarle ningún identificador desde el servidor.
          boton.current?.form?.requestSubmit()
        }}
        onCancelar={() => setAbierto(false)}
      >
        {explicacion}
      </DialogoDeConfirmacion>
    </>
  )
}

export default ConfirmarYEnviar
