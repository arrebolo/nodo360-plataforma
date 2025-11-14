import { MessageCircle, Users, Globe, Clock, Gift, Briefcase, BookOpen, Video, Star, Shield } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Comunidad Nodo360 - Conecta con Expertos en Bitcoin y Blockchain',
  description: 'Únete a más de 2,300+ estudiantes y profesionales en Discord y Telegram. Networking, soporte 24/7, eventos y recursos exclusivos.',
  openGraph: {
    title: 'Comunidad Nodo360',
    description: 'La comunidad más activa de Bitcoin y Blockchain en español',
  },
}

export default function ComunidadPage() {
  return (
    <main className="min-h-screen bg-[#1a1f2e]">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-b from-[#1a1f2e] to-[#252b3d]">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/10 to-[#FFD700]/10" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#ff6b35] rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#FFD700] rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-full mb-8">
            <Users className="w-4 h-4 text-[#ff6b35]" />
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b35] to-[#FFD700]">
              2,300+ MIEMBROS ACTIVOS
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            Únete a la Comunidad{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b35] to-[#FFD700]">
              Nodo360
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-12">
            Conecta con 2,300+ estudiantes y profesionales de Bitcoin y Blockchain de todo el mundo
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a
              href="https://discord.gg/nodo360"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#5865F2]/50"
            >
              <MessageCircle className="w-6 h-6" />
              Unirse a Discord
            </a>
            <a
              href="https://t.me/nodo360"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#0088cc]/50"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
              Unirse a Telegram
            </a>
          </div>

          {/* Community illustration placeholder */}
          <div className="relative max-w-4xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center">
              <Users className="w-32 h-32 text-white/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#252b3d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, label: 'Miembros activos', value: '2,300+' },
              { icon: Globe, label: 'Países representados', value: '50+' },
              { icon: MessageCircle, label: 'Conversaciones diarias', value: '100+' },
              { icon: Clock, label: 'Soporte comunitario', value: '24/7' },
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

      {/* Platforms Section */}
      <section className="py-24 bg-gradient-to-b from-[#252b3d] to-[#1a1f2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Plataformas de Comunidad
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Elige la plataforma que prefieras o únete a ambas
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Discord Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:border-[#5865F2]/50 transition-all duration-300 hover:scale-105">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#5865F2] rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Discord</h3>
                    <p className="text-[#5865F2] font-semibold">Comunidad Principal</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-[#5865F2]/20 border border-[#5865F2]/30 rounded-full">
                  <span className="text-sm font-bold text-[#5865F2]">2.3k miembros</span>
                </div>
              </div>

              <p className="text-white/70 mb-6">
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
                    <span className="text-white/80">{feature}</span>
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
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:border-[#0088cc]/50 transition-all duration-300 hover:scale-105">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
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
                <div className="px-3 py-1 bg-[#0088cc]/20 border border-[#0088cc]/30 rounded-full">
                  <span className="text-sm font-bold text-[#0088cc]">1.8k miembros</span>
                </div>
              </div>

              <p className="text-white/70 mb-6">
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
                    <span className="text-white/80">{feature}</span>
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
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-[#1a1f2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Beneficios de la Comunidad
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Todo lo que obtienes al unirte a Nodo360
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Networking Profesional', desc: 'Conecta con expertos y estudiantes de todo el mundo' },
              { icon: Clock, title: 'Soporte 24/7', desc: 'Ayuda técnica disponible en cualquier momento' },
              { icon: Gift, title: 'Recursos Exclusivos', desc: 'Acceso a guías, plantillas y herramientas' },
              { icon: Video, title: 'Eventos y Webinars', desc: 'AMAs, workshops y charlas con expertos' },
              { icon: Briefcase, title: 'Oportunidades Laborales', desc: 'Ofertas de trabajo y proyectos freelance' },
              { icon: BookOpen, title: 'Colaboración en Proyectos', desc: 'Participa en proyectos comunitarios' },
            ].map((benefit, i) => (
              <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-[#ff6b35]/50 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-7 h-7 text-[#ff6b35]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-white/70">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-b from-[#1a1f2e] to-[#252b3d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Lo Que Dicen Nuestros Miembros
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Testimonios reales de la comunidad
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: 'Carlos Méndez',
                role: 'Desarrollador Blockchain',
                quote: 'La comunidad de Nodo360 me ayudó a conseguir mi primer trabajo en crypto. El networking es increíble.',
                rating: 5
              },
              {
                name: 'María González',
                role: 'Estudiante de Bitcoin',
                quote: 'El soporte 24/7 es invaluable. Siempre hay alguien dispuesto a ayudar con cualquier duda.',
                rating: 5
              },
              {
                name: 'Diego Torres',
                role: 'Trader Crypto',
                quote: 'Los análisis de mercado y noticias en tiempo real me mantienen siempre actualizado.',
                rating: 5
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b35] to-[#FFD700] rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-white">{testimonial.name}</div>
                    <div className="text-sm text-white/60">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-white/80 mb-4 italic">"{testimonial.quote}"</p>
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Rules Section */}
      <section className="py-24 bg-[#252b3d]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-2xl mb-6">
              <Shield className="w-8 h-8 text-[#ff6b35]" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Reglas de la Comunidad
            </h2>
            <p className="text-xl text-white/70">
              Para mantener un ambiente positivo y productivo
            </p>
          </div>

          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
            <div className="space-y-4">
              {[
                { title: 'Respeto Mutuo', desc: 'Trata a todos con respeto y profesionalismo' },
                { title: 'No Spam', desc: 'Prohibido el spam, publicidad no autorizada o contenido irrelevante' },
                { title: 'Ayuda Constructiva', desc: 'Ofrece ayuda de manera constructiva y paciente' },
                { title: 'Contenido Relevante', desc: 'Mantén las conversaciones relacionadas con Bitcoin y Blockchain' },
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[#ff6b35] font-bold">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">{rule.title}</h3>
                    <p className="text-white/70 text-sm">{rule.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gradient-to-b from-[#252b3d] to-[#1a1f2e]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-xl text-white/70">
              Todo lo que necesitas saber sobre la comunidad
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: '¿Es gratis unirse a la comunidad?',
                a: 'Sí, tanto Discord como Telegram son completamente gratuitos. Solo necesitas crear una cuenta en la plataforma que prefieras.'
              },
              {
                q: '¿Puedo unirme si soy principiante?',
                a: 'Por supuesto. Tenemos miembros de todos los niveles, desde principiantes hasta expertos. Hay canales específicos para cada nivel.'
              },
              {
                q: '¿En qué idioma es la comunidad?',
                a: 'La comunidad principal es en español, pero también hay canales en inglés y otros idiomas.'
              },
              {
                q: '¿Hay moderadores?',
                a: 'Sí, contamos con un equipo de moderadores activos que mantienen la comunidad segura y productiva.'
              },
              {
                q: '¿Puedo promocionar mis proyectos?',
                a: 'Hay canales específicos para compartir proyectos. Consulta las reglas antes de publicar.'
              },
            ].map((faq, i) => (
              <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-[#ff6b35]/30 transition-all duration-300">
                <h3 className="font-bold text-white text-lg mb-2">{faq.q}</h3>
                <p className="text-white/70">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-[#1a1f2e]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ¿Listo para Unirte?
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Forma parte de la comunidad más activa de Bitcoin y Blockchain en español
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://discord.gg/nodo360"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105"
              >
                <MessageCircle className="w-6 h-6" />
                Unirse a Discord
              </a>
              <a
                href="https://t.me/nodo360"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-105"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
                Unirse a Telegram
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
