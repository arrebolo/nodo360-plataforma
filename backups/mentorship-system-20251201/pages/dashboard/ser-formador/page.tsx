// app/(private)/dashboard/ser-formador/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AppUser {
  id: string
  email: string | undefined
}

interface Educator {
  id: string
  status: string
  type: string
}

interface Specialty {
  id: string
  name: string
  icon: string
  description: string | null
}

export default function SerFormadorPage() {
  const supabase = createClient()
  const router = useRouter()

  const [user, setUser] = useState<AppUser | null>(null)
  const [existingEducator, setExistingEducator] = useState<Educator | null>(null)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form
  const [displayName, setDisplayName] = useState('')
  const [tagline, setTagline] = useState('')
  const [bio, setBio] = useState('')
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [experience, setExperience] = useState('')
  const [motivation, setMotivation] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      router.push('/login?redirect=/dashboard/ser-formador')
      return
    }

    setUser({ id: authUser.id, email: authUser.email })

    // Verificar si ya es educador
    const { data: educator } = await supabase
      .from('educators')
      .select('id, status, type')
      .eq('user_id', authUser.id)
      .maybeSingle()

    if (educator) {
      setExistingEducator(educator as Educator)
    }

    // Obtener usuario para nombre por defecto
    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', authUser.id)
      .single()

    const typedUserData = userData as { full_name: string | null } | null
    if (typedUserData?.full_name && !displayName) {
      setDisplayName(typedUserData.full_name)
    }

    // Obtener especialidades
    const { data: specialtiesData } = await supabase
      .from('specialties')
      .select('id, name, icon, description')
      .eq('is_active', true)
      .order('order_index')

    setSpecialties((specialtiesData || []) as Specialty[])
    setLoading(false)
  }

  const toggleSpecialty = (id: string) => {
    if (selectedSpecialties.includes(id)) {
      setSelectedSpecialties(selectedSpecialties.filter(s => s !== id))
    } else if (selectedSpecialties.length < 3) {
      setSelectedSpecialties([...selectedSpecialties, id])
    }
  }

  const handleSubmit = async () => {
    if (!displayName || selectedSpecialties.length === 0 || !bio || !acceptTerms) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    setSubmitting(true)
    setError(null)

    const response = await fetch('/api/mentorship/educators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName,
        tagline,
        bio,
        specialty_ids: selectedSpecialties,
        experience,
        motivation
      })
    })

    const data = await response.json()

    if (response.ok) {
      setSuccess(true)
    } else {
      setError(data.error || 'Error al enviar solicitud')
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Si ya es educador
  if (existingEducator) {
    const isPending = existingEducator.status === 'pending'
    const isActive = existingEducator.status === 'active'
    const isMentor = existingEducator.type === 'mentor'

    return (
      <div className="min-h-screen bg-[#070a10] text-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          {isPending ? (
            <>
              <div className="text-6xl mb-4">⏳</div>
              <h1 className="text-2xl font-bold mb-4">Solicitud en revision</h1>
              <p className="text-gray-400 mb-6">
                Tu solicitud para ser instructor esta siendo revisada por nuestro equipo.
                Te notificaremos cuando sea aprobada.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-300 text-sm">
                Estado: Pendiente de aprobacion
              </div>
            </>
          ) : isActive ? (
            <>
              <div className="text-6xl mb-4">{isMentor ? '🏆' : '🎓'}</div>
              <h1 className="text-2xl font-bold mb-4">
                Ya eres {isMentor ? 'Mentor' : 'Instructor'}!
              </h1>
              <p className="text-gray-400 mb-6">
                Accede a tu panel de formador para gestionar tus sesiones.
              </p>
              <Link
                href="/dashboard/formador"
                className="inline-flex items-center gap-2 bg-[#f7931a] hover:bg-[#f7931a]/90 text-black px-6 py-3 rounded-xl font-semibold transition"
              >
                Ir a mi panel de formador →
              </Link>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">😕</div>
              <h1 className="text-2xl font-bold mb-4">Cuenta suspendida</h1>
              <p className="text-gray-400 mb-6">
                Tu cuenta de formador esta actualmente suspendida.
                Contacta con soporte para mas informacion.
              </p>
            </>
          )}

          <Link href="/dashboard" className="text-gray-400 hover:text-white mt-8 inline-block">
            ← Volver al dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Formulario de solicitud completado
  if (success) {
    return (
      <div className="min-h-screen bg-[#070a10] text-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-4">Solicitud enviada!</h1>
          <p className="text-gray-400 mb-6">
            Hemos recibido tu solicitud para ser instructor en Nodo360.
            Nuestro equipo la revisara y te contactaremos pronto.
          </p>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-sm mb-8">
            Recibiras un email cuando tu solicitud sea revisada.
          </div>
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white"
          >
            ← Volver al dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white mb-2 inline-block">
            ← Volver al dashboard
          </Link>
          <h1 className="text-3xl font-bold">Conviertete en Instructor</h1>
          <p className="text-gray-400 mt-2">
            Comparte tus conocimientos con la comunidad Nodo360 y ayuda a otros a aprender sobre Bitcoin y Blockchain.
          </p>
        </div>

        {/* Info sobre el proceso */}
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-blue-300 mb-3">Proceso de admision</h2>
          <ol className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="bg-blue-500/30 text-blue-300 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
              <span>Completa este formulario con tu informacion y experiencia</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-500/30 text-blue-300 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
              <span>Nuestro equipo revisara tu solicitud (24-48 horas)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-500/30 text-blue-300 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
              <span>Si cumples los requisitos, te invitaremos a un examen de capacidad</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-500/30 text-blue-300 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">4</span>
              <span>Al aprobar, tu perfil de instructor se activara automaticamente</span>
            </li>
          </ol>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* Formulario */}
        <div className="space-y-6">
          {/* Informacion basica */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Informacion basica</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Nombre profesional *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Como quieres que te conozcan los alumnos"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f7931a]"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Eslogan o especialidad breve
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ej: Experto en trading con 10 anios de experiencia"
                  maxLength={100}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f7931a]"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Biografia profesional *
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuentanos sobre tu trayectoria, experiencia y que puedes ofrecer a los alumnos..."
                  rows={4}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f7931a]"
                />
              </div>
            </div>
          </section>

          {/* Especialidades */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-2">Especialidades *</h2>
            <p className="text-sm text-gray-400 mb-4">
              Selecciona hasta 3 areas en las que te especializas
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {specialties.map(specialty => {
                const isSelected = selectedSpecialties.includes(specialty.id)
                const isDisabled = !isSelected && selectedSpecialties.length >= 3

                return (
                  <button
                    key={specialty.id}
                    onClick={() => toggleSpecialty(specialty.id)}
                    disabled={isDisabled}
                    className={`p-4 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-[#f7931a] bg-[#f7931a]/10'
                        : isDisabled
                        ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{specialty.icon}</span>
                      <div>
                        <div className="font-medium">{specialty.name}</div>
                        <div className="text-xs text-gray-400">{specialty.description}</div>
                      </div>
                      {isSelected && (
                        <span className="ml-auto text-[#f7931a]">✓</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-gray-500 mt-3">
              {selectedSpecialties.length}/3 especialidades seleccionadas
            </p>
          </section>

          {/* Experiencia */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Experiencia</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Cuantos anios de experiencia tienes en crypto/blockchain?
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#f7931a]"
                >
                  <option value="">Seleccionar...</option>
                  <option value="1-2">1-2 anios</option>
                  <option value="3-5">3-5 anios</option>
                  <option value="5-10">5-10 anios</option>
                  <option value="10+">Mas de 10 anios</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Por que quieres ser instructor en Nodo360?
                </label>
                <textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Cuentanos tu motivacion para ensenar y ayudar a otros..."
                  rows={3}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#f7931a]"
                />
              </div>
            </div>
          </section>

          {/* Terminos */}
          <section className="bg-white/5 border border-white/10 rounded-xl p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-5 h-5 rounded mt-0.5"
              />
              <div>
                <span className="font-medium">Acepto los terminos y condiciones *</span>
                <p className="text-xs text-gray-400 mt-1">
                  Me comprometo a mantener un comportamiento profesional, respetar las politicas de Nodo360,
                  y ofrecer sesiones de calidad a los alumnos. Entiendo que mi cuenta puede ser suspendida
                  si no cumplo con estos estandares.
                </p>
              </div>
            </label>
          </section>

          {/* Boton enviar */}
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting || !displayName || selectedSpecialties.length === 0 || !bio || !acceptTerms}
              className="flex-1 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] hover:opacity-90 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </div>

        {/* Info sobre mentores */}
        <div className="mt-12 p-6 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-xl">
          <div className="flex items-start gap-4">
            <span className="text-4xl">🏆</span>
            <div>
              <h3 className="font-semibold text-amber-300 mb-2">Que es un Mentor?</h3>
              <p className="text-sm text-gray-300">
                Los Mentores son la elite de Nodo360. Son instructores que han demostrado
                un compromiso excepcional con la comunidad, acumulando puntos por su
                contribucion, valoraciones sobresalientes y reconocimiento de sus alumnos.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Primero conviertete en instructor, y si destacas, podras ser promocionado a Mentor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
