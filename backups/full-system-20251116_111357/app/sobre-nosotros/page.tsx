import { Target, Eye, Heart, Users, Zap, Shield, Globe, TrendingUp, Award, BookOpen, MessageCircle } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre Nosotros - Nodo360 | Misión, Visión y Valores',
  description: 'Conoce la historia de Nodo360, nuestra misión de democratizar la educación en Bitcoin y Blockchain, y el equipo detrás de la plataforma.',
  openGraph: {
    title: 'Sobre Nodo360',
    description: 'La plataforma educativa #1 en español para Bitcoin y Blockchain',
  },
}

export default function SobreNosotrosPage() {
  return (
    <main className="min-h-screen bg-[#1a1f2e]">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-b from-[#1a1f2e] to-[#252b3d]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/10 to-[#FFD700]/10" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#ff6b35] rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#FFD700] rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-full mb-8">
            <Heart className="w-4 h-4 text-[#ff6b35]" />
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b35] to-[#FFD700]">
              NUESTRA HISTORIA
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            Construyendo el{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b35] to-[#FFD700]">
              Futuro
            </span>
            {' '}de la Educación
          </h1>

          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-12">
            Democratizando el acceso a la educación de Bitcoin y Blockchain en español desde 2023
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-[#252b3d]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 md:p-12 border border-white/20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Nuestra Historia</h2>
            <div className="space-y-4 text-white/80 text-lg leading-relaxed">
              <p>
                Nodo360 nació de una necesidad clara: <span className="text-white font-semibold">educación de calidad en Bitcoin y Blockchain en español</span>. Mientras el mundo avanzaba rápidamente hacia la adopción de criptomonedas y tecnología descentralizada, notamos que la mayoría de los recursos educativos de calidad estaban en inglés.
              </p>
              <p>
                En 2023, un grupo de desarrolladores, educadores y entusiastas de Bitcoin decidimos cambiar esto. Creamos Nodo360 con una misión simple pero ambiciosa: <span className="text-white font-semibold">hacer que la educación en blockchain sea accesible para todos los hispanohablantes</span>, sin importar su nivel de experiencia o ubicación.
              </p>
              <p>
                Lo que comenzó como cursos básicos ha evolucionado en una plataforma completa con <span className="text-[#ff6b35] font-semibold">cursos gratuitos y premium, comunidad activa, mentoría personalizada y proyectos innovadores</span>. Hoy, más de 2,300 estudiantes de 50+ países confían en Nodo360 para su educación en crypto.
              </p>
              <p>
                Pero esto es solo el comienzo. Nuestro objetivo es convertirnos en <span className="text-white font-semibold">la plataforma educativa de referencia en español para todo lo relacionado con Bitcoin, Blockchain y Web3</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-gradient-to-b from-[#252b3d] to-[#1a1f2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-br from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-[#ff6b35]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Nuestra Misión</h2>
              <p className="text-white/80 text-lg leading-relaxed">
                Democratizar el acceso a educación de calidad en Bitcoin, Blockchain y Web3, empoderando a la comunidad hispanohablante con el conocimiento y las herramientas necesarias para prosperar en la economía descentralizada del futuro.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-br from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-2xl flex items-center justify-center mb-6">
                <Eye className="w-8 h-8 text-[#ff6b35]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Nuestra Visión</h2>
              <p className="text-white/80 text-lg leading-relaxed">
                Ser la plataforma educativa líder en español para tecnologías blockchain, reconocida por la excelencia de nuestros contenidos, la fuerza de nuestra comunidad y el impacto real en las carreras profesionales de nuestros estudiantes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-[#1a1f2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Nuestros Valores
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Los principios que guían todo lo que hacemos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Educación Accesible',
                desc: 'Creemos que el conocimiento debe estar al alcance de todos, sin barreras de entrada.'
              },
              {
                icon: Users,
                title: 'Comunidad Primero',
                desc: 'Nuestra comunidad es el corazón de Nodo360. Todo lo construimos pensando en ellos.'
              },
              {
                icon: Shield,
                title: 'Transparencia Total',
                desc: 'Operamos con transparencia absoluta, igual que la blockchain que enseñamos.'
              },
              {
                icon: Zap,
                title: 'Innovación Constante',
                desc: 'El mundo crypto evoluciona rápido, y nosotros también. Siempre actualizados.'
              },
              {
                icon: Award,
                title: 'Excelencia en Contenido',
                desc: 'No comprometemos la calidad. Cada curso pasa por rigurosa revisión técnica.'
              },
              {
                icon: Globe,
                title: 'Inclusión Global',
                desc: 'Celebramos la diversidad y creamos un espacio acogedor para todos.'
              },
            ].map((value, i) => (
              <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-[#ff6b35]/50 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-xl flex items-center justify-center mb-4">
                  <value.icon className="w-7 h-7 text-[#ff6b35]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                <p className="text-white/70">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-gradient-to-b from-[#1a1f2e] to-[#252b3d]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Nuestro Camino
            </h2>
            <p className="text-xl text-white/70">
              Los hitos más importantes de Nodo360
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                year: '2023',
                quarter: 'Q1',
                title: 'Fundación de Nodo360',
                desc: 'Lanzamiento oficial con los primeros 3 cursos gratuitos sobre Bitcoin básico.'
              },
              {
                year: '2023',
                quarter: 'Q2',
                title: 'Lanzamiento de Comunidad',
                desc: 'Creación de Discord y Telegram. Primeros 500 miembros.'
              },
              {
                year: '2023',
                quarter: 'Q3',
                title: 'Cursos Premium',
                desc: 'Introducción de cursos premium con certificación. Primer curso de Solidity.'
              },
              {
                year: '2023',
                quarter: 'Q4',
                title: 'Programa de Mentoría',
                desc: 'Lanzamiento del programa de mentoría 1-on-1. Primeros 50 estudiantes.'
              },
              {
                year: '2024',
                quarter: 'Q1',
                title: '1000+ Estudiantes',
                desc: 'Alcanzamos los 1000 estudiantes activos y expandimos a 30+ países.'
              },
              {
                year: '2024',
                quarter: 'Q2',
                title: 'Proyectos Comunitarios',
                desc: 'Inicio de proyectos impulsados por la comunidad. Primera DAO en desarrollo.'
              },
              {
                year: '2024',
                quarter: 'Q3',
                title: 'Certificados NFT',
                desc: 'Implementación de certificados en blockchain como NFTs verificables.'
              },
              {
                year: '2024',
                quarter: 'Q4',
                title: '2300+ Miembros',
                desc: 'Superamos los 2300 miembros activos. Presencia en 50+ países.'
              },
            ].map((milestone, i) => (
              <div key={i} className="relative pl-8 pb-8 border-l-2 border-[#ff6b35]/30 last:border-l-0 last:pb-0">
                <div className="absolute left-0 top-0 w-4 h-4 bg-gradient-to-br from-[#ff6b35] to-[#FFD700] rounded-full -translate-x-[9px] ring-4 ring-[#252b3d]" />
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:border-[#ff6b35]/50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-gradient-to-r from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-full text-sm font-bold text-[#ff6b35]">
                      {milestone.year} {milestone.quarter}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{milestone.title}</h3>
                  <p className="text-white/70">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-[#252b3d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Nodo360 en Números
            </h2>
            <p className="text-xl text-white/70">
              El impacto que hemos logrado juntos
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: '2,300+', label: 'Estudiantes Activos' },
              { icon: Globe, value: '50+', label: 'Países' },
              { icon: BookOpen, value: '25+', label: 'Cursos Disponibles' },
              { icon: Award, value: '500+', label: 'Certificados Emitidos' },
              { icon: MessageCircle, value: '10k+', label: 'Mensajes en Discord' },
              { icon: TrendingUp, value: '95%', label: 'Tasa de Satisfacción' },
              { icon: Target, value: '200+', label: 'Estudiantes Empleados' },
              { icon: Zap, value: '24/7', label: 'Soporte Comunitario' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-2xl mb-4">
                  <stat.icon className="w-8 h-8 text-[#ff6b35]" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gradient-to-b from-[#252b3d] to-[#1a1f2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Nuestro Equipo
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Un equipo apasionado por Bitcoin, Blockchain y la educación
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Equipo de Desarrollo',
                role: 'Ingenieros Blockchain',
                desc: 'Desarrolladores con experiencia en Bitcoin, Ethereum y Layer 2s'
              },
              {
                name: 'Equipo de Contenido',
                role: 'Educadores & Writers',
                desc: 'Creadores de contenido especializados en cripto y pedagogía'
              },
              {
                name: 'Mentores',
                role: 'Expertos de la Industria',
                desc: 'Profesionales activos en empresas crypto líderes'
              },
            ].map((team, i) => (
              <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#ff6b35] to-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{team.name}</h3>
                <p className="text-[#ff6b35] font-semibold mb-3">{team.role}</p>
                <p className="text-white/70 text-sm">{team.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-white/70 mb-6">
              ¿Quieres formar parte del equipo? Estamos buscando talento apasionado por la educación y blockchain.
            </p>
            <a
              href="mailto:team@nodo360.com"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all duration-300 hover:scale-105"
            >
              <MessageCircle className="w-5 h-5" />
              Contáctanos
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[#1a1f2e]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Sé Parte de Nuestra Historia
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Únete a miles de estudiantes que ya están construyendo su futuro en Web3
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/cursos"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all duration-300 hover:scale-105"
              >
                <BookOpen className="w-5 h-5" />
                Explorar Cursos
              </a>
              <a
                href="/comunidad"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-lg rounded-xl hover:border-[#ff6b35]/50 transition-all duration-300 hover:scale-105"
              >
                <Users className="w-5 h-5" />
                Unirse a la Comunidad
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
