'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bitcoin, Zap, Rocket, Check, ArrowRight } from 'lucide-react'

interface LearningPath {
  slug: string
  title: string
  icon: string
  description: string
  duration: string
  level: string
  colorFrom: string
  colorTo: string
  IconComponent: any
}

const PATHS: LearningPath[] = [
  {
    slug: 'bitcoin-fundamentals',
    title: 'Ruta Bitcoin',
    icon: '₿',
    description: 'Perfecto para empezar. Aprende los fundamentos de Bitcoin y criptomonedas desde cero.',
    duration: '40 horas',
    level: 'Principiante',
    colorFrom: 'from-orange-500',
    colorTo: 'to-yellow-500',
    IconComponent: Bitcoin
  },
  {
    slug: 'ethereum-developer',
    title: 'Ruta Ethereum',
    icon: '⟠',
    description: 'Para desarrolladores. Aprende Solidity, smart contracts y construye dApps descentralizadas.',
    duration: '60 horas',
    level: 'Intermedio',
    colorFrom: 'from-purple-500',
    colorTo: 'to-blue-500',
    IconComponent: Zap
  },
  {
    slug: 'crypto-full-stack',
    title: 'Ruta Full-Stack',
    icon: '🚀',
    description: 'Experiencia completa. De Bitcoin a dApps avanzadas en múltiples blockchains.',
    duration: '100 horas',
    level: 'Avanzado',
    colorFrom: 'from-green-500',
    colorTo: 'to-teal-500',
    IconComponent: Rocket
  }
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleStart = async () => {
    if (!selected || loading) return

    setLoading(true)

    try {
      console.log('📤 [Onboarding] Enviando selección:', selected)

      const response = await fetch('/api/user/select-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathSlug: selected })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al seleccionar ruta')
      }

      console.log('✅ [Onboarding] Ruta seleccionada:', data)

      // Pequeña pausa para feedback visual
      await new Promise(resolve => setTimeout(resolve, 500))

      // Redirigir al dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('❌ [Onboarding] Error:', err)
      alert(err instanceof Error ? err.message : 'Error al seleccionar ruta')
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-surface via-dark-soft to-dark-surface flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-light to-brand rounded-2xl flex items-center justify-center text-4xl animate-bounce-slow">
              🎓
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            ¡Bienvenido a Nodo360! 🎉
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto">
            Elige tu ruta de aprendizaje y comienza tu viaje en el mundo crypto
          </p>
        </div>

        {/* Path Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {PATHS.map((path) => {
            const Icon = path.IconComponent
            const isSelected = selected === path.slug

            return (
              <button
                key={path.slug}
                onClick={() => setSelected(path.slug)}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group
                  ${isSelected
                    ? 'border-white scale-105 shadow-2xl shadow-white/20 bg-white/10'
                    : 'border-white/10 hover:border-white/30 hover:scale-102 bg-white/5'
                  }
                  backdrop-blur-lg
                `}
              >
                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                    <Check className="w-6 h-6 text-white" strokeWidth={3} />
                  </div>
                )}

                {/* Icon */}
                <div className={`
                  w-16 h-16 rounded-xl bg-gradient-to-br ${path.colorFrom} ${path.colorTo}
                  flex items-center justify-center mb-4 transition-transform duration-300
                  ${isSelected ? 'scale-110' : 'group-hover:scale-105'}
                `}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition">
                  {path.title}
                </h3>

                <p className="text-white/80 text-sm mb-4 leading-relaxed">
                  {path.description}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs">
                  <span className={`
                    px-3 py-1 rounded-full font-medium transition
                    ${isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-white/60 group-hover:bg-white/15 group-hover:text-white/80'
                    }
                  `}>
                    {path.level}
                  </span>
                  <span className="text-white/60 group-hover:text-white/80 transition">
                    {path.duration}
                  </span>
                </div>

                {/* Hover Indicator */}
                {!isSelected && (
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleStart}
            disabled={!selected || loading}
            className="
              px-10 py-4 bg-gradient-to-r from-brand-light to-brand
              text-white font-bold text-lg rounded-xl
              hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-105
              transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              flex items-center gap-3
            "
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Preparando tu ruta...
              </>
            ) : (
              <>
                Empezar mi viaje
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Skip Option */}
          <button
            onClick={() => router.push('/dashboard')}
            disabled={loading}
            className="text-white/60 hover:text-white text-sm transition-colors disabled:opacity-50"
          >
            Explorar sin elegir ruta
          </button>
        </div>

        {/* Benefits */}
        <div className="mt-16 text-center">
          <p className="text-white/60 text-sm mb-4">¿Por qué elegir una ruta?</p>
          <div className="flex flex-wrap justify-center gap-6 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Aprendizaje estructurado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Progreso personalizado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>Certificados al completar</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}


