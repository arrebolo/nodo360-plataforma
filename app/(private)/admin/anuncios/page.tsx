'use client'

import { useState } from 'react'
import { Megaphone, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AnunciosPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const [channels, setChannels] = useState({
    inApp: true,
    discord: true,
    telegram: true,
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          link: link || undefined,
          channels,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({ success: true, message: 'Anuncio enviado correctamente' })
        setTitle('')
        setMessage('')
        setLink('')
      } else {
        setResult({ success: false, message: data.error || 'Error al enviar' })
      }
    } catch {
      setResult({ success: false, message: 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  const toggleChannel = (channel: keyof typeof channels) => {
    setChannels(prev => ({ ...prev, [channel]: !prev[channel] }))
  }

  return (
    <div className="min-h-screen bg-dark-base p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-brand-orange/20 rounded-xl">
            <Megaphone className="w-6 h-6 text-brand-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Panel de Anuncios</h1>
            <p className="text-gray-400">Envía anuncios a todos los usuarios</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-5">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ej: Nueva funcionalidad disponible"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/50 transition-colors"
              />
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Mensaje *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder="Escribe el contenido del anuncio..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/50 transition-colors resize-none"
              />
            </div>

            {/* Link opcional */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Link (opcional)
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://nodo360.com/..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-brand-orange/50 focus:ring-1 focus:ring-brand-orange/50 transition-colors"
              />
            </div>

            {/* Canales */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">
                Canales de envío
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'inApp', label: 'In-app', icon: '🔔' },
                  { key: 'discord', label: 'Discord', icon: '💬' },
                  { key: 'telegram', label: 'Telegram', icon: '✈️' },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleChannel(key as keyof typeof channels)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                      channels[key as keyof typeof channels]
                        ? 'bg-brand-orange/20 border-brand-orange/50 text-white'
                        : 'bg-white/5 border-white/10 text-white/50'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                    {channels[key as keyof typeof channels] && (
                      <CheckCircle className="w-4 h-4 text-brand-orange" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resultado */}
          {result && (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${
              result.success
                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                : 'bg-red-500/20 border border-red-500/30 text-red-400'
            }`}>
              {result.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          {/* Botón enviar */}
          <button
            type="submit"
            disabled={loading || !title || !message}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-brand-orange hover:bg-brand-orange/90 disabled:bg-white/10 disabled:text-white/40 text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar anuncio
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
