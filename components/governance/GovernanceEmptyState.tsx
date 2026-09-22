import { Vote, FileText, Users, Scale } from 'lucide-react'

/**
 * Estado vacío honesto de la gobernanza, con el mismo criterio que /proyectos:
 * explicar qué es y cómo funcionará, sin fechas ni promesas (Principio #7).
 *
 * Todo lo que se afirma aquí sale de lo que ya está construido y se puede
 * comprobar en la base de datos: las propuestas tienen dos niveles, el peso del
 * voto se calcula con gPower a partir de XP, reputación e insignias, y los
 * mentores votan las solicitudes de mentoría. No se anuncia nada que no exista.
 */
export function GovernanceEmptyState() {
  const pasos = [
    {
      icon: FileText,
      title: 'Alguien propone un cambio',
      desc: 'Una propuesta describe qué se quiere cambiar en la plataforma y por qué. Las de nivel 1 las puede presentar cualquier estudiante con experiencia acumulada; las de nivel 2 quedan reservadas a mentores y administración.',
    },
    {
      icon: Users,
      title: 'La comunidad la discute',
      desc: 'Antes de votarse, una propuesta se lee y se comenta. El objetivo no es filtrar, es que llegue mejor argumentada a la votación.',
    },
    {
      icon: Scale,
      title: 'Se vota con un peso',
      desc: 'Cada voto tiene un peso, el gPower, que sale de la experiencia acumulada, la reputación y las insignias obtenidas. Quien más ha recorrido la plataforma pesa más, y ese peso queda registrado junto al voto para que el recuento sea verificable.',
    },
    {
      icon: Vote,
      title: 'El resultado queda público',
      desc: 'Se registra cuántos votos hubo a favor, en contra y en blanco, y con cuánto peso. Las propuestas decididas se pueden consultar después.',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-white">
          Todavía no hay ninguna propuesta
        </h2>
        <p className="mt-3 max-w-2xl text-white/70">
          La gobernanza de Nodo360 es el mecanismo por el que la comunidad decide
          cómo evoluciona la plataforma. Está construida y funcionando, pero aún
          no se ha presentado ninguna propuesta, así que no hay nada que mostrar.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-white/50">
          Cuando alguien presente la primera, aparecerá aquí con su discusión y su
          votación abierta.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white">Cómo funciona</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {pasos.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-white/10 bg-dark-surface p-5"
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-light" aria-hidden="true" />
                <div>
                  <p className="font-medium text-white">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/60">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-white/40">
        No hay fechas anunciadas para la primera votación. Cuando la haya, se verá
        en esta misma página.
      </p>
    </div>
  )
}

export default GovernanceEmptyState
