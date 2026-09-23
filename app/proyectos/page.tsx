import { Users, Lightbulb, MessageCircle, Hammer, Search, GitBranch, Handshake, Eye } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { DISCORD_INVITE_URL } from '@/lib/discord/invite'

export const metadata: Metadata = {
  title: 'Espacio de Proyectos - Nodo360',
  description: 'Un espacio donde los estudiantes de Nodo360 colaboran en proyectos Web3 reales y aprenden construyendo. En preparación.',
  openGraph: {
    title: 'Espacio de Proyectos - Nodo360',
    description: 'Estudiantes que colaboran en proyectos Web3 reales. En preparación.',
  },
}

export default function ProyectosPage() {
  const comoFunciona = [
    {
      icon: Lightbulb,
      title: 'Alguien propone un proyecto',
      desc: 'Un estudiante describe qué quiere construir, con qué objetivo y qué ayuda necesita. No hace falta una idea grande: hace falta una idea concreta.',
    },
    {
      icon: Search,
      title: 'Los mentores lo revisan',
      desc: 'Antes de publicarse, el proyecto pasa por la revisión de mentores de la plataforma, que dan retroalimentación y pueden pedir cambios. El objetivo no es filtrar, es mejorar la propuesta.',
    },
    {
      icon: Handshake,
      title: 'Se suman colaboradores',
      desc: 'Otros estudiantes se unen al proyecto según lo que puedan aportar: código, diseño, documentación, pruebas o simplemente criterio.',
    },
    {
      icon: Eye,
      title: 'El avance es público',
      desc: 'Quien participa publica actualizaciones de lo que va haciendo. Lo que se aprende por el camino queda a la vista de toda la comunidad.',
    },
  ]

  return (
    <main className="min-h-screen bg-dark-surface">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-b from-dark-surface to-dark-soft">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-light/10 to-gold/10" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-brand-light rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gold rounded-full blur-3xl opacity-20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/15 rounded-full mb-8">
            <Hammer className="w-4 h-4 text-white/60" />
            <span className="text-sm font-semibold text-white/70">
              EN PREPARACIÓN
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            Aprender{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-gold">
              construyendo
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto">
            Un espacio donde quienes estudian en Nodo360 trabajan juntos en proyectos Web3 reales.
          </p>

          <p className="text-lg text-white/60 max-w-2xl mx-auto mt-6">
            Todavía no está abierto. Esta página explica qué será y cómo funcionará, para que
            quien tenga interés sepa a qué atenerse.
          </p>
        </div>
      </section>

      {/* Qué es */}
      <section className="py-24 bg-gradient-to-b from-dark-soft to-dark-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Qué es este espacio
          </h2>

          <div className="space-y-6 text-lg text-white/75 leading-relaxed">
            <p>
              Los cursos sirven para entender cómo funcionan las cosas. Construir algo sirve
              para descubrir todo lo que uno creía entender y no entendía. Las dos cosas se
              necesitan.
            </p>
            <p>
              El espacio de proyectos es el lugar donde ocurre la segunda. La idea es sencilla:
              quien estudia aquí propone proyectos Web3, se organiza con otras personas para
              sacarlos adelante y recibe retroalimentación de mentores por el camino.
            </p>
            <p>
              No es un escaparate de productos de Nodo360 ni una lista de cosas que la
              plataforma vaya a lanzar. Los proyectos son de quienes los proponen.
            </p>
            <p className="text-white/60">
              Tampoco es un programa con premios, fondos ni compensación económica. Lo que se
              obtiene al participar es experiencia, trabajo en común y criterio propio.
            </p>
          </div>
        </div>
      </section>

      {/* Cómo funcionará */}
      <section className="py-24 bg-dark-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Cómo funcionará
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Cuatro pasos, sin más ceremonia
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {comoFunciona.map((paso, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-brand-light/20 to-gold/20 border border-brand-light/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <paso.icon className="w-7 h-7 text-brand-light" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{paso.title}</h3>
                    <p className="text-white/70 leading-relaxed">{paso.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quién puede participar */}
      <section className="py-24 bg-gradient-to-b from-dark-soft to-dark-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Quién puede participar
          </h2>

          <div className="space-y-6 text-lg text-white/75 leading-relaxed">
            <p>
              Cualquier persona que esté estudiando en la plataforma y haya recorrido los cursos
              iniciales. La razón no es poner barreras: es que un proyecto avanza mejor cuando
              quienes lo construyen comparten una base común.
            </p>
            <p>
              No hace falta saber programar. Un proyecto necesita documentación, diseño, pruebas,
              alguien que haga las preguntas incómodas y alguien que explique lo aprendido.
              Todas esas tareas enseñan.
            </p>
            <p>
              Los requisitos exactos se publicarán aquí cuando el espacio abra.
            </p>
          </div>
        </div>
      </section>

      {/* Estado actual */}
      <section className="py-24 bg-dark-soft">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 md:p-12 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <GitBranch className="w-7 h-7 text-white/60" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                En qué punto está
              </h2>
            </div>

            <div className="space-y-5 text-lg text-white/75 leading-relaxed">
              <p>
                La parte técnica que sostiene todo esto —propuestas, revisión por mentores,
                colaboradores y actualizaciones— está construida y en el repositorio de la
                plataforma.
              </p>
              <p>
                Lo que falta es la interfaz con la que se usará y terminar de definir las reglas
                de participación.
              </p>
              <p className="text-white/60">
                No damos una fecha de apertura porque no la tenemos. Cuando esté listo se anunciará
                en la comunidad y esta página dejará de decir «en preparación».
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-dark-soft to-dark-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/20">
            <Users className="w-16 h-16 text-brand-light mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Si esto te interesa
            </h2>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Súmate a la comunidad. Ahí se comentan las ideas antes de que existan, y ahí se
              avisará cuando el espacio abra.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-light to-brand text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-brand-light/50 transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5" />
                Unirse a la comunidad
              </a>
              <Link
                href="/cursos"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-lg rounded-xl hover:border-brand-light/50 transition-all duration-300"
              >
                <Lightbulb className="w-5 h-5" />
                Ver los cursos
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
