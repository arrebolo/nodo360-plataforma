'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, User, Mail, Save, Loader2, CheckCircle } from 'lucide-react'

export default function MiPerfilPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setEmail(user.email || '')

      // Obtener datos adicionales de la tabla users
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, bio')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        setFullName(profile.full_name || '')
        setBio(profile.bio || '')
      }

      setLoading(false)
    }

    loadProfile()
  }, [router, supabase])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          bio: bio
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a10]">
        <div className="mx-auto w-full max-w-2xl px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white/40" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070a10]">
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#f7931a]/20 flex items-center justify-center">
              <User className="w-6 h-6 text-[#f7931a]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Mi Perfil</h1>
              <p className="text-white/60 mt-1">Actualiza tu informacion personal</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          {/* Avatar placeholder */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {fullName ? fullName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-white font-medium">{fullName || 'Usuario'}</div>
              <div className="text-sm text-white/50">{email}</div>
            </div>
          </div>

          {/* Email (readonly) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/60 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
            />
            <p className="text-xs text-white/40 mt-1">El email no se puede cambiar</p>
          </div>

          {/* Nombre completo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/60 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#f7931a]/50 transition"
            />
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/60 mb-2">
              Bio / Descripcion
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuentanos sobre ti..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#f7931a]/50 transition resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Success */}
          {saved && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2 mb-6">
              <CheckCircle className="w-4 h-4" />
              Perfil actualizado correctamente
            </div>
          )}

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar cambios
              </>
            )}
          </Button>
        </Card>
      </div>
    </div>
  )
}
