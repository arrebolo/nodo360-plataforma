'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User,
  Award,
  BookOpen,
  Send,
  Rocket,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: React.ElementType
  link: string
  linkText: string
  isComplete: boolean
  isLoading: boolean
}

interface UserProfile {
  avatar_url: string | null
  bio: string | null
}

interface Certification {
  id: string
  status: string
}

interface Course {
  id: string
  status: string
}

export default function InstructorOnboardingPage() {
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    async function loadOnboardingStatus() {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user profile
      const { data: profile } = await supabase
        .from('users')
        .select('avatar_url, bio')
        .eq('id', user.id)
        .single() as { data: UserProfile | null }

      // Fetch certifications (instructor certification)
      const { data: certifications } = await supabase
        .from('certificates')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('type', 'course') as { data: Certification[] | null }

      // Fetch courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id, status')
        .eq('instructor_id', user.id) as { data: Course[] | null }

      // Calculate step completion
      const hasProfileComplete = !!(profile?.avatar_url && profile?.bio)
      const hasCertification = certifications && certifications.length > 0
      const hasCourse = courses && courses.length > 0
      const hasCoursePendingOrPublished = courses?.some(
        c => c.status === 'pending_review' || c.status === 'published'
      )
      const hasCoursePublished = courses?.some(c => c.status === 'published')

      const onboardingSteps: OnboardingStep[] = [
        {
          id: 1,
          title: 'Completa tu perfil',
          description: 'Añade tu foto, bio profesional y areas de conocimiento para que los estudiantes te conozcan.',
          icon: User,
          link: '/dashboard/perfil',
          linkText: 'Editar perfil',
          isComplete: hasProfileComplete,
          isLoading: false,
        },
        {
          id: 2,
          title: 'Pasa el examen de certificacion',
          description: 'Demuestra tu conocimiento para ser instructor certificado en Nodo360.',
          icon: Award,
          link: '/dashboard/instructor',
          linkText: 'Ver certificaciones',
          isComplete: !!hasCertification,
          isLoading: false,
        },
        {
          id: 3,
          title: 'Crea tu primer curso',
          description: 'Diseña contenido educativo de calidad sobre Bitcoin, blockchain o Web3.',
          icon: BookOpen,
          link: '/dashboard/instructor/cursos/nuevo',
          linkText: 'Crear curso',
          isComplete: !!hasCourse,
          isLoading: false,
        },
        {
          id: 4,
          title: 'Envia a revision',
          description: 'Un mentor certificado revisara tu curso y te dara feedback.',
          icon: Send,
          link: '/guia-revision',
          linkText: 'Ver guia de revision',
          isComplete: !!hasCoursePendingOrPublished,
          isLoading: false,
        },
        {
          id: 5,
          title: 'Publica y gana!',
          description: 'Tu curso estara disponible para estudiantes y comenzaras a generar ingresos.',
          icon: Rocket,
          link: '/dashboard/instructor/cursos',
          linkText: 'Ver mis cursos',
          isComplete: !!hasCoursePublished,
          isLoading: false,
        },
      ]

      setSteps(onboardingSteps)
      setCompletedCount(onboardingSteps.filter(s => s.isComplete).length)
      setLoading(false)
    }

    loadOnboardingStatus()
  }, [])

  const progressPercentage = (completedCount / 5) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-32 bg-white/5 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-brand-light/20">
              <Sparkles className="w-6 h-6 text-brand-light" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Guia de inicio para instructores
            </h1>
          </div>
          <p className="text-white/60">
            Sigue estos pasos para comenzar a crear y vender cursos en Nodo360
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Tu progreso</span>
            <span className="text-brand-light font-semibold">
              {completedCount} de 5 pasos completados
            </span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-light to-brand rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {completedCount === 5 && (
            <p className="mt-3 text-success flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              ¡Felicidades! Has completado todos los pasos
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isNextStep = !step.isComplete && steps.slice(0, index).every(s => s.isComplete)

            return (
              <div
                key={step.id}
                className={`
                  relative rounded-2xl border p-6 transition-all
                  ${step.isComplete
                    ? 'border-success/30 bg-success/5'
                    : isNextStep
                    ? 'border-brand-light/30 bg-brand-light/5'
                    : 'border-white/10 bg-white/5'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Step Number & Icon */}
                  <div className={`
                    flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center
                    ${step.isComplete
                      ? 'bg-success/20'
                      : isNextStep
                      ? 'bg-brand-light/20'
                      : 'bg-white/10'
                    }
                  `}>
                    {step.isComplete ? (
                      <CheckCircle className="w-7 h-7 text-success" />
                    ) : (
                      <Icon className={`w-7 h-7 ${isNextStep ? 'text-brand-light' : 'text-white/60'}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm text-white/40 font-medium">
                        Paso {step.id}
                      </span>
                      {step.isComplete ? (
                        <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium">
                          Completado
                        </span>
                      ) : isNextStep ? (
                        <span className="px-2 py-0.5 rounded-full bg-brand-light/20 text-brand-light text-xs font-medium">
                          Siguiente paso
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/50 text-xs font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pendiente
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {step.title}
                    </h3>
                    <p className="text-white/60 text-sm mb-4">
                      {step.description}
                    </p>

                    <Link
                      href={step.link}
                      className={`
                        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                        ${step.isComplete
                          ? 'bg-white/10 text-white/70 hover:bg-white/15'
                          : isNextStep
                          ? 'bg-gradient-to-r from-brand-light to-brand text-white hover:opacity-90'
                          : 'bg-white/10 text-white/60 hover:bg-white/15'
                        }
                      `}
                    >
                      {step.linkText}
                      {step.link.startsWith('/guia') ? (
                        <ExternalLink className="w-4 h-4" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Help Section */}
        <div className="mt-8 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            ¿Necesitas ayuda?
          </h3>
          <p className="text-white/60 text-sm mb-4">
            Consulta nuestra guia de revision o contacta con un mentor
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/guia-revision"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white font-medium text-sm hover:bg-white/15 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Guia de revision
            </Link>
            <Link
              href="/dashboard/mensajes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white font-medium text-sm hover:bg-white/15 transition-colors"
            >
              <Send className="w-4 h-4" />
              Contactar mentor
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
