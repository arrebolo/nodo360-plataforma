'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface ProfileFormData {
  id: string
  email: string
  full_name: string
  avatar_url: string
  bio: string
  website: string
  twitter: string
  linkedin: string
  github: string
}

interface ProfileFormProps {
  initialData: ProfileFormData
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter()

  const [form, setForm] = useState<ProfileFormData>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: form.full_name,
          avatar_url: form.avatar_url,
          bio: form.bio,
          website: form.website,
          twitter: form.twitter,
          linkedin: form.linkedin,
          github: form.github,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al guardar el perfil')
      }

      setSuccess(true)
      router.refresh() // recarga los datos del server component
    } catch (err: any) {
      console.error('[ProfileForm] Error al guardar:', err)
      setError(err.message || 'Error al guardar el perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-6"
    >
      <div>
        <h2 className="text-xl font-semibold text-white">Información personal</h2>
        <p className="text-sm text-gray-400 mt-1">
          Actualiza tu nombre, biografía y enlaces.
        </p>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/40 rounded-lg px-3 py-2">
          Perfil actualizado correctamente.
        </div>
      )}

      {/* Email (solo lectura) */}
      <div className="space-y-1">
        <label className="text-sm text-gray-300">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          disabled
          className="w-full rounded-lg bg-gray-900/60 border border-gray-700 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
        />
      </div>

      {/* Nombre completo */}
      <div className="space-y-1">
        <label className="text-sm text-gray-300">Nombre completo</label>
        <input
          type="text"
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a]/60"
          placeholder="Tu nombre"
        />
      </div>

      {/* Avatar URL */}
      <div className="space-y-1">
        <label className="text-sm text-gray-300">URL del avatar</label>
        <input
          type="url"
          name="avatar_url"
          value={form.avatar_url}
          onChange={handleChange}
          className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a]/60"
          placeholder="https://..."
        />
      </div>

      {/* Bio */}
      <div className="space-y-1">
        <label className="text-sm text-gray-300">Biografía</label>
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a]/60 resize-none"
          placeholder="Cuenta brevemente quién eres y qué te interesa de Bitcoin / Web3..."
        />
      </div>

      {/* Web y redes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Web personal</label>
          <input
            type="url"
            name="website"
            value={form.website}
            onChange={handleChange}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a]/60"
            placeholder="https://tusitio.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">Twitter / X</label>
          <input
            type="text"
            name="twitter"
            value={form.twitter}
            onChange={handleChange}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a]/60"
            placeholder="@tuusuario"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">LinkedIn</label>
          <input
            type="text"
            name="linkedin"
            value={form.linkedin}
            onChange={handleChange}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a]/60"
            placeholder="URL o usuario de LinkedIn"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">GitHub</label>
          <input
            type="text"
            name="github"
            value={form.github}
            onChange={handleChange}
            className="w-full rounded-lg bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f7931a]/60"
            placeholder="usuario o URL de GitHub"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
