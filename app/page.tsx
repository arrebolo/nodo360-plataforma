import { createClient } from "@/lib/supabase/server"
import type { Course } from "@/types/database"
import {
  HeroSection,
  CourseGrid,
  CommunitySection,
  ProjectsRoadmap,
  MentorshipSection,
  StatsSection,
  NewsletterSection,
} from "@/components/home"

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

async function getFreeCourses(): Promise<Course[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select("id, title, slug, description, is_premium, created_at, updated_at")
    .eq("is_premium", false)
    .order("created_at", { ascending: false })
    .limit(6)

  if (error) {
    console.error("Error fetching free courses:", error)
    return []
  }

  return (data || []) as Course[]
}

async function getPremiumCourses(): Promise<Course[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select("id, title, slug, description, is_premium, created_at, updated_at")
    .eq("is_premium", true)
    .order("created_at", { ascending: false })
    .limit(6)

  if (error) {
    console.error("Error fetching premium courses:", error)
    return []
  }

  return (data || []) as Course[]
}

export default async function HomePage() {
  const [freeCourses, premiumCourses] = await Promise.all([
    getFreeCourses(),
    getPremiumCourses(),
  ])

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Free Courses Section */}
      <section
        id="cursos-gratis"
        className="py-24 bg-gradient-to-b from-black/0 via-black/0 to-black/0"
      >
        <div className="mx-auto w-full max-w-6xl px-5">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
              Cursos{" "}
              <span className="text-[color:var(--accent-btc)]">Gratuitos</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Aprende los fundamentos de Bitcoin y Blockchain sin costo alguno
            </p>
          </div>

          {/* Course Grid */}
          <CourseGrid courses={freeCourses} isPremium={false} />

          {/* CTA */}
          {freeCourses.length > 0 && (
            <div className="mt-12 text-center">
              <a
                href="/cursos"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold
                  bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-[length:var(--glass-blur)]
                  hover:border-[color:var(--focus-ring)] transition-all duration-300 hover:scale-[1.02]"
              >
                Ver Todos los Cursos Gratis
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Premium Courses Section */}
      <section
        id="cursos-premium"
        className="py-24 bg-gradient-to-b from-black/0 via-black/0 to-black/0"
      >
        <div className="mx-auto w-full max-w-6xl px-5">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                bg-[rgba(255,215,0,0.12)] border border-[rgba(255,215,0,0.24)]
                backdrop-blur-sm mb-4"
            >
              <span className="text-sm text-[rgba(255,215,0,0.95)] font-semibold">
                Premium
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
              Cursos{" "}
              <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                Premium
              </span>
            </h2>

            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Lleva tu carrera al siguiente nivel con certificación y mentoría
              personalizada
            </p>
          </div>

          {/* Course Grid */}
          <CourseGrid courses={premiumCourses} isPremium={true} />

          {/* Benefits */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div
              className="rounded-2xl p-8
                bg-[var(--glass-bg)] border border-[rgba(255,215,0,0.18)]
                backdrop-blur-[length:var(--glass-blur)]"
            >
              <h3 className="text-2xl font-bold text-white text-center mb-8">
                Beneficios Premium
              </h3>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "Certificados Oficiales", desc: "Verificables en blockchain" },
                  { title: "Mentoría 1-on-1", desc: "Sesiones personalizadas" },
                  { title: "Comunidad Exclusiva", desc: "Networking profesional" },
                  { title: "Proyectos Prácticos", desc: "Portfolio real" },
                  { title: "Actualizaciones", desc: "Contenido nuevo mensual" },
                  { title: "Soporte Priority", desc: "Respuestas en 24h" },
                ].map((benefit, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl mb-2">✓</div>
                    <h4 className="font-semibold text-white mb-1">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-white/60">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          {premiumCourses.length > 0 && (
            <div className="mt-12 text-center">
              <a
                href="/cursos?filter=premium"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-black font-semibold
                  bg-gradient-to-r from-[#FFD700] to-[#FFA500]
                  hover:shadow-lg hover:shadow-[rgba(255,215,0,0.35)] transition-all duration-300 hover:scale-[1.02]"
              >
                Ver Todos los Cursos Premium
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Community Section */}
      <section id="comunidad">
        <CommunitySection />
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Projects Roadmap */}
      <ProjectsRoadmap />

      {/* Mentorship Section */}
      <MentorshipSection />

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* Final CTA */}
      <section className="py-24">
        <div className="mx-auto w-full max-w-6xl px-5">
          <div className="max-w-4xl mx-auto text-center">
            <div
              className="rounded-2xl p-12
                bg-[var(--glass-bg)] border border-[var(--glass-border)]
                backdrop-blur-[length:var(--glass-blur)]"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Listo para Empezar tu Viaje en Web3?
              </h2>

              <p className="text-xl text-white/70 mb-8">
                Únete a miles de estudiantes que ya están construyendo el futuro
                descentralizado
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="#cursos-gratis"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-semibold
                    bg-gradient-to-r from-[color:var(--accent-btc)] to-[#f7931a]
                    hover:shadow-lg hover:shadow-[rgba(247,147,26,0.35)] transition-all duration-300 hover:scale-[1.02]"
                >
                  Comenzar Gratis
                </a>

                <a
                  href="#comunidad"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-semibold
                    bg-[var(--glass-bg)] border border-[var(--glass-border)]
                    backdrop-blur-[length:var(--glass-blur)]
                    hover:border-[color:var(--focus-ring)] transition-all duration-300 hover:scale-[1.02]"
                >
                  Unirse a la Comunidad
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
