'use client'

import { Rocket, Calendar, TrendingUp, Users2, Code2, Trophy, CheckCircle2 } from 'lucide-react'

const projects = [
  {
    id: 1,
    title: 'DEX Educativo',
    description: 'Plataforma descentralizada de intercambio donde aprenderás a crear y gestionar tu propio exchange.',
    icon: TrendingUp,
    status: 'Próximamente',
    estimatedDate: 'Q1 2026',
    features: [
      'Creación de pools de liquidez',
      'Sistema de trading automatizado',
      'Integración con wallets Web3'
    ],
    color: 'from-[#ff6b35] to-[#f7931a]'
  },
  {
    id: 2,
    title: 'DAO de Gobernanza',
    description: 'Aprende a crear organizaciones autónomas descentralizadas con sistemas de votación on-chain.',
    icon: Users2,
    status: 'Próximamente',
    estimatedDate: 'Q2 2026',
    features: [
      'Sistema de propuestas y votación',
      'Gestión de tesorería comunitaria',
      'Tokenomics y distribución'
    ],
    color: 'from-[#FFD700] to-[#FFA500]'
  },
  {
    id: 3,
    title: 'NFT Marketplace',
    description: 'Construye tu propio marketplace de NFTs con funcionalidades avanzadas de minting y trading.',
    icon: Code2,
    status: 'Próximamente',
    estimatedDate: 'Q3 2026',
    features: [
      'Minting de colecciones NFT',
      'Sistema de subastas y ofertas',
      'Royalties automáticas'
    ],
    color: 'from-[#9333ea] to-[#c084fc]'
  },
  {
    id: 4,
    title: 'Hackathons Web3',
    description: 'Participa en hackathons mensuales con premios y networking con empresas del ecosistema.',
    icon: Trophy,
    status: 'Próximamente',
    estimatedDate: 'Q4 2025',
    features: [
      'Retos mensuales con premios',
      'Mentoría de expertos',
      'Oportunidades laborales'
    ],
    color: 'from-[#06b6d4] to-[#3b82f6]'
  }
]

export function ProjectsRoadmap() {
  return (
    <section id="proyectos" className="py-24 bg-gradient-to-b from-[#252b3d] to-[#1a1f2e] relative overflow-hidden">
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-[#ff6b35]/20 backdrop-blur-sm mb-4">
            <Rocket className="w-4 h-4 text-[#ff6b35]" />
            <span className="text-sm text-white/90">Roadmap 2025-2026</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
            Proyectos Prácticos <span className="text-[#ff6b35]">Próximamente</span>
          </h2>

          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Estamos desarrollando proyectos prácticos avanzados para llevarte del aprendizaje a la práctica profesional
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-6xl mx-auto">
          {/* Timeline line - hidden on mobile */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#ff6b35] via-[#FFD700] to-[#3b82f6]" />

          {/* Projects */}
          <div className="space-y-12">
            {projects.map((project, index) => {
              const Icon = project.icon
              const isEven = index % 2 === 0

              return (
                <div
                  key={project.id}
                  className={`relative grid lg:grid-cols-2 gap-8 items-center ${
                    isEven ? '' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${project.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`${isEven ? 'lg:pr-12 lg:text-right' : 'lg:pl-12 lg:col-start-2'}`}>
                    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-white/20 transition-all duration-300 hover:-translate-y-1 ${
                      isEven ? 'lg:ml-auto' : ''
                    }`}>
                      {/* Header */}
                      <div className={`flex items-start gap-4 mb-4 ${isEven ? 'lg:flex-row-reverse' : ''}`}>
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${project.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className={isEven ? 'lg:text-right' : ''}>
                          <h3 className="text-2xl font-bold text-white mb-2">{project.title}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="px-3 py-1 bg-[#ff6b35]/20 rounded-full text-[#ff6b35] font-medium">
                              {project.status}
                            </div>
                            <div className="flex items-center gap-1.5 text-white/60">
                              <Calendar className="w-4 h-4" />
                              <span>{project.estimatedDate}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-white/70 mb-4">
                        {project.description}
                      </p>

                      {/* Features */}
                      <div className="space-y-2">
                        {project.features.map((feature, i) => (
                          <div key={i} className={`flex items-center gap-2 text-sm text-white/60 ${isEven ? 'lg:flex-row-reverse' : ''}`}>
                            <CheckCircle2 className="w-4 h-4 text-[#ff6b35] flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Spacer for timeline */}
                  {isEven ? <div className="hidden lg:block" /> : null}
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center gap-4 px-8 py-6 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl backdrop-blur-sm">
            <p className="text-white/70">
              ¿Quieres ser el primero en enterarte cuando lancemos estos proyectos?
            </p>
            <a
              href="#comunidad"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all duration-300 hover:scale-105"
            >
              Únete a la Comunidad
              <Rocket className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
