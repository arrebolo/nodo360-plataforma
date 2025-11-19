'use client'

import { useState } from 'react'
import { GraduationCap, Video, MessageSquare, Target, CheckCircle2, Send, Loader2 } from 'lucide-react'

const services = [
  {
    icon: Video,
    title: 'Sesiones 1-on-1',
    description: 'Llamadas personalizadas para resolver dudas y acelerar tu aprendizaje',
    color: 'text-[#ff6b35]'
  },
  {
    icon: MessageSquare,
    title: 'Soporte Continuo',
    description: 'Acceso directo a mentores vía Discord para consultas rápidas',
    color: 'text-[#FFD700]'
  },
  {
    icon: Target,
    title: 'Plan Personalizado',
    description: 'Roadmap adaptado a tus objetivos y nivel de conocimiento',
    color: 'text-[#3b82f6]'
  },
  {
    icon: GraduationCap,
    title: 'Revisión de Proyectos',
    description: 'Feedback profesional en tus proyectos y código',
    color: 'text-[#9333ea]'
  }
]

const objectives = [
  'Aprender desarrollo Web3 desde cero',
  'Conseguir trabajo en blockchain',
  'Crear mi propio proyecto DeFi',
  'Entender Bitcoin a nivel técnico',
  'Preparación para certificaciones',
  'Otro (especificar en mensaje)'
]

export function MentorshipSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    objective: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/mentorship', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.name,
          email: formData.email,
          goal: formData.objective,
          message: formData.message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar solicitud')
      }

      setSubmitStatus('success')
      setFormData({ name: '', email: '', objective: '', message: '' })

      setTimeout(() => setSubmitStatus('idle'), 5000)
    } catch (error) {
      console.error('Error submitting mentorship request:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <section id="mentoria" className="py-24 bg-gradient-to-b from-[#1a1f2e] to-[#252b3d]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
            Mentoría <span className="text-[#ff6b35]">Personalizada</span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Acelera tu aprendizaje con mentores expertos en Bitcoin, Blockchain y Web3
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left Column: Services & Pricing */}
          <div className="space-y-8">
            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white mb-6">¿Qué incluye?</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {services.map((service, index) => {
                  const Icon = service.icon
                  return (
                    <div
                      key={index}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm hover:border-white/20 transition-all"
                    >
                      <Icon className={`w-8 h-8 ${service.color} mb-3`} />
                      <h4 className="font-semibold text-white mb-2">{service.title}</h4>
                      <p className="text-sm text-white/60">{service.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Plan de Mentoría</h3>
                  <p className="text-white/60">Sesiones mensuales + soporte ilimitado</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-white">€199</div>
                  <div className="text-sm text-white/50">/mes</div>
                </div>
              </div>

              <div className="space-y-3 mb-6 pt-6 border-t border-white/10">
                {[
                  '4 sesiones 1-on-1 mensuales (60 min)',
                  'Soporte ilimitado vía Discord',
                  'Revisión de código y proyectos',
                  'Roadmap personalizado',
                  'Acceso a comunidad Premium',
                  'Recursos exclusivos'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/80">
                    <CheckCircle2 className="w-5 h-5 text-[#ff6b35] flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="text-center p-4 bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-xl">
                <p className="text-sm text-white/90">
                  <span className="font-semibold text-[#ff6b35]">Oferta de lanzamiento:</span> Primeros 10 estudiantes obtienen 50% descuento
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-6">Solicita Información</h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35]/50 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
                  placeholder="Tu nombre"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35]/50 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
                  placeholder="tu@email.com"
                />
              </div>

              {/* Objective */}
              <div>
                <label htmlFor="objective" className="block text-sm font-medium text-white/80 mb-2">
                  Objetivo principal *
                </label>
                <select
                  id="objective"
                  name="objective"
                  value={formData.objective}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b35]/50 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#1a1f2e]">Selecciona tu objetivo</option>
                  {objectives.map((obj, i) => (
                    <option key={i} value={obj} className="bg-[#1a1f2e]">
                      {obj}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white/80 mb-2">
                  Cuéntanos más sobre tus objetivos
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35]/50 focus:ring-2 focus:ring-[#ff6b35]/20 transition-all resize-none"
                  placeholder="Describe tu experiencia actual, expectativas y cualquier pregunta específica..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Solicitar Información
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center">
                  ¡Gracias! Te contactaremos pronto para agendar una sesión de orientación gratuita.
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                  Hubo un error. Por favor, intenta de nuevo o contáctanos directamente.
                </div>
              )}
            </form>

            <p className="mt-6 text-xs text-white/50 text-center">
              Al enviar este formulario, aceptas que te contactemos para brindarte información sobre nuestros programas de mentoría.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
