import Link from 'next/link'
import { BookOpenCheck, Check } from 'lucide-react'

interface Props {
  /** Titulo del modulo que se acaba de terminar. */
  moduloTitulo: string
  /** Lecciones leidas en esta visita. 0 = no se pudo contar; se omite la cifra. */
  leccionesLeidas: number
  /** A donde ir tras registrarse: la leccion SIGUIENTE, para no repetir esta. */
  siguienteUrl: string
}

/**
 * Invitacion al terminar el ultimo tema de un modulo, sin cuenta.
 *
 * NO BLOQUEA NADA. Va debajo del contenido, con la leccion ya leida y el boton
 * de "Siguiente" intacto a su lado: quien quiera seguir, sigue. Es el unico
 * momento del curso en que parar a mirar atras tiene sentido -se acaba de
 * cerrar un bloque- y por eso es donde se pregunta, en vez de interrumpir a
 * mitad de una leccion o de tapar el contenido con un muro.
 *
 * Dice una cifra real, la de esta visita, en lugar de una promesa generica.
 * "Llevas 4 lecciones leidas y no se ha guardado ninguna" es un argumento;
 * "registrate para desbloquear todo tu potencial" no lo es.
 */
export function InvitacionFinDeModulo({ moduloTitulo, leccionesLeidas, siguienteUrl }: Props) {
  const ventajas = [
    'Se guarda por dónde vas, en cualquier dispositivo',
    'Se desbloquea el examen final del curso',
    'Al aprobarlo, un certificado verificable',
  ]

  return (
    <div className="rounded-2xl border border-brand-light/25 bg-brand-light/[0.06] p-6">
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light/15">
          <BookOpenCheck className="h-5 w-5 text-brand-light" aria-hidden />
        </div>

        <div className="min-w-0 space-y-3">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">
              Has terminado «{moduloTitulo}»
            </h3>
            <p className="text-sm text-white/60 max-w-prose">
              {leccionesLeidas > 1
                ? `Llevas ${leccionesLeidas} lecciones leídas en esta visita y no se ha guardado ninguna: sin cuenta, al cerrar la pestaña se pierde por dónde ibas.`
                : 'Sin cuenta, al cerrar la pestaña se pierde por dónde ibas.'}{' '}
              Puedes seguir leyendo igual; crear una cuenta es gratis y añade tres cosas.
            </p>
          </div>

          <ul className="space-y-1.5">
            {ventajas.map((v) => (
              <li key={v} className="flex items-start gap-2 text-sm text-white/70">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-light" aria-hidden />
                {v}
              </li>
            ))}
          </ul>

          <Link
            href={`/login?mode=register&redirect=${siguienteUrl}`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-light px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand"
          >
            Crear cuenta gratis
            <span aria-hidden>→</span>
          </Link>

          <p className="text-xs text-white/35">
            Al terminar sigues en la lección siguiente, sin repetir esta.
          </p>
        </div>
      </div>
    </div>
  )
}
