import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Clock, Monitor, Signal } from 'lucide-react'
import { Footer } from '@/components/navigation/Footer'
import { listarTutoriales } from '@/lib/tutoriales/fuente'
import { CATEGORIAS, NIVELES, SISTEMAS } from '@/lib/tutoriales/tipos'

export const metadata: Metadata = {
  title: 'Tutoriales prácticos de Bitcoin',
  description:
    'Tareas prácticas de principio a fin, en 10-20 minutos: verificar descargas, crear carteras y hacer transacciones en signet, sin dinero real.',
  // Fuera de los buscadores hasta que haya tres tutoriales publicados (fase 1,
  // PR 5 del diseño). Tampoco está en el menú ni en el sitemap.
  robots: { index: false, follow: true },
}

/**
 * Índice de tutoriales: una lista, de lo más básico a lo más avanzado. Los
 * filtros por categoría, nivel y sistema llegan cuando haya seis o más.
 */
export default function TutorialesPage() {
  const tutoriales = listarTutoriales()
  // Sin tutoriales que enseñar, la sección no existe (Principio #7): ni una
  // página vacía ni un «próximamente».
  if (!tutoriales.length) notFound()

  return (
    <div className="min-h-screen bg-dark">
      <div className="mx-auto max-w-3xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
        <nav aria-label="Migas de pan" className="mb-6 flex items-center gap-2 text-sm text-white/50">
          <Link href="/" className="transition hover:text-white">Inicio</Link>
          <span aria-hidden="true">/</span>
          <span>Tutoriales</span>
        </nav>

        <h1 className="text-3xl font-bold text-white sm:text-4xl">Tutoriales</h1>
        <p className="mt-4 text-lg text-white/70">
          Una tarea práctica en cada uno, de principio a fin y en 10-20 minutos. Lo que mueve monedas se hace en
          signet, la red de pruebas de Bitcoin: sus monedas no tienen valor.
        </p>

        <ol className="mt-10 space-y-4">
          {tutoriales.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/tutoriales/${t.slug}`}
                className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-brand-light/40 hover:bg-white/[0.07]"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-brand-light">
                  {CATEGORIAS[t.categoria]}
                  {t.estado === 'borrador' && <span className="ml-2 text-amber-300">· Borrador</span>}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">{t.titulo}</h2>
                <p className="mt-2 text-white/70">{t.resumen}</p>
                <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/50">
                  <span className="flex items-center gap-1.5">
                    <Signal className="h-4 w-4" aria-hidden="true" />
                    {NIVELES[t.nivel]}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    {t.duracionMinutos} min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Monitor className="h-4 w-4" aria-hidden="true" />
                    {t.sistemas.map((s) => SISTEMAS[s]).join(', ')}
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </div>
      <Footer />
    </div>
  )
}
