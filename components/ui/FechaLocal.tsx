'use client'

/**
 * Una fecha, sin romper la hidratación.
 *
 * EL FALLO QUE ARREGLA (React #418)
 *   Un componente de cliente que hace `new Date(iso).toLocaleDateString('es-ES')` formatea
 *   la fecha DOS VECES: una en el servidor, al generar el HTML, y otra en el navegador, al
 *   hidratar. Y cada uno usa SU huso. El servidor de Vercel está en UTC y quien mira está
 *   en Madrid o en Bogotá, así que para cualquier marca de tiempo cercana a medianoche los
 *   dos escriben días distintos y React no puede hidratar:
 *
 *     servidor:  «Editado 3 oct 2026»
 *     navegador: «Editado 2 oct 2026»
 *     → Hydration failed because the server rendered text didn't match the client
 *
 *   Se reprodujo asi: un curso con `updated_at` a las 23:30 del huso del servidor y el
 *   navegador en Pacific/Niue (UTC-11). Con los dos husos iguales NO se ve, que es por lo
 *   que un servidor de desarrollo en el mismo ordenador no lo encuentra nunca.
 *
 * COMO LO EVITA
 *   La primera pintada es la misma en los dos lados —en UTC, que es como está guardada—,
 *   así que hay algo que hidratar y coincide. Ya montado, y solo entonces, pasa al huso de
 *   quien lee. No se usa `suppressHydrationWarning`: eso calla el aviso pero deja en
 *   pantalla la fecha del servidor, que es justo la que no le sirve a quien mira.
 *
 *   El `<time dateTime>` lleva la marca exacta para quien la lea con una herramienta.
 */
import { useEffect, useState } from 'react'

const OPCIONES: Record<string, Intl.DateTimeFormatOptions> = {
  corta: { day: 'numeric', month: 'short', year: 'numeric' },
  larga: { day: 'numeric', month: 'long', year: 'numeric' },
  conHora: { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
}

export function FechaLocal({
  iso,
  formato = 'corta',
  className,
}: {
  iso: string
  formato?: keyof typeof OPCIONES
  className?: string
}) {
  const opciones = OPCIONES[formato] ?? OPCIONES.corta
  // La primera, en UTC: igual en el servidor y en el navegador.
  const [texto, setTexto] = useState(() =>
    new Date(iso).toLocaleDateString('es-ES', { ...opciones, timeZone: 'UTC' })
  )

  useEffect(() => {
    setTexto(new Date(iso).toLocaleDateString('es-ES', opciones))
    // `opciones` sale de una constante: no cambia entre pintadas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, formato])

  return (
    <time dateTime={iso} className={className}>
      {texto}
    </time>
  )
}

export default FechaLocal
