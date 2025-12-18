// app/(private)/dashboard/formador/perfil/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Specialty {
  id: string
  name: string
  icon: string
}

interface EducatorSpecialty {
  specialty: Specialty | null
}

interface Educator {
  id: string
  type: string
  display_name: string
  slug: string
  tagline: string | null
  bio: string | null
  hourly_rate_credits: number | null
  offers_free_intro: boolean
  free_intro_minutes: number | null
  social_links: {
    twitter?: string
    linkedin?: string
    website?: string
  } | null
  specialties: EducatorSpecialty[]
}

export default function EditarPerfilFormadorPage() {
  const supabase = createClient()
  const router = useRouter()

  const [educator, setEducator] = useState<Educator | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Form
  const [displayName, setDisplayName] = useState('')
  const [tagline, setTagline] = useState('')
  const [bio, setBio] = useState('')
  const [hourlyRate, setHourlyRate] = useState(0)
  const [offersFreeIntro, setOffersFreeIntro] = useState(true)
  const [freeIntroMinutes, setFreeIntroMinutes] = useState(10)
  const [socialLinks, setSocialLinks] = useState({
    twitter: '',
    linkedin: '',
    website: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Obtener educador
    const { data: educatorData } = await supabase
      .from('educators')
      .select(`
        *,
        specialties:educator_specialties (
          specialty:specialty_id (id, name, icon)
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (!educatorData) {
      router.push('/dashboard/ser-formador')
      return
    }

    const typedEducator = educatorData as Educator
    setEducator(typedEducator)
    setDisplayName(typedEducator.display_name || '')
    setTagline(typedEducator.tagline || '')
    setBio(typedEducator.bio || '')
    setHourlyRate(typedEducator.hourly_rate_credits || 0)
    setOffersFreeIntro(typedEducator.offers_free_intro ?? true)
    setFreeIntroMinutes(typedEducator.free_intro_minutes || 10)
    setSocialLinks({
      twitter: typedEducator.social_links?.twitter || '',
      linkedin: typedEducator.social_links?.linkedin || '',
      website: typedEducator.social_links?.website || ''
    })

    setLoading(false)
  }

  const saveProfile = async () => {
    if (!educator) return

    setSaving(true)
    setSuccess(false)

    const response = await fetch(`/api/mentorship/educators/${educator.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName,
        tagline,
        bio,
        hourly_rate_credits: hourlyRate,
        offers_free_intro: offersFreeIntro,
        free_intro_minutes: freeIntroMinutes,
        social_links: socialLinks
      })
    })

    if (response.ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const isMentor = educator?.type === 'mentor'

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/formador" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
            ← Volver al panel
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Editar Perfil de Formador</h1>
            <span className={`text-xs px-2 py-1 rounded-full ${isMentor ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {isMentor ? 'MENTOR' : 'INSTRUCTOR'}
            </span>
          </div>
        </div>

        {/* Success message */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-4 mb-6">
            Perfil actualizado correctamente
          </div>
        )}

        <div className="space-y-6">
          {/* Informacion basica */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Informacion basica</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Nombre para mostrar *</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre profesional"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f7931a]"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Tagline / Eslogan</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ej: Experto en trading con 10 anios de experiencia"
                  maxLength={100}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f7931a]"
                />
                <p className="text-xs text-gray-500 mt-1">{tagline.length}/100 caracteres</p>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Biografia</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuentanos sobre ti, tu experiencia y que pueden esperar los alumnos..."
                  rows={5}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f7931a]"
                />
              </div>
            </div>
          </section>

          {/* Tarifas */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Tarifas</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Precio por hora (creditos)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    min={0}
                    className="w-32 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#f7931a]"
                  />
                  <span className="text-gray-400">creditos/hora</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offersFreeIntro}
                    onChange={(e) => setOffersFreeIntro(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <span className="font-medium">Ofrecer sesion introductoria gratuita</span>
                    <p className="text-xs text-gray-400">Permite a los alumnos conocerte antes de contratar</p>
                  </div>
                </label>

                {offersFreeIntro && (
                  <div className="mt-3 ml-8">
                    <label className="text-sm text-gray-400 mb-2 block">Duracion de la intro gratis</label>
                    <select
                      value={freeIntroMinutes}
                      onChange={(e) => setFreeIntroMinutes(Number(e.target.value))}
                      className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#f7931a]"
                    >
                      <option value={5}>5 minutos</option>
                      <option value={10}>10 minutos</option>
                      <option value={15}>15 minutos</option>
                      <option value={20}>20 minutos</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Redes sociales */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Enlaces</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Twitter / X</label>
                <input
                  type="url"
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                  placeholder="https://twitter.com/tu_usuario"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f7931a]"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">LinkedIn</label>
                <input
                  type="url"
                  value={socialLinks.linkedin}
                  onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/tu_perfil"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f7931a]"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Web personal</label>
                <input
                  type="url"
                  value={socialLinks.website}
                  onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                  placeholder="https://tu-web.com"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f7931a]"
                />
              </div>
            </div>
          </section>

          {/* Especialidades (solo lectura por ahora) */}
          {educator?.specialties && educator.specialties.length > 0 && (
            <section className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Mis especialidades</h2>
              <div className="flex flex-wrap gap-2">
                {educator.specialties.map((s) => (
                  <span
                    key={s.specialty?.id}
                    className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm"
                  >
                    <span>{s.specialty?.icon}</span>
                    <span>{s.specialty?.name}</span>
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Para modificar tus especialidades, contacta con el equipo de Nodo360.
              </p>
            </section>
          )}

          {/* Boton guardar */}
          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard/formador"
              className="px-6 py-3 border border-white/10 rounded-lg hover:bg-white/5 transition"
            >
              Cancelar
            </Link>
            <button
              onClick={saveProfile}
              disabled={saving || !displayName}
              className="px-8 py-3 bg-[#f7931a] hover:bg-[#f7931a]/90 text-black rounded-lg font-semibold transition disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
