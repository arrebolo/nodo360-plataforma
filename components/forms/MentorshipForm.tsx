'use client'

import { useState } from 'react'
import { Calendar, Loader2, CheckCircle2 } from 'lucide-react'

export function MentorshipForm() {
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
    <section id="solicitar" className="py-24 bg-nodo-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Solicita tu Mentoría
          </h2>
          <p className="text-xl text-slate-400">
            Completa el formulario y nos pondremos en contacto contigo
          </p>
        </div>

        <div className="bg-nodo-card border border-nodo-icon rounded-2xl p-8">
          {success ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">¡Solicitud Recibida!</h3>
              <p className="text-slate-400 mb-6">
                Revisaremos tu perfil y nos pondremos en contacto en menos de 24 horas.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-bitcoin-orange hover:text-bitcoin-gold transition-colors font-semibold"
              >
                Enviar otra solicitud →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nombre completo <span className="text-bitcoin-orange">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3.5 bg-nodo-bg border border-nodo-icon rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-bitcoin-orange focus:ring-2 focus:ring-bitcoin-orange/50 transition-all duration-300"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email <span className="text-bitcoin-orange">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3.5 bg-nodo-bg border border-nodo-icon rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-bitcoin-orange focus:ring-2 focus:ring-bitcoin-orange/50 transition-all duration-300"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  ¿Qué objetivo quieres lograr? <span className="text-bitcoin-orange">*</span>
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  required
                  className="w-full px-4 py-3.5 bg-nodo-bg border border-nodo-icon rounded-xl text-white focus:outline-none focus:border-bitcoin-orange focus:ring-2 focus:ring-bitcoin-orange/50 transition-all duration-300"
                >
                  <option value="" className="bg-nodo-bg">Selecciona una opción</option>
                  <option value="Conseguir trabajo en crypto" className="bg-nodo-bg">Conseguir trabajo en crypto</option>
                  <option value="Aprender desarrollo blockchain" className="bg-nodo-bg">Aprender desarrollo blockchain</option>
                  <option value="Mejorar mis skills de trading" className="bg-nodo-bg">Mejorar mis skills de trading</option>
                  <option value="Lanzar mi proyecto Web3" className="bg-nodo-bg">Lanzar mi proyecto Web3</option>
                  <option value="Preparación para auditorías" className="bg-nodo-bg">Preparación para auditorías</option>
                  <option value="Otro" className="bg-nodo-bg">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Cuéntanos más sobre tu experiencia y objetivos (opcional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3.5 bg-nodo-bg border border-nodo-icon rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-bitcoin-orange focus:ring-2 focus:ring-bitcoin-orange/50 transition-all duration-300 resize-none"
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
                className="w-full py-4 bg-gradient-to-r from-bitcoin-orange to-bitcoin-gold hover:shadow-2xl hover:shadow-bitcoin-orange/50 text-white font-bold text-lg rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
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

              <p className="text-xs text-center text-slate-500 leading-relaxed">
                Al enviar el formulario, aceptas que nos pongamos en contacto contigo para coordinar tu mentoría.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
