import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Map, Library, Home } from 'lucide-react'
import { Footer } from '@/components/navigation/Footer'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  // Una pagina que no existe no se indexa. follow queda en true: los enlaces
  // que ofrece abajo son los buenos y conviene que se sigan.
  robots: { index: false, follow: true },
}

const DESTINOS = [
  { href: '/cursos', icono: BookOpen, titulo: 'Cursos', que: 'Bitcoin, blockchain y Web3, de cero' },
  { href: '/rutas', icono: Map, titulo: 'Rutas de aprendizaje', que: 'Los cursos en orden, por dónde empezar' },
  { href: '/glosario', icono: Library, titulo: 'Glosario', que: 'Los términos, explicados uno a uno' },
]

/**
 * El 404 del sitio.
 *
 * Hasta ahora no existia este fichero, asi que Next servia el suyo: un
 * "404: This page could not be found." en ingles, sin cabecera, sin pie y sin
 * una sola salida. En un sitio en español, a cualquiera que escriba mal una
 * URL o siga un enlace viejo.
 *
 * La cabecera la pone app/layout.tsx; aqui van el contenido y el pie.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-light mb-3">
          Error 404
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Esta página no existe
        </h1>
        <p className="text-lg text-white/70 max-w-xl leading-relaxed">
          Puede que el enlace esté mal escrito, o que la página se moviera al
          reorganizar los cursos. No se ha perdido nada: todo sigue aquí.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {DESTINOS.map(({ href, icono: Icono, titulo, que }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-white/10 bg-dark-surface p-5 transition-colors hover:border-white/20 hover:bg-white/5"
            >
              <Icono className="h-5 w-5 text-brand-light mb-3" aria-hidden />
              <p className="font-semibold text-white">{titulo}</p>
              <p className="mt-1 text-sm text-white/55">{que}</p>
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <Home className="h-4 w-4" aria-hidden />
          Volver a la portada
        </Link>
      </main>

      <Footer />
    </div>
  )
}
