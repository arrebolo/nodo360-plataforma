import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BookOpen, CheckCircle2, Clock, FlaskConical, Monitor, Signal, TriangleAlert } from 'lucide-react'
import { Footer } from '@/components/navigation/Footer'
import { AvisoEducativo } from '@/components/legal/AvisoEducativo'
import { CuerpoDelTutorial } from '@/components/tutoriales/CuerpoDelTutorial'
import { EnlaceACurso } from '@/components/enlazado/EnlaceACurso'
import { destinoDelCurso } from '@/lib/enlazado/enlace'
import { listarTutoriales, obtenerTutorial } from '@/lib/tutoriales/fuente'
import { CATEGORIAS, NIVELES, REDES, SISTEMAS, type Tutorial } from '@/lib/tutoriales/tipos'

interface Props {
  params: Promise<{ slug: string }>
}

// La lista de slugs se calcula al construir. Uno que no esté en ella es un 404,
// también un borrador en producción.
export const dynamicParams = false

export function generateStaticParams() {
  return listarTutoriales().map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const t = obtenerTutorial(slug)
  if (!t) return { title: 'Tutorial no encontrado' }
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'
  return {
    title: t.titulo,
    description: t.resumen,
    alternates: { canonical: `${baseUrl}/tutoriales/${t.slug}` },
    // Fuera de los buscadores hasta que haya tres tutoriales publicados: la
    // sección todavía no se anuncia (fase 1, PR 5 del diseño).
    robots: { index: false, follow: true },
  }
}

function fecha(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default async function TutorialPage({ params }: Props) {
  const { slug } = await params
  const t = obtenerTutorial(slug)
  if (!t) notFound()

  const titulosDeTutoriales = new Map(listarTutoriales().map((x) => [x.slug, x.titulo]))

  return (
    <div className="min-h-screen bg-dark">
      <div className="bg-gradient-to-b from-brand/10 via-brand-light/5 to-transparent pt-10 pb-8 sm:pt-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <nav aria-label="Migas de pan" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/50">
            <Link href="/" className="transition hover:text-white">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link href="/tutoriales" className="transition hover:text-white">Tutoriales</Link>
            <span aria-hidden="true">/</span>
            <span>{CATEGORIAS[t.categoria]}</span>
          </nav>

          {t.estado === 'borrador' && (
            <p className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
              Borrador: esta página solo se ve en desarrollo y en las previsualizaciones. En producción no existe.
            </p>
          )}
          {t.estado === 'revisar' && (
            <p className="mb-6 flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              Hay una versión más reciente de algún programa de este tutorial. Puede haber diferencias con lo que
              ves en pantalla mientras lo revisamos.
            </p>
          )}

          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">{t.titulo}</h1>
          <p className="mt-4 text-lg text-white/70">{t.resumen}</p>

          <Ficha t={t} />
          <Requisitos t={t} titulos={titulosDeTutoriales} />
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
        <CuerpoDelTutorial tutorial={t} />
      </article>

      {t.cursos.length > 0 && <CursosRelacionados t={t} />}

      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <AvisoEducativo tipo="tutorial" />
      </div>

      <Footer />
    </div>
  )
}

function Ficha({ t }: { t: Tutorial }) {
  const dato = 'flex items-center gap-2 text-sm text-white/70'
  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={dato}>
          <Signal className="h-4 w-4 text-white/40" aria-hidden="true" />
          <dt className="sr-only">Nivel</dt>
          <dd>Nivel {NIVELES[t.nivel].toLowerCase()}</dd>
        </div>
        <div className={dato}>
          <Clock className="h-4 w-4 text-white/40" aria-hidden="true" />
          <dt className="sr-only">Tiempo</dt>
          <dd>Unos {t.duracionMinutos} minutos</dd>
        </div>
        <div className={dato}>
          <Monitor className="h-4 w-4 text-white/40" aria-hidden="true" />
          <dt className="sr-only">Sistemas</dt>
          <dd>{t.sistemas.map((s) => SISTEMAS[s]).join(', ')}</dd>
        </div>
        <div className={dato}>
          <FlaskConical className="h-4 w-4 text-white/40" aria-hidden="true" />
          <dt className="sr-only">Red</dt>
          <dd>{REDES[t.red]}</dd>
        </div>
      </dl>
      {t.programas.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-white/10 pt-4 text-sm text-white/60">
          {t.programas.map((p) => (
            <li key={p.nombre} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/40" aria-hidden="true" />
              <span>
                {p.probadoEl ? (
                  <>
                    Probado con <strong className="font-medium text-white/80">{p.nombre} {p.version}</strong> el{' '}
                    {fecha(p.probadoEl)}
                    {p.probadoEn ? `, en ${p.probadoEn}` : ''}.
                  </>
                ) : (
                  <>
                    <strong className="font-medium text-white/80">{p.nombre} {p.version}</strong>: sin probar todavía.
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Requisitos({ t, titulos }: { t: Tutorial; titulos: Map<string, string> }) {
  if (!t.requisitos.length) return null
  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">Antes de empezar</h2>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-white/80 marker:text-white/40">
        {t.requisitos.map((r, i) =>
          'texto' in r ? (
            <li key={i}>{r.texto}</li>
          ) : (
            <li key={i}>
              Haber hecho{' '}
              <Link href={`/tutoriales/${r.tutorial}`} className="text-brand-light underline underline-offset-2">
                {titulos.get(r.tutorial) ?? r.tutorial}
              </Link>
            </li>
          )
        )}
      </ul>
    </div>
  )
}

function CursosRelacionados({ t }: { t: Tutorial }) {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
      <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/10 to-brand-light/5 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <BookOpen className="h-5 w-5 text-brand-light" aria-hidden="true" />
          Para entender lo que hay detrás
        </h2>
        <ul className="mt-3 space-y-2">
          {t.cursos.map((c) => {
            const d = destinoDelCurso(c.curso, c.leccion)
            return (
              <li key={d.url} className="text-white/70">
                <EnlaceACurso url={d.url} origen="tutorial" slugOrigen={t.slug} courseSlug={c.curso} variante="texto">
                  {d.titulo}
                </EnlaceACurso>{' '}
                ({d.nivel}){d.esLeccion ? ', en la lección que trata justo esto' : ''}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
