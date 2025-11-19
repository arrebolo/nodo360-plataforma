'use client'

import { useEffect, useRef, useState } from 'react'
import { Users, BookOpen, ThumbsUp, Clock, TrendingUp, Award, Globe, Sparkles } from 'lucide-react'

interface Stat {
  icon: React.ElementType
  value: number
  suffix: string
  label: string
  color: string
  bgColor: string
}

const stats: Stat[] = [
  {
    icon: Users,
    value: 5000,
    suffix: '+',
    label: 'Estudiantes Activos',
    color: 'text-[#ff6b35]',
    bgColor: 'from-[#ff6b35]/20 to-[#ff6b35]/5'
  },
  {
    icon: BookOpen,
    value: 25,
    suffix: '+',
    label: 'Cursos Disponibles',
    color: 'text-[#FFD700]',
    bgColor: 'from-[#FFD700]/20 to-[#FFD700]/5'
  },
  {
    icon: ThumbsUp,
    value: 98,
    suffix: '%',
    label: 'Satisfacción',
    color: 'text-[#3b82f6]',
    bgColor: 'from-[#3b82f6]/20 to-[#3b82f6]/5'
  },
  {
    icon: Clock,
    value: 50,
    suffix: '+',
    label: 'Horas de Contenido',
    color: 'text-[#9333ea]',
    bgColor: 'from-[#9333ea]/20 to-[#9333ea]/5'
  }
]

const achievements = [
  {
    icon: TrendingUp,
    title: 'Crecimiento Acelerado',
    description: '+300% estudiantes en 2024',
    color: 'text-[#ff6b35]'
  },
  {
    icon: Award,
    title: 'Certificaciones',
    description: '1,200+ certificados emitidos',
    color: 'text-[#FFD700]'
  },
  {
    icon: Globe,
    title: 'Comunidad Global',
    description: '15+ países hispanohablantes',
    color: 'text-[#3b82f6]'
  },
  {
    icon: Sparkles,
    title: 'Contenido Premium',
    description: 'Actualizado semanalmente',
    color: 'text-[#9333ea]'
  }
]

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const counterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (counterRef.current) {
      observer.observe(counterRef.current)
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const duration = 2000 // 2 seconds
    const steps = 60
    const increment = value / steps
    const stepDuration = duration / steps

    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      if (currentStep <= steps) {
        setCount(Math.floor(increment * currentStep))
      } else {
        setCount(value)
        clearInterval(timer)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [isVisible, value])

  return (
    <div ref={counterRef} className="text-5xl md:text-6xl font-bold">
      {count.toLocaleString()}
      <span className="text-4xl md:text-5xl">{suffix}</span>
    </div>
  )
}

export function StatsSection() {
  return (
    <section id="stats" className="py-24 bg-gradient-to-b from-[#252b3d] to-[#1a1f2e] relative overflow-hidden">
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
            Nodo360 en <span className="text-[#ff6b35]">Números</span>
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            La plataforma educativa de Bitcoin y Blockchain más grande en español
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:border-white/20 transition-all duration-300 hover:-translate-y-1 text-center"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.bgColor} mb-4`}>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div className={`${stat.color} mb-2`}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-white/70 font-medium">{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* Achievements Grid */}
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
            Nuestros Logros
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon
              return (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-all text-center"
                >
                  <Icon className={`w-10 h-10 ${achievement.color} mx-auto mb-3`} />
                  <h4 className="font-semibold text-white mb-2">{achievement.title}</h4>
                  <p className="text-sm text-white/60">{achievement.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white mb-2">100%</div>
                <div className="text-white/70 text-sm">Contenido en Español</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">24/7</div>
                <div className="text-white/70 text-sm">Soporte Comunitario</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">Gratis</div>
                <div className="text-white/70 text-sm">Cursos Fundamentales</div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col items-center gap-4 px-8 py-6 bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] border-2 border-[#1a1f2e] flex items-center justify-center text-white font-bold"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-white/70">
              <span className="font-semibold text-white">+2,300 estudiantes</span> se unieron este mes
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
