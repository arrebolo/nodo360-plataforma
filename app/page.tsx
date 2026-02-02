import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import {
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
  FileText,
  Search,
} from 'lucide-react'
import { HomeFeaturedCourses } from '@/components/home/HomeFeaturedCourses'
import { HomeFooter } from '@/components/home/HomeFooter'
import { brandConfig } from '@/lib/brand-config'
import { blogPosts, blogCategories } from '@/lib/blog-data'
import { glossaryTerms, glossaryCategories } from '@/lib/glossary-data'

export const metadata = {
  title: `${brandConfig.name} | ${brandConfig.tagline}`,
  description: brandConfig.description,
}

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

      {/* Blog Section - SEO */}
      <section className="py-20 bg-dark-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-wide text-brand-light font-medium mb-2">
              Blog educativo
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Aprende sobre Bitcoin y Blockchain
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Articulos gratuitos para empezar tu camino en el mundo crypto
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {blogPosts.slice(0, 3).map((post) => {
              const categoryInfo = blogCategories[post.category]
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-dark border border-white/10 rounded-2xl overflow-hidden hover:border-brand-light/30 transition-colors"
                >
                  <div className="aspect-video relative overflow-hidden bg-dark-surface">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5">
                    <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border ${categoryInfo.color} mb-3`}>
                      {categoryInfo.name}
                    </span>
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-brand-light transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-white/60 line-clamp-2 mb-3">
                      {post.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-brand-light font-medium">
                      Leer articulo
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="text-center">
            <Link
              href="/blog"
              className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-12 px-6 text-base text-white bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
            >
              <FileText className="h-5 w-5" />
              Ver todos los articulos
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Instructor CTA */}
      <section className="py-20 bg-dark">
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

      {/* Glosario Section - SEO */}
      <section className="py-20 bg-dark-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm uppercase tracking-wide text-brand-light font-medium mb-2">
                Glosario crypto
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                No entiendes un termino? Consulta nuestro glosario
              </h2>
              <p className="text-lg text-white/60 mb-6">
                Mas de 50 terminos explicados de forma clara y sencilla. Desde Bitcoin hasta DeFi, todo lo que necesitas saber.
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {Object.entries(glossaryCategories).slice(0, 6).map(([key, cat]) => (
                  <Link
                    key={key}
                    href={`/glosario?categoria=${key}`}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full border ${cat.color} hover:opacity-80 transition-opacity`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              <Link
                href="/glosario"
                className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-12 px-6 text-base text-white bg-gradient-to-r from-brand-light to-brand hover:opacity-90 transition-opacity"
              >
                <Search className="h-5 w-5" />
                Explorar glosario
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {glossaryTerms.slice(0, 6).map((term) => {
                const categoryInfo = glossaryCategories[term.category]
                return (
                  <Link
                    key={term.slug}
                    href={`/glosario/${term.slug}`}
                    className="group bg-dark border border-white/10 rounded-xl p-4 hover:border-brand-light/30 transition-colors"
                  >
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${categoryInfo.color} mb-2`}>
                      {categoryInfo.name}
                    </span>
                    <h3 className="text-base font-semibold text-white group-hover:text-brand-light transition-colors">
                      {term.term}
                    </h3>
                    <p className="text-xs text-white/50 line-clamp-2 mt-1">
                      {term.definition}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <HomeFooter />
    </div>
  )
}
