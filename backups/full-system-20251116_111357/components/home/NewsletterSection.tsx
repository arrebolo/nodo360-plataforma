'use client'

import { useState } from 'react'
import { Mail, Gift, Zap, Check, Loader2 } from 'lucide-react'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al suscribirse')
      }

      setSuccess(true)
      setEmail('')
      setName('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-b from-[#1a1f2e] to-[#252b3d]">
      {/* Fondo con gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35] via-[#ff8c5a] to-[#FFD700] opacity-5" />

      {/* Efectos de glow */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#ff6b35] rounded-full blur-3xl opacity-20 -translate-y-1/2 animate-pulse" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[#FFD700] rounded-full blur-3xl opacity-20 -translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#1a1f2e]/90 to-[#252b3d]/90 rounded-3xl p-8 md:p-12 lg:p-16 border border-white/10 shadow-2xl backdrop-blur-sm hover:border-white/20 transition-all duration-500">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Columna Izquierda - Contenido */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-full mb-2">
                <Gift className="w-4 h-4 text-[#ff6b35]" />
                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b35] to-[#FFD700]">
                  ¡SUSCRIPCIÓN GRATUITA!
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Mantente al Día con{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b35] via-[#ff8c5a] to-[#FFD700] animate-gradient">
                  Bitcoin y Blockchain
                </span>
              </h2>

              <p className="text-lg md:text-xl text-white/80">
                Recibe las últimas actualizaciones, cursos nuevos y contenido exclusivo directamente en tu inbox.
              </p>

              {/* Beneficios */}
              <div className="space-y-3 pt-4">
                {[
                  'Acceso anticipado a nuevos cursos',
                  'Guías exclusivas y recursos descargables',
                  'Análisis semanal del mercado crypto',
                  'Invitaciones a webinars en vivo',
                  'Descuentos especiales en cursos premium'
                ].map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 opacity-0 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
                  >
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#ff6b35]/30 to-[#FFD700]/30 border border-[#ff6b35]/50 flex items-center justify-center">
                      <Check className="w-4 h-4 text-[#ff6b35]" />
                    </div>
                    <p className="text-white/80 leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#FFD700] border-2 border-[#1a1f2e] flex items-center justify-center text-white font-bold text-sm"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-white/60">
                  Únete a más de <span className="font-semibold text-white">2,300+ estudiantes</span> que ya reciben nuestro newsletter
                </p>
              </div>
            </div>

            {/* Columna Derecha - Formulario */}
            <div>
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/20 shadow-2xl shadow-[#ff6b35]/10 hover:shadow-[#ff6b35]/20 transition-all duration-500">
                {success ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                      <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                      ¡Suscripción Exitosa!
                    </h3>
                    <p className="text-white/70 mb-6">
                      Revisa tu email para confirmar tu suscripción y empezar a recibir contenido exclusivo.
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="text-[#ff6b35] hover:text-[#ff8c5a] transition-colors font-semibold"
                    >
                      Suscribir otro email →
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b35] to-[#FFD700] rounded-xl flex items-center justify-center shadow-lg shadow-[#ff6b35]/50">
                        <Mail className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-white">
                          Suscríbete Ahora
                        </h3>
                        <p className="text-sm text-white/60">
                          Gratis · Cancela cuando quieras
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Nombre (opcional)
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Tu nombre"
                          className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/50 focus:bg-white/[0.15] transition-all duration-300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Email <span className="text-[#ff6b35]">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          required
                          className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/50 focus:bg-white/[0.15] transition-all duration-300"
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
                            <span>Suscribiendo...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            <span>Suscribirme Gratis</span>
                          </>
                        )}
                      </button>

                      <p className="text-xs text-center text-white/50 leading-relaxed">
                        Al suscribirte, aceptas recibir emails de Nodo360. Puedes cancelar en cualquier momento. Sin spam garantizado.
                      </p>
                    </form>
                  </>
                )}
              </div>

              {/* Trust badges */}
              <div className="mt-6 flex items-center justify-center gap-6 text-white/50 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#ff6b35]" />
                  <span>Sin spam</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#ff6b35]" />
                  <span>100% gratis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#ff6b35]" />
                  <span>Cancela cuando quieras</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  )
}
