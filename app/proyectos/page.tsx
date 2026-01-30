import { Rocket, GitBranch, Users, Calendar, Code, CheckCircle2, Clock, Lightbulb, Github, MessageCircle, TrendingUp, Award, BookOpen } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Proyectos Nodo360 - Construyendo el Futuro Juntos',
  description: 'Proyectos innovadores impulsados por la comunidad. Contribuye, aprende y construye el futuro de Web3.',
  openGraph: {
    title: 'Proyectos Nodo360',
    description: 'Proyectos comunitarios de Bitcoin y Blockchain',
  },
}

export default function ProyectosPage() {
  const projects = [
    {
      id: 1,
      title: 'DAO de Gobernanza Nodo360',
      icon: '🏛️',
      status: 'En Desarrollo',
      progress: 40,
      quarter: 'Q1 2025',
      description: 'Sistema de gobernanza descentralizada para que la comunidad tome decisiones sobre el futuro de Nodo360.',
      fullDescription: 'Implementación de una DAO completa que permitirá a los miembros de la comunidad proponer, votar y ejecutar cambios en la plataforma. Incluye tokenomics, sistema de propuestas y ejecución automática.',
      technologies: ['Solidity', 'Hardhat', 'OpenZeppelin', 'IPFS', 'Next.js'],
      benefits: [
        'Toma de decisiones comunitaria',
        'Transparencia total',
        'Incentivos para participación',
        'Ejecución automática de propuestas'
      ],
      github: 'https://github.com/nodo360/dao',
      discord: 'https://discord.gg/ag5aPsNuPY'
    },
    {
      id: 2,
      title: 'Sistema de Certificados NFT',
      icon: '🎓',
      status: 'En Planificación',
      progress: 15,
      quarter: 'Q1 2025',
      description: 'Certificados de cursos verificables en blockchain como NFTs únicos e intransferibles.',
      fullDescription: 'Cada estudiante que complete un curso recibirá un certificado NFT verificable en blockchain. Soulbound tokens (no transferibles) que demuestran competencias reales.',
      technologies: ['Solidity', 'ERC-721', 'Polygon', 'IPFS', 'Metadata API'],
      benefits: [
        'Verificación instantánea de credenciales',
        'Imposible de falsificar',
        'Propiedad permanente',
        'Portfolio on-chain'
      ],
      github: null,
      discord: 'https://discord.gg/ag5aPsNuPY'
    },
    {
      id: 3,
      title: 'DEX Educativo',
      icon: '🔄',
      status: 'Próximamente',
      progress: 0,
      quarter: 'Q2 2025',
      description: 'Exchange descentralizado con fines educativos para aprender trading sin riesgo real.',
      fullDescription: 'Plataforma de trading simulada que replica un DEX real pero con tokens de prueba. Perfecta para aprender sin arriesgar dinero real.',
      technologies: ['Smart Contracts', 'AMM', 'Web3.js', 'React', 'Testing Environment'],
      benefits: [
        'Aprender trading sin riesgo',
        'Entender AMMs en práctica',
        'Competencias de trading',
        'Análisis de estrategias'
      ],
      github: null,
      discord: 'https://discord.gg/ag5aPsNuPY'
    },
    {
      id: 4,
      title: 'Marketplace de Recursos',
      icon: '🏪',
      status: 'Próximamente',
      progress: 0,
      quarter: 'Q2 2025',
      description: 'Mercado descentralizado donde estudiantes pueden comprar/vender recursos educativos.',
      fullDescription: 'Marketplace peer-to-peer para que creadores de contenido compartan y moneticen sus recursos: plantillas, guías, código, diseños.',
      technologies: ['Smart Contracts', 'IPFS', 'Payment Processing', 'Next.js'],
      benefits: [
        'Monetiza tu conocimiento',
        'Recursos de calidad',
        'Pagos directos en crypto',
        'Sin intermediarios'
      ],
      github: null,
      discord: 'https://discord.gg/ag5aPsNuPY'
    },
    {
      id: 5,
      title: 'Hackathons Mensuales',
      icon: '⚡',
      status: 'En Investigación',
      progress: 5,
      quarter: 'Q3 2025',
      description: 'Competencias mensuales de desarrollo con premios y oportunidades laborales.',
      fullDescription: 'Hackathons temáticos cada mes donde equipos compiten construyendo proyectos reales. Premios en crypto y exposición a empresas.',
      technologies: ['Platform TBD', 'Smart Contracts', 'Judging System'],
      benefits: [
        'Práctica real',
        'Premios en crypto',
        'Networking con empresas',
        'Portfolio de proyectos'
      ],
      github: null,
      discord: 'https://discord.gg/ag5aPsNuPY'
    },
    {
      id: 6,
      title: 'Programa de Mentores Certificados',
      icon: '👨‍🏫',
      status: 'En Investigación',
      progress: 10,
      quarter: 'Q3 2025',
      description: 'Sistema de certificación para mentores de la comunidad con estándares de calidad.',
      fullDescription: 'Programa que certifica a los mejores miembros de la comunidad como mentores oficiales, con formación específica y estándares de calidad.',
      technologies: ['Training Platform', 'Certification System', 'Evaluation Tools'],
      benefits: [
        'Mentores de calidad garantizada',
        'Estructura de mentoría clara',
        'Reconocimiento oficial',
        'Mejor experiencia de aprendizaje'
      ],
      github: null,
      discord: 'https://discord.gg/ag5aPsNuPY'
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En Desarrollo': return 'from-green-500 to-emerald-500'
      case 'En Planificación': return 'from-blue-500 to-cyan-500'
      case 'Próximamente': return 'from-purple-500 to-pink-500'
      case 'En Investigación': return 'from-orange-500 to-amber-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'En Desarrollo': return 'bg-green-500/20 border-green-500/30 text-green-400'
      case 'En Planificación': return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
      case 'Próximamente': return 'bg-purple-500/20 border-purple-500/30 text-purple-400'
      case 'En Investigación': return 'bg-orange-500/20 border-orange-500/30 text-orange-400'
      default: return 'bg-white/50/20 border-white/30/30 text-white/60'
    }
  }

  return (
    <main className="min-h-screen bg-dark-surface">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-b from-dark-surface to-dark-soft">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-light/10 to-gold/10" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-brand-light rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gold rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-light/20 to-gold/20 border border-brand-light/30 rounded-full mb-8">
            <Rocket className="w-4 h-4 text-brand-light" />
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-gold">
              IMPULSADO POR LA COMUNIDAD
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            Construyendo el{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-gold">
              Futuro Juntos
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-12">
            Proyectos innovadores de Bitcoin y Blockchain impulsados por nuestra comunidad. Aprende, contribuye y construye.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#proyectos"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-light to-brand text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-brand-light/50 transition-all duration-300 hover:scale-105"
            >
              <GitBranch className="w-5 h-5" />
              Ver Proyectos
            </a>
            <a
              href="#contribuir"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-lg rounded-xl hover:border-brand-light/50 transition-all duration-300 hover:scale-105"
            >
              <Users className="w-5 h-5" />
              Cómo Contribuir
            </a>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="proyectos" className="py-24 bg-gradient-to-b from-dark-soft to-dark-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Roadmap de Proyectos
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Proyectos organizados por fase de desarrollo
            </p>
          </div>

          {/* Projects Timeline */}
          <div className="space-y-12">
            {/* En Desarrollo */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">En Desarrollo</h3>
                  <p className="text-white/60">Actualmente en construcción</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {projects.filter(p => p.status === 'En Desarrollo').map(project => (
                  <ProjectCard key={project.id} project={project} getStatusColor={getStatusColor} getStatusBg={getStatusBg} />
                ))}
              </div>
            </div>

            {/* En Planificación */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">En Planificación</h3>
                  <p className="text-white/60">Definiendo alcance y diseño</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {projects.filter(p => p.status === 'En Planificación').map(project => (
                  <ProjectCard key={project.id} project={project} getStatusColor={getStatusColor} getStatusBg={getStatusBg} />
                ))}
              </div>
            </div>

            {/* Próximamente */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Próximamente (Q2 2025)</h3>
                  <p className="text-white/60">Siguientes en el roadmap</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {projects.filter(p => p.status === 'Próximamente').map(project => (
                  <ProjectCard key={project.id} project={project} getStatusColor={getStatusColor} getStatusBg={getStatusBg} />
                ))}
              </div>
            </div>

            {/* En Investigación */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">En Investigación (Q3 2025)</h3>
                  <p className="text-white/60">Explorando viabilidad</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {projects.filter(p => p.status === 'En Investigación').map(project => (
                  <ProjectCard key={project.id} project={project} getStatusColor={getStatusColor} getStatusBg={getStatusBg} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Contribute Section */}
      <section id="contribuir" className="py-24 bg-dark-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Cómo Contribuir
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Todos pueden aportar, sin importar tu nivel de experiencia
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Code, title: 'Código', desc: 'Desarrolla features, arregla bugs, mejora performance' },
              { icon: Award, title: 'Diseño', desc: 'UI/UX, gráficos, branding, mockups' },
              { icon: BookOpen, title: 'Contenido', desc: 'Documentación, tutoriales, traducciones' },
              { icon: CheckCircle2, title: 'Testing', desc: 'Pruebas, reportes de bugs, QA' },
            ].map((type, i) => (
              <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-brand-light/20 to-gold/20 border border-brand-light/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <type.icon className="w-7 h-7 text-brand-light" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{type.title}</h3>
                <p className="text-white/70 text-sm">{type.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">Pasos para Contribuir</h3>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Únete a Discord', desc: 'Conéctate con el equipo y otros contribuidores' },
                { step: 2, title: 'Elige un Proyecto', desc: 'Encuentra algo que te apasione del roadmap' },
                { step: 3, title: 'Revisa el GitHub', desc: 'Lee la documentación y los issues abiertos' },
                { step: 4, title: 'Empieza a Contribuir', desc: 'Haz tu primer PR o comparte tus ideas' },
              ].map((step) => (
                <div key={step.step} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-light to-gold rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{step.step}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{step.title}</h4>
                    <p className="text-white/70 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-b from-dark-soft to-dark-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/20">
            <Lightbulb className="w-16 h-16 text-brand-light mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ¿Tienes una Idea de Proyecto?
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Compártela con la comunidad y construyámosla juntos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://discord.gg/ag5aPsNuPY"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-light to-brand text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-brand-light/50 transition-all duration-300 hover:scale-105"
              >
                <MessageCircle className="w-5 h-5" />
                Unirse a Discord
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function ProjectCard({
  project,
  getStatusColor,
  getStatusBg
}: {
  project: any
  getStatusColor: (status: string) => string
  getStatusBg: (status: string) => string
}) {
  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-brand-light/50 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{project.icon}</div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-brand-light transition-colors">
              {project.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBg(project.status)}`}>
                {project.status}
              </span>
              <span className="text-xs text-white/50">{project.quarter}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {project.progress > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/60">Progreso</span>
            <span className="text-white font-semibold">{project.progress}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getStatusColor(project.status)} rounded-full transition-all duration-500`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      <p className="text-white/70 text-sm mb-4">{project.description}</p>

      {/* Technologies */}
      <div className="mb-4">
        <p className="text-xs text-white/50 mb-2">Stack Tecnológico:</p>
        <div className="flex flex-wrap gap-2">
          {project.technologies.map((tech: string, i: number) => (
            <span key={i} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/70">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Community Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-brand-light/20 to-gold/20 border border-brand-light/30 rounded-full mb-4">
        <Users className="w-3 h-3 text-brand-light" />
        <span className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-gold">
          Impulsado por la comunidad
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-white/10">
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-medium transition-all"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        )}
        <a
          href={project.discord}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-light/10 hover:bg-brand-light/20 border border-brand-light/30 rounded-lg text-brand-light text-sm font-medium transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          Contribuir
        </a>
      </div>
    </div>
  )
}


