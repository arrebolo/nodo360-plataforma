import { createClient } from "@/lib/supabase/server"
import type { Course } from "@/types/database"
import Link from "next/link"
import { ArrowRight, BookOpen, Users, Award, Zap, CheckCircle, Play } from "lucide-react"
import {
  CommunitySection,
  MentorshipSection,
  StatsSection,
  NewsletterSection,
} from "@/components/home"
import { Button } from "@/components/ui"

export const metadata = {
  title: "Nodo360 - Aprende Bitcoin y Blockchain en Español",
  description:
    "La plataforma educativa más completa en español para aprender Bitcoin, Blockchain y Web3. Cursos gratis y premium con certificación.",
  keywords:
    "bitcoin, blockchain, web3, ethereum, solidity, smart contracts, defi, nft, cursos español",
  openGraph: {
    title: "Nodo360 - Domina Bitcoin y Blockchain",
    description:
      "La plataforma educativa #1 en español. Aprende desde cero o especialízate en Web3.",
    type: "website",
  },
}

async function getCourses(): Promise<{ free: Course[]; premium: Course[] }> {
  const supabase = await createClient()

  const [freeResult, premiumResult] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, slug, description, is_premium, created_at, updated_at")
      .eq("is_premium", false)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("courses")
      .select("id, title, slug, description, is_premium, created_at, updated_at")
      .eq("is_premium", true)
      .order("created_at", { ascending: false })
      .limit(6),
  ])

  return {
    free: (freeResult.data || []) as Course[],
    premium: (premiumResult.data || []) as Course[],
  }
}

// Course Card component for the home page
function CourseCard({ course, isPremium }: { course: Course; isPremium: boolean }) {
  return (
    <Link href={`/cursos/${course.slug}`} className="group block">
      <article className="card h-full flex flex-col overflow-hidden hover:border-[var(--color-border-strong)] transition-all">
        {/* Thumbnail */}
        <div className="aspect-video bg-[var(--color-bg-overlay)] flex items-center justify-center relative">
          <BookOpen className="w-10 h-10 text-[var(--color-text-muted)]" />
          <span className={`absolute top-3 left-3 badge ${isPremium ? 'badge-premium' : 'badge-success'}`}>
            {isPremium ? 'Premium' : 'Gratis'}
          </span>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-2 flex-1">
              {course.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--color-border-subtle)] text-sm text-[var(--color-accent)] font-medium">
            <span>Ver curso</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  )
}

export default async function HomePage() {
  const { free: freeCourses, premium: premiumCourses } = await getCourses()

  return (
    <main>
      {/* Hero Section */}
      <section className="section-lg">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 badge badge-accent mb-6">
              <Zap className="w-3.5 h-3.5" />
              <span>Plataforma #1 en español</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)] leading-tight mb-6">
              Domina{" "}
              <span className="text-gradient-accent">Bitcoin</span>
              {" "}y{" "}
              <span className="text-gradient-accent">Blockchain</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-8">
              Aprende desde cero con cursos estructurados, proyectos prácticos y una comunidad activa de miles de estudiantes.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/registro" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Comenzar gratis
              </Button>
              <Button href="#cursos" variant="secondary" size="lg" leftIcon={<Play className="w-5 h-5" />}>
                Ver cursos
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-12 pt-8 border-t border-[var(--color-border-subtle)]">
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">5,000+</p>
                <p className="text-sm text-[var(--color-text-muted)]">Estudiantes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">25+</p>
                <p className="text-sm text-[var(--color-text-muted)]">Cursos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">4.9</p>
                <p className="text-sm text-[var(--color-text-muted)]">Valoración</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Courses Section */}
      <section id="cursos" className="section bg-[var(--color-bg-surface)]">
        <div className="container-wide">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Cursos <span className="text-gradient-accent">Gratuitos</span>
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto">
              Empieza tu viaje en Web3 sin ningún costo. Aprende los fundamentos con contenido de calidad.
            </p>
          </div>

          {/* Course Grid */}
          {freeCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {freeCourses.map((course) => (
                <CourseCard key={course.id} course={course} isPremium={false} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
              <p className="text-[var(--color-text-secondary)]">Próximamente más cursos gratuitos</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-10 text-center">
            <Button href="/cursos" variant="secondary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Ver todos los cursos
            </Button>
          </div>
        </div>
      </section>

      {/* Premium Courses Section */}
      <section className="section">
        <div className="container-wide">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="badge badge-premium mb-4">Premium</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Cursos <span className="text-gradient-premium">Premium</span>
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto">
              Contenido avanzado con certificación, mentoría y acceso a comunidad exclusiva.
            </p>
          </div>

          {/* Course Grid */}
          {premiumCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {premiumCourses.map((course) => (
                <CourseCard key={course.id} course={course} isPremium={true} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
              <p className="text-[var(--color-text-secondary)]">Próximamente cursos premium</p>
            </div>
          )}

          {/* Benefits */}
          <div className="mt-16">
            <div className="card p-8 border-[var(--color-premium-muted)]">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] text-center mb-8">
                Beneficios Premium
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "Certificados Oficiales", desc: "Verificables y compartibles" },
                  { title: "Mentoría 1-on-1", desc: "Sesiones personalizadas" },
                  { title: "Comunidad Exclusiva", desc: "Networking profesional" },
                  { title: "Proyectos Prácticos", desc: "Construye tu portfolio" },
                  { title: "Actualizaciones", desc: "Contenido nuevo mensual" },
                  { title: "Soporte Priority", desc: "Respuestas en 24h" },
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[var(--color-premium)] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[var(--color-text-primary)]">{benefit.title}</h4>
                      <p className="text-sm text-[var(--color-text-muted)]">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Community Section */}
      <section id="comunidad">
        <CommunitySection />
      </section>

      {/* Mentorship Section */}
      <MentorshipSection />

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* Final CTA */}
      <section className="section-lg">
        <div className="container-default text-center">
          <div className="card p-10 sm:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-4">
              ¿Listo para empezar?
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-lg mx-auto mb-8">
              Únete a miles de estudiantes que ya están aprendiendo Bitcoin y Blockchain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/registro" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Crear cuenta gratis
              </Button>
              <Button href="/cursos" variant="secondary" size="lg">
                Explorar cursos
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
