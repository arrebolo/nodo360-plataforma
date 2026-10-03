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
import type { SupabaseClient } from '@supabase/supabase-js'

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

      // LA FILA PROPIA VA POR mi_perfil(), NO POR SELECT.
      //
      // `users.bio` esta cerrada para authenticated desde la 104, y un GRANT de
      // columna es por rol: cerrar la bio de los demas cierra tambien la propia.
      // mi_perfil() es la puerta para lo propio —SECURITY DEFINER, devuelve la
      // fila de auth.uid() entera— y no depende de esos GRANT. Es el mismo camino
      // que ya usa /dashboard/perfil.
      const { data: filas } = await (supabase as unknown as SupabaseClient).rpc('mi_perfil')
      const profile = (Array.isArray(filas) ? filas[0] : null) as UserProfile | null

      // LAS VERIFICACIONES DE INSTRUCTOR, y no los certificados de alumno.
      //
      // Aqui se consultaba `certificates` con type='course', que son los
      // certificados que recibe quien TERMINA un curso. No tenian nada que ver
      // con ser instructor, asi que el paso 2 salia pendiente para todo el mundo
      // —incluida una cuenta con su verificacion aprobada— y completado para
      // cualquiera que hubiera acabado un curso.
      //
      // Cada uno lee sus propias certificaciones: es la politica de la 093. El
      // casteo, porque lib/supabase/types.ts no conoce las tablas instructor_*.
      const { data: verificaciones } = await (supabase as unknown as SupabaseClient)
        .from('instructor_certifications')
        .select('id, status, instructor_specialties ( nombre )')
        .eq('user_id', user.id)
        .eq('status', 'aprobada')

      const verificadas = (verificaciones ?? []) as Array<{
        id: string
        status: string
        instructor_specialties: { nombre: string } | { nombre: string }[] | null
      }>

      const nombreDeEspecialidad = (v: typeof verificadas[number]) => {
        const e = v.instructor_specialties
        return Array.isArray(e) ? e[0]?.nombre : e?.nombre
      }

      const especialidadesVerificadas = verificadas
        .map(nombreDeEspecialidad)
        .filter((n): n is string => !!n)

      // Fetch courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id, status')
        .eq('instructor_id', user.id) as { data: Course[] | null }

      // Calculate step completion
      const hasProfileComplete = !!(profile?.avatar_url && profile?.bio)
      const estaVerificado = verificadas.length > 0
      const hasCourse = courses && courses.length > 0
      const hasCoursePendingOrPublished = courses?.some(
        c => c.status === 'pending_review' || c.status === 'published'
      )
      const hasCoursePublished = courses?.some(c => c.status === 'published')

      const onboardingSteps: OnboardingStep[] = [
        {
          id: 1,
          title: 'Completa tu perfil',
          description: 'Tu foto y una biografía corta: quién eres y de qué puedes hablar con conocimiento. Las áreas de conocimiento no se escriben aquí, salen del paso siguiente.',
          icon: User,
          link: '/dashboard/perfil',
          linkText: 'Editar perfil',
          isComplete: hasProfileComplete,
          isLoading: false,
        },
        {
          id: 2,
          title: 'Verificate en una especialidad',
          description: especialidadesVerificadas.length > 0
            ? `Verificado en ${especialidadesVerificadas.join(', ')}. Estar verificado en una especialidad habilita solo en esa.`
            : 'La verificación es por especialidad, no general. Si esa especialidad tiene banco de preguntas hay examen; si no, entrevista y parte práctica. En los dos casos decide una persona, y sin ella no se puede enviar un curso a revisión.',
          icon: Award,
          link: '/dashboard/instructor/verificacion',
          linkText: especialidadesVerificadas.length > 0 ? 'Ver mis verificaciones' : 'Pedir la verificación',
          isComplete: estaVerificado,
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
          title: 'Envía a revisión',
          description: 'Hace falta estar verificado en la especialidad del curso, y que el curso la tenga asignada. Hoy lo revisa el equipo de Nodo360; cuando haya mentores verificados, cada curso lo revisarán dos.',
          icon: Send,
          link: '/dashboard/instructor/guia',
          linkText: 'Ver guía de revisión',
          isComplete: !!hasCoursePendingOrPublished,
          isLoading: false,
        },
        {
          id: 5,
          title: 'Se publica',
          description: 'Entra en el catálogo con tu nombre y tu biografía, gratuito como todos los demás. Hoy no hay remuneración para instructores; si en el futuro hay monetización, las condiciones se acordarán por escrito antes de cualquier cobro.',
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
              Guía de inicio para instructores
            </h1>
          </div>
          <p className="text-white/60">
            Sigue estos pasos para crear y publicar cursos en Nodo360
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
            Consulta nuestra guía de revisión o contacta con un mentor
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard/instructor/guia"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white font-medium text-sm hover:bg-white/15 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Guía de revisión
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
