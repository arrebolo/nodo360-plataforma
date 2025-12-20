import Image from "next/image"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative hero-animated-bg">
      {/* Background layers (from globals.css) */}
      <div className="n360-bg" />
      <div className="n360-grid" />

      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left - Texto */}
          <div className="max-w-lg">
            <div className="n360-badge text-white/80">
              <span className="text-[color:var(--accent-btc)]">●</span>
              <span className="text-sm">Formación Web3 práctica, en español</span>
              <span className="text-xs text-white/55">Certificados verificables</span>
            </div>

            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Aprende Bitcoin,
              <span className="block">
                Blockchain y{" "}
                <span className="text-[color:var(--accent-btc)]">Web3</span>
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-lg text-white/70">
              Cursos claros, rutas guiadas y progreso real. Entra gratis, avanza módulo a módulo y obtén certificados verificables.
            </p>

            <div className="mt-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/cursos" className="n360-btn n360-btn-primary">
                  Explorar cursos gratis
                  <span aria-hidden>→</span>
                </Link>

                <Link href="/cursos?filter=premium" className="n360-btn n360-btn-secondary">
                  Ver premium
                  <span aria-hidden>↗</span>
                </Link>
              </div>
              <p className="mt-3 text-xs text-white/50">
                Sin tarjeta de crédito · Certificados verificables en blockchain
              </p>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-6 text-white/80">
              <div className="n360-glass p-4">
                <div className="text-2xl font-semibold">5K+</div>
                <div className="text-xs text-white/60">Estudiantes</div>
              </div>
              <div className="n360-glass p-4">
                <div className="text-2xl font-semibold">25+</div>
                <div className="text-xs text-white/60">Cursos</div>
              </div>
              <div className="n360-glass p-4">
                <div className="text-2xl font-semibold">Rutas</div>
                <div className="text-xs text-white/60">Aprendizaje guiado</div>
              </div>
            </div>
          </div>

          {/* Right: Product preview */}
          <div className="relative scale-[1.02] hover:scale-[1.04] transition-transform duration-300">
            {/* Etiqueta flotante */}
            <div className="absolute -top-3 left-6 z-10 px-3 py-1 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-full text-xs font-medium text-white shadow-lg shadow-orange-500/25">
              Tu progreso real
            </div>

            <div className="n360-glass p-6 shadow-xl shadow-orange-500/10 hover:shadow-orange-500/20 transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/60">Vista previa</div>
                  <div className="mt-1 font-semibold">Ruta: Fundamentos de Bitcoin</div>
                </div>
                <div className="text-xs text-white/60">Progreso</div>
              </div>

              <div className="mt-5 n360-glass p-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[rgba(247,147,26,0.18)] border border-[rgba(247,147,26,0.25)]" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Bitcoin para principiantes</div>
                    <div className="mt-1 text-xs text-white/60">Módulo 1 · Lección 3</div>
                  </div>
                  <div className="text-xs text-white/60">32%</div>
                </div>

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[32%] bg-[color:var(--accent-btc)]" />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-white/60">Certificado al completar</div>
                  <div className="text-xs text-white/80">Verificable</div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between n360-glass p-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/imagenes/logo-nodo360.png"
                    alt="Nodo360"
                    width={44}
                    height={44}
                    className="rounded-xl"
                  />
                  <div>
                    <div className="text-sm font-semibold">Nodo360</div>
                    <div className="text-xs text-white/60">Educación Bitcoin</div>
                  </div>
                </div>
                <div className="text-xs text-white/60">Live</div>
              </div>
            </div>

            {/* Controlled glow (subtle) */}
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[28px] bg-[radial-gradient(ellipse_at_center,rgba(247,147,26,0.18),transparent_60%)]" />
          </div>
        </div>
      </div>
    </section>
  )
}
