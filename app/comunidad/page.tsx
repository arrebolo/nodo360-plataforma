import { AppLayout } from '@/components/layout/AppLayout'
import { BenefitsGrid } from '@/components/benefits/BenefitsGrid'
import { COMUNIDAD_BENEFITS } from '@/lib/constants/comunidad-benefits'
import { MessageCircle, Users } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Comunidad Nodo360 - Conecta con Expertos en Bitcoin y Blockchain',
  description: 'Únete a más de 2,500+ estudiantes y profesionales en Discord y Telegram. Networking, soporte 24/7, eventos y recursos exclusivos.',
  openGraph: {
    title: 'Comunidad Nodo360',
    description: 'La comunidad más activa de Bitcoin y Blockchain en español',
  },
}

export default function ComunidadPage() {
  return (
    <AppLayout>
      {/* Hero + Benefits Grid */}
      <BenefitsGrid
        title="Únete a la Comunidad Nodo360"
        subtitle="Conecta con 2,500+ estudiantes y profesionales de Bitcoin y Blockchain de todo el mundo"
        benefits={COMUNIDAD_BENEFITS}
      />

      {/* CTA Section - Plataformas */}
      <section className="py-24 bg-nodo-bg border-t border-nodo-icon">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Únete Ahora
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Elige la plataforma que prefieras o únete a ambas
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Discord Card */}
            <div className="bg-nodo-card border border-nodo-icon rounded-2xl p-8 hover:border-bitcoin-orange/50 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#5865F2] rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Discord</h3>
                  <p className="text-[#5865F2] font-semibold">Comunidad Principal</p>
                </div>
              </div>

              <p className="text-slate-400 mb-6">
                Canales especializados, eventos semanales, soporte técnico y mucho más
              </p>

              <div className="space-y-3 mb-8">
                {[
                  'Chat en tiempo real',
                  'Canales por temas (Bitcoin, DeFi, NFTs, Desarrollo)',
                  'Eventos y AMAs con expertos',
                  'Networking profesional'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#5865F2]/20 border border-[#5865F2]/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-[#5865F2] rounded-full" />
                    </div>
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <a
                href="https://discord.gg/nodo360"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-center rounded-xl transition-all duration-300 hover:scale-105"
              >
                Unirse a Discord
              </a>
            </div>

            {/* Telegram Card */}
            <div className="bg-nodo-card border border-nodo-icon rounded-2xl p-8 hover:border-bitcoin-orange/50 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#0088cc] rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Telegram</h3>
                  <p className="text-[#0088cc] font-semibold">Grupo de Noticias</p>
                </div>
              </div>

              <p className="text-slate-400 mb-6">
                Actualizaciones rápidas, noticias del mercado, recursos compartidos
              </p>

              <div className="space-y-3 mb-8">
                {[
                  'Noticias en tiempo real',
                  'Análisis del mercado',
                  'Recursos compartidos',
                  'Alertas de nuevos cursos'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#0088cc]/20 border border-[#0088cc]/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 bg-[#0088cc] rounded-full" />
                    </div>
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <a
                href="https://t.me/nodo360"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-center rounded-xl transition-all duration-300 hover:scale-105"
              >
                Unirse a Telegram
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-nodo-icon">
            {[
              { icon: Users, label: 'Miembros activos', value: '2,500+' },
              { icon: MessageCircle, label: 'Conversaciones diarias', value: '100+' },
              { icon: '🌍', label: 'Países', value: '50+' },
              { icon: '⏰', label: 'Soporte', value: '24/7' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-bitcoin-orange/20 to-bitcoin-gold/20 border border-bitcoin-orange/30 rounded-2xl mb-4">
                  {typeof stat.icon === 'string' ? (
                    <span className="text-2xl">{stat.icon}</span>
                  ) : (
                    <stat.icon className="w-8 h-8 text-bitcoin-orange" />
                  )}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
