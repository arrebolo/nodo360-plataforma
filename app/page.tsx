// app/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoggedIn = !!user

  return (
    <main className="min-h-screen bg-[#050711] text-white">
      {/* Hero principal */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Texto principal */}
          <div>
            <p className="text-sm font-semibold text-[#f7931a] tracking-wide mb-3">
              Educación Bitcoin · Blockchain · Web3
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Forma tu mentalidad{' '}
              <span className="bg-gradient-to-r from-[#ff6b35] to-[#f7931a] bg-clip-text text-transparent">
                cripto y Web3
              </span>{' '}
              con Nodo360
            </h1>
            <p className="text-gray-400 text-sm md:text-base mb-6 max-w-xl">
              Plataforma en español para aprender Bitcoin, seguridad en crypto y
              fundamentos de Web3 con rutas guiadas, certificados y contenido
              práctico pensado para usuarios reales.
            </p>

            {/* Botones según si hay usuario o no */}
            <div className="flex flex-wrap gap-3">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-sm font-semibold hover:opacity-90 transition"
                  >
                    Ir a mi Dashboard
                  </Link>
                  <Link
                    href="/cursos"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-white/20 text-sm font-semibold text-gray-100 hover:bg-white/5 transition"
                  >
                    Ver cursos disponibles
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-sm font-semibold hover:opacity-90 transition"
                  >
                    Empezar ahora
                  </Link>
                  <Link
                    href="/cursos"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-white/20 text-sm font-semibold text-gray-100 hover:bg-white/5 transition"
                  >
                    Ver cursos gratuitos
                  </Link>
                </>
              )}
            </div>

            {/* info pequeña de confianza */}
            <div className="mt-6 text-xs text-gray-500 space-y-1">
              <p>• Rutas formativas lineales: de cero a intermedio</p>
              <p>• Certificados descargables en PDF</p>
              <p>• Progreso guardado, XP y gamificación ligera</p>
            </div>
          </div>

          {/* Bloque visual / resumen rápido */}
          <div className="relative">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#101525] to-[#050711] p-5 shadow-xl">
              <p className="text-xs text-gray-400 mb-3">Tu avance en Nodo360</p>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Cursos disponibles</span>
                  <span className="font-semibold text-[#f7931a]">+6</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Módulos de seguridad</span>
                  <span className="font-semibold text-emerald-400">Sí</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Certificados</span>
                  <span className="font-semibold text-blue-400">
                    Emitidos en plataforma
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-1">Ejemplo de ruta</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>1. Introducción a las Criptomonedas</span>
                      <span className="text-emerald-400">✓</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>2. Seguridad en Crypto: Primeros Pasos</span>
                      <span className="text-emerald-400">✓</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>3. Bitcoin para Principiantes</span>
                      <span className="text-yellow-400">En desarrollo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* sello pequeño abajo */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  Nodo360 · Educación Bitcoin & Web3
                </span>
                <span className="text-[11px] text-gray-400">
                  Acceso 100% online
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
