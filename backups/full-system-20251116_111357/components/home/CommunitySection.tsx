'use client'

import { MessageCircle, Send, Users, Zap } from 'lucide-react'
import { communityConfig } from '@/lib/community-config'

export function CommunitySection() {
  return (
    <section id="comunidad" className="py-24 bg-gradient-to-b from-[#1a1f2e] to-[#252b3d]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
            Únete a Nuestra <span className="text-[#ff6b35]">Comunidad</span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Conecta con 2,300+ estudiantes y profesionales de Bitcoin y Blockchain
          </p>
        </div>

        {/* Community Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Discord Card */}
          <a
            href={communityConfig.urls.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <div className="h-full bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:border-[#5865F2]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#5865F2]/20 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-[#5865F2]/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-8 h-8 text-[#5865F2]" />
                </div>
                <div className="px-3 py-1 bg-[#5865F2]/20 rounded-full text-[#5865F2] text-sm font-bold">
                  2.3k miembros
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">Comunidad Discord</h3>
              <p className="text-white/70 mb-6">
                Chat en tiempo real, canales especializados por tema, eventos semanales y networking directo con expertos.
              </p>

              <div className="inline-flex items-center gap-2 text-[#5865F2] font-semibold group-hover:gap-3 transition-all">
                Unirse a Discord
                <Send className="w-4 h-4" />
              </div>
            </div>
          </a>

          {/* Telegram Card */}
          <a
            href={communityConfig.urls.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <div className="h-full bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:border-[#0088cc]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#0088cc]/20 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-[#0088cc]/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Send className="w-8 h-8 text-[#0088cc]" />
                </div>
                <div className="px-3 py-1 bg-[#0088cc]/20 rounded-full text-[#0088cc] text-sm font-bold">
                  1.8k miembros
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">Grupo Telegram</h3>
              <p className="text-white/70 mb-6">
                Noticias en tiempo real, recursos compartidos, networking profesional y actualizaciones diarias del ecosistema.
              </p>

              <div className="inline-flex items-center gap-2 text-[#0088cc] font-semibold group-hover:gap-3 transition-all">
                Unirse a Telegram
                <Send className="w-4 h-4" />
              </div>
            </div>
          </a>
        </div>

        {/* Benefits */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            { icon: Zap, title: 'Soporte 24/7', desc: 'Ayuda de la comunidad en cualquier momento' },
            { icon: Users, title: 'Networking', desc: 'Conecta con profesionales del sector' },
            { icon: Send, title: 'Recursos Exclusivos', desc: 'Acceso a materiales y herramientas' },
            { icon: MessageCircle, title: 'Eventos en Vivo', desc: 'Webinars y sesiones Q&A semanales' }
          ].map((benefit, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <benefit.icon className="w-8 h-8 text-[#ff6b35] mx-auto mb-3" />
              <h4 className="font-semibold text-white mb-2">{benefit.title}</h4>
              <p className="text-sm text-white/60">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
