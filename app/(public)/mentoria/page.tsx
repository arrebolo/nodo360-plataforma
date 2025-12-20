'use client'

import { useState } from 'react'
import { Users, Video, Code, Briefcase, Shield, MessageCircle, Star, CheckCircle2, Calendar, Target, TrendingUp, Award, BookOpen, Loader2 } from 'lucide-react'
import { Metadata } from 'next'

export default function MentoriaPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    goal: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.name,
          email: formData.email,
          goal: formData.goal,
          message: formData.message
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar solicitud')
      }

      setSuccess(true)
      setFormData({ name: '', email: '', goal: '', message: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#1a1f2e]">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-b from-[#1a1f2e] to-[#252b3d]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/10 to-[#FFD700]/10" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#ff6b35] rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#FFD700] rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-full mb-8">
            <Users className="w-4 h-4 text-[#ff6b35]" />
            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b35] to-[#FFD700]">
              MENTORÍA PERSONALIZADA
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            Mentoría{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b35] to-[#FFD700]">
              1-on-1
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-12">
            Acelera tu carrera en Bitcoin y Blockchain con expertos que te guiarán paso a paso
          </p>

          <a
            href="#solicitar"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all duration-300 hover:scale-105"
          >
            <Calendar className="w-5 h-5" />
            Solicitar Mentoría
          </a>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-[#252b3d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Beneficios de la Mentoría
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Todo lo que obtienes con nuestro programa de mentoría
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Plan Personalizado', desc: 'Diseñamos un plan de estudio adaptado a tus objetivos' },
              { icon: Video, title: 'Sesiones 1-on-1', desc: 'Videollamadas individuales con tu mentor' },
              { icon: Code, title: 'Revisión de Código', desc: 'Feedback detallado en tus proyectos' },
              { icon: Briefcase, title: 'Preparación Laboral', desc: 'Simula entrevistas y optimiza tu CV' },
              { icon: Users, title: 'Networking', desc: 'Conexiones con profesionales de la industria' },
              { icon: MessageCircle, title: 'Soporte Continuo', desc: 'Chat directo con tu mentor entre sesiones' },
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

      {/* How it Works Timeline */}
      <section className="py-24 bg-gradient-to-b from-[#252b3d] to-[#1a1f2e]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Cómo Funciona
            </h2>
            <p className="text-xl text-white/70">
              El proceso de mentoría paso a paso
            </p>
          </div>

          <div className="space-y-6">
            {[
              { step: 1, title: 'Solicitud', desc: 'Rellenas el formulario con tus objetivos y experiencia', icon: BookOpen },
              { step: 2, title: 'Evaluación', desc: 'Revisamos tu perfil y definimos el mejor mentor para ti', icon: Target },
              { step: 3, title: 'Matching', desc: 'Te asignamos un mentor experto en tu área de interés', icon: Users },
              { step: 4, title: 'Primera Sesión', desc: 'Conoces a tu mentor y definen objetivos claros', icon: Video },
              { step: 5, title: 'Seguimiento', desc: 'Sesiones regulares con progreso medible', icon: TrendingUp },
            ].map((item) => (
              <div key={item.step} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#ff6b35] to-[#FFD700] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-[#ff6b35]">Paso {item.step}</span>
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-white/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-24 bg-[#1a1f2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Planes y Precios
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Sesión Única */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Sesión Única</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-white">€99</span>
                </div>
                <p className="text-white/60 mt-2">Pago único</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  '1 hora de consultoría',
                  'Revisión de CV/LinkedIn',
                  'Plan de acción personalizado',
                  'Grabación de la sesión',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#ff6b35] flex-shrink-0" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#solicitar"
                className="block w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-center rounded-xl transition-all duration-300"
              >
                Agendar Sesión
              </a>
            </div>

            {/* Paquete Mensual - Popular */}
            <div className="bg-gradient-to-br from-[#ff6b35]/20 to-[#FFD700]/20 backdrop-blur-xl rounded-2xl p-8 border-2 border-[#ff6b35] relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#ff6b35] to-[#FFD700] rounded-full">
                <span className="text-sm font-bold text-white">MÁS POPULAR</span>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Paquete Mensual</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-white">€349</span>
                </div>
                <p className="text-white/60 mt-2">€87 por sesión</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  '4 sesiones (1 por semana)',
                  'Acceso a recursos premium',
                  'Chat directo con mentor',
                  'Revisión de proyectos',
                  'Grabación de sesiones',
                  'Certificado de progreso',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#ff6b35] flex-shrink-0" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#solicitar"
                className="block w-full py-4 bg-gradient-to-r from-[#ff6b35] to-[#FFD700] text-white font-bold text-center rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#ff6b35]/50"
              >
                Empezar Ahora
              </a>
            </div>

            {/* Programa Trimestral */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Programa Trimestral</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-white">€899</span>
                </div>
                <p className="text-white/60 mt-2">€75 por sesión</p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  '12 sesiones (1 por semana)',
                  'Todo lo del plan mensual',
                  'Certificado de completación',
                  'Networking con empresas',
                  'Garantía de progreso',
                  'Soporte prioritario',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#ff6b35] flex-shrink-0" />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#solicitar"
                className="block w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-center rounded-xl transition-all duration-300"
              >
                Máximo Ahorro
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Mentorship Areas */}
      <section className="py-24 bg-gradient-to-b from-[#1a1f2e] to-[#252b3d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Áreas de Mentoría
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Encuentra el mentor perfecto para tu especialización
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Desarrollo Blockchain', desc: 'Smart contracts, dApps, Solidity, Web3.js', icon: Code },
              { title: 'Trading y Análisis', desc: 'Technical analysis, DeFi, estrategias de trading', icon: TrendingUp },
              { title: 'Carrera en Crypto', desc: 'Preparación para entrevistas, CV, networking', icon: Briefcase },
              { title: 'Emprendimiento Web3', desc: 'Lanzar proyectos, tokenomics, fundraising', icon: Target },
              { title: 'Seguridad y Auditoría', desc: 'Smart contract audits, security best practices', icon: Shield },
              { title: 'Bitcoin Core', desc: 'Lightning Network, Bitcoin script, node operation', icon: '₿' },
            ].map((area, i) => (
              <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-[#ff6b35]/50 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-xl flex items-center justify-center mb-4">
                  {typeof area.icon === 'string' ? (
                    <span className="text-2xl">{area.icon}</span>
                  ) : (
                    <area.icon className="w-7 h-7 text-[#ff6b35]" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{area.title}</h3>
                <p className="text-white/70 text-sm">{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-[#252b3d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Historias de Éxito
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Lo que dicen nuestros estudiantes sobre la mentoría
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: 'Ana Martínez',
                role: 'Smart Contract Developer en Aave',
                quote: 'Gracias a la mentoría conseguí mi primer trabajo en DeFi. Mi mentor me ayudó con la preparación técnica y las entrevistas. Totalmente recomendado.',
                rating: 5,
                result: 'Job en Aave'
              },
              {
                name: 'Luis Rodríguez',
                role: 'Blockchain Developer',
                quote: 'El programa trimestral fue una inversión que cambió mi carrera. Pasé de no saber nada de Solidity a lanzar mi primer dApp en 3 meses.',
                rating: 5,
                result: 'Lanzó su dApp'
              },
              {
                name: 'Carmen Silva',
                role: 'Crypto Trader',
                quote: 'Mi mentor me enseñó estrategias de trading que realmente funcionan. He mejorado mis resultados y entiendo el mercado mucho mejor.',
                rating: 5,
                result: '+150% ROI'
              },
              {
                name: 'Miguel Torres',
                role: 'Auditor de Smart Contracts',
                quote: 'La revisión de código personalizada me ayudó a identificar errores que cometía constantemente. Ahora escribo contratos mucho más seguros.',
                rating: 5,
                result: 'Auditor certificado'
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#ff6b35] to-[#FFD700] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {testimonial.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-white">{testimonial.name}</div>
                      <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                        <span className="text-xs font-bold text-green-400">{testimonial.result}</span>
                      </div>
                    </div>
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

      {/* FAQ */}
      <section className="py-24 bg-gradient-to-b from-[#252b3d] to-[#1a1f2e]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-xl text-white/70">
              Todo lo que necesitas saber sobre la mentoría
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: '¿Cómo se elige mi mentor?',
                a: 'Revisamos tu perfil, objetivos y experiencia para asignarte el mentor más adecuado según tu especialización y necesidades.'
              },
              {
                q: '¿Qué pasa si no me gusta mi mentor?',
                a: 'Puedes solicitar un cambio de mentor en cualquier momento sin costo adicional. Tu satisfacción es nuestra prioridad.'
              },
              {
                q: '¿Puedo cancelar o pausar mi plan?',
                a: 'Sí, puedes pausar tu plan por un mes o cancelarlo. Los paquetes mensuales y trimestrales son flexibles.'
              },
              {
                q: '¿Las sesiones quedan grabadas?',
                a: 'Sí, todas las sesiones se graban y quedan disponibles para ti durante 6 meses.'
              },
              {
                q: '¿Hay garantía de resultados?',
                a: 'En el programa trimestral garantizamos progreso medible. Si no avanzas según lo planificado, extendemos el programa sin costo.'
              },
              {
                q: '¿Qué experiencia tienen los mentores?',
                a: 'Todos nuestros mentores tienen al menos 3 años de experiencia profesional en la industria crypto y han pasado por un proceso riguroso de selección.'
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

      {/* Application Form */}
      <section id="solicitar" className="py-24 bg-[#1a1f2e]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Solicita tu Mentoría
            </h2>
            <p className="text-xl text-white/70">
              Completa el formulario y nos pondremos en contacto contigo
            </p>
          </div>

          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
            {success ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">¡Solicitud Recibida!</h3>
                <p className="text-white/70 mb-6">
                  Revisaremos tu perfil y nos pondremos en contacto en menos de 24 horas.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-[#ff6b35] hover:text-[#ff8c5a] transition-colors font-semibold"
                >
                  Enviar otra solicitud →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Nombre completo <span className="text-[#ff6b35]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/50 transition-all duration-300"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Email <span className="text-[#ff6b35]">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/50 transition-all duration-300"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    ¿Qué objetivo quieres lograr? <span className="text-[#ff6b35]">*</span>
                  </label>
                  <select
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    required
                    className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/50 transition-all duration-300"
                  >
                    <option value="" className="bg-[#1a1f2e]">Selecciona una opción</option>
                    <option value="Conseguir trabajo en crypto" className="bg-[#1a1f2e]">Conseguir trabajo en crypto</option>
                    <option value="Aprender desarrollo blockchain" className="bg-[#1a1f2e]">Aprender desarrollo blockchain</option>
                    <option value="Mejorar mis skills de trading" className="bg-[#1a1f2e]">Mejorar mis skills de trading</option>
                    <option value="Lanzar mi proyecto Web3" className="bg-[#1a1f2e]">Lanzar mi proyecto Web3</option>
                    <option value="Preparación para auditorías" className="bg-[#1a1f2e]">Preparación para auditorías</option>
                    <option value="Otro" className="bg-[#1a1f2e]">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Cuéntanos más sobre tu experiencia y objetivos (opcional)
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/50 transition-all duration-300 resize-none"
                    placeholder="Cuéntanos sobre tu nivel actual, qué has estudiado, y qué esperas lograr con la mentoría..."
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full py-4 bg-gradient-to-r from-[#ff6b35] to-[#ff8c5a] hover:from-[#ff8c5a] hover:to-[#FFD700] text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#ff6b35]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5" />
                      <span>Solicitar Mentoría</span>
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-white/50 leading-relaxed">
                  Al enviar el formulario, aceptas que nos pongamos en contacto contigo para coordinar tu mentoría.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
