import Link from 'next/link'
import { Suspense } from 'react'
import {
  Bitcoin,
  Shield,
  Users,
  GraduationCap,
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  BookOpen,
  Sparkles,
  DollarSign,
  Wrench,
  HeartHandshake,
} from 'lucide-react'
import { HomeFeaturedCourses } from '@/components/home/HomeFeaturedCourses'
import { HomeFooter } from '@/components/home/HomeFooter'
import { CommunitySection } from '@/components/home/CommunitySection'
import { brandConfig } from '@/lib/brand-config'

export const metadata = {
  title: `${brandConfig.name} | ${brandConfig.tagline}`,
  description: brandConfig.description,
}

// Los 4 pilares de Nodo360
const pillars = [
  {
    icon: Bitcoin,
    title: 'Bitcoin',
    description:
      'Comprende Bitcoin desde sus fundamentos técnicos hasta su impacto económico y social.',
    color: 'text-brand-light',
    bgColor: 'bg-brand-light/10',
    borderColor: 'border-brand-light/20',
  },
  {
    icon: Shield,
    title: 'Soberanía Digital',
    description:
      'Aprende a proteger tu privacidad y tomar control de tu identidad digital.',
    color: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10',
    borderColor: 'border-accent-blue/20',
  },
  {
    icon: Users,
    title: 'Comunidad',
    description:
      'Conecta con otros aprendices y expertos en un espacio colaborativo.',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/20',
  },
  {
    icon: GraduationCap,
    title: 'Certificación',
    description:
      'Obtén certificados verificables que validan tu conocimiento.',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/20',
  },
]

// Cómo funciona
const howItWorks = [
  {
    step: 1,
    title: 'Elige tu ruta',
    description: 'Selecciona el camino de aprendizaje que mejor se adapte a tus objetivos.',
  },
  {
    step: 2,
    title: 'Aprende a tu ritmo',
    description: 'Accede a lecciones en video, ejercicios prácticos y recursos adicionales.',
  },
  {
    step: 3,
    title: 'Obtén tu certificado',
    description: 'Completa los módulos y demuestra tu conocimiento con certificados verificables.',
  },
]

// Diferenciadores
const differentiators = [
  {
    icon: Zap,
    title: 'Sin requisitos previos',
    description: 'Empezamos desde cero, sin asumir conocimientos técnicos.',
  },
  {
    icon: Target,
    title: 'Enfoque práctico',
    description: 'Cada lección incluye ejercicios y casos de uso reales.',
  },
  {
    icon: BookOpen,
    title: 'Contenido actualizado',
    description: 'Material revisado constantemente para mantenerse relevante.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Hero Section - GlobalHeader is in AppShell */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-light/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm uppercase tracking-wide text-brand-light font-medium mb-4">
              La plataforma educativa en español
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Domina{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-brand">
                Bitcoin
              </span>{' '}
              y{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-brand">
                Web3
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              {brandConfig.description}. Rutas claras, sin humo, diseñadas para
              llevarte de cero a experto.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/cursos"
                className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-12 px-6 text-base text-white bg-gradient-to-r from-brand-light to-brand hover:opacity-90 transition-opacity"
              >
                Explorar cursos
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard/rutas"
                className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-12 px-6 text-base text-white bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
              >
                Ver rutas de aprendizaje
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-white/50">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                100% en español
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Contenido gratuito
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Certificados verificables
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Comunidad */}
      <CommunitySection />

      {/* 4 Pilares */}
      <section className="py-20 bg-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-wide text-brand-light font-medium mb-2">
              Nuestros pilares
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Formación integral en Web3
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar) => {
              const Icon = pillar.icon
              return (
                <div
                  key={pillar.title}
                  className={`${pillar.bgColor} ${pillar.borderColor} border rounded-2xl p-6 text-center`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${pillar.bgColor} ${pillar.color} mb-4`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-white/60">{pillar.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 bg-dark-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-wide text-brand-light font-medium mb-2">
              Proceso simple
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Cómo funciona
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-brand-light to-brand text-white font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-white/60">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <Suspense
        fallback={
          <section className="py-20 bg-dark-soft">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center">
                <p className="text-white/60">Cargando cursos...</p>
              </div>
            </div>
          </section>
        }
      >
        <HomeFeaturedCourses />
      </Suspense>

      {/* Diferenciadores */}
      <section className="py-20 bg-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-wide text-brand-light font-medium mb-2">
              Por qué elegirnos
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Educación diferente
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {differentiators.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="bg-dark-surface border border-white/10 rounded-2xl p-6"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-brand-light/10 text-brand-light mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/60">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Instructor CTA */}
      <section className="py-20 bg-dark-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl border border-brand-light/20 bg-gradient-to-br from-brand-light/10 via-brand/5 to-transparent p-8 md:p-12 backdrop-blur-sm overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-light/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              {/* Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-light/20 border border-brand-light/30 text-brand-light text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  Programa de instructores
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Eres experto en Bitcoin o Blockchain?
                </h2>
                <p className="text-lg text-white/70 mb-6">
                  Comparte tu conocimiento y genera ingresos enseñando en Nodo360.
                  Unete a nuestra comunidad de educadores.
                </p>

                {/* Benefits */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-white/80">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-success" />
                    </div>
                    <span>Comision 35-40% por cada venta</span>
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-light/20 flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-brand-light" />
                    </div>
                    <span>Herramientas de creacion de cursos incluidas</span>
                  </li>
                  <li className="flex items-center gap-3 text-white/80">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                      <HeartHandshake className="w-4 h-4 text-warning" />
                    </div>
                    <span>Soporte de mentores certificados</span>
                  </li>
                </ul>

                <Link
                  href="/dashboard/instructor"
                  className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-12 px-6 text-base text-white bg-gradient-to-r from-brand-light to-brand hover:opacity-90 transition-opacity"
                >
                  Conviertete en Instructor
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              {/* Visual */}
              <div className="hidden md:flex items-center justify-center">
                <div className="relative">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-brand-light/30 to-brand/20 flex items-center justify-center">
                    <GraduationCap className="w-24 h-24 text-brand-light" />
                  </div>
                  {/* Floating badges */}
                  <div className="absolute -top-4 -right-4 px-3 py-1.5 rounded-full bg-success/20 border border-success/30 text-success text-sm font-medium">
                    +500 estudiantes
                  </div>
                  <div className="absolute -bottom-2 -left-4 px-3 py-1.5 rounded-full bg-warning/20 border border-warning/30 text-warning text-sm font-medium">
                    4.8 rating
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-b from-dark-surface to-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Empieza tu viaje hacia la soberanía digital
          </h2>
          <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
            Únete a nuestra comunidad de aprendices y expertos. Accede a
            contenido gratuito y comienza hoy mismo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login?mode=register"
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-12 px-6 text-base text-white bg-gradient-to-r from-brand-light to-brand hover:opacity-90 transition-opacity"
            >
              Crear cuenta gratis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/cursos"
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-12 px-6 text-base text-white/70 hover:text-white transition-colors"
            >
              Ver cursos primero
            </Link>
          </div>
        </div>
      </section>

      <HomeFooter />
    </div>
  )
}
