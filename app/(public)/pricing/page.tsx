import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, ArrowRight, Mail } from 'lucide-react'
import { Footer } from '@/components/navigation/Footer'

/**
 * /pricing
 *
 * La pagina anterior vendia un plan Premium de 23 EUR al mes con un selector
 * Mensual/Anual, la etiqueta "Mas popular", un boton inerte de "Proximamente" y
 * preguntas frecuentes sobre cancelar la suscripcion y los metodos de pago que
 * "aceptaremos". Nada de eso existe: no hay cobros, ni sistema de pagos, ni
 * ningun curso marcado como premium.
 *
 * Aqui solo se cuenta lo que hay hoy. Sin prometer que siempre sera asi y sin
 * anunciar lo que pueda venir, que es justo lo que hacia la version anterior.
 *
 * Deja de ser componente de cliente: ya no consulta pricing_plans, asi que
 * puede exportar metadata por su cuenta y servirse estatica.
 */

const TITULO = '¿Cuánto cuesta Nodo360?'
const DESCRIPCION =
  'Hoy todo el contenido de Nodo360 es gratuito: los cursos, las rutas de aprendizaje, los exámenes y los certificados. Sin tarjeta y sin periodo de prueba.'

export const metadata: Metadata = {
  // Indexable a proposito: es una de las preguntas que la gente escribe tal
  // cual en un buscador antes de registrarse en ningun sitio.
  alternates: { canonical: '/pricing' },
  // Absoluto, sin el "| Nodo360" de la plantilla: la marca ya esta dentro del
  // titulo. Con el sufijo salia "¿Cuánto cuesta Nodo360? | Nodo360", que dice
  // la marca dos veces. Es la unica publica que se sale del formato comun, y
  // se sale por la razon que el formato pretende garantizar.
  title: { absolute: TITULO },
  description: DESCRIPCION,
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Nodo360',
    url: '/pricing',
    // Sin sufijo tambien aqui: la tarjeta que se comparte es donde mas se
    // nota la marca repetida.
    title: TITULO,
    description: DESCRIPCION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRIPCION,
  },
}

const INCLUIDO = [
  'Los cursos completos, con su temario y todas sus lecciones',
  'Las rutas de aprendizaje, que ordenan los cursos y dicen por dónde empezar',
  'El examen final de cada curso',
  'El certificado verificable al aprobarlo',
  'El glosario, el blog y la comunidad',
]

const SIN_CUENTA = [
  'Leer cualquier lección completa',
  'Ver el temario de cada curso y las rutas',
  'Consultar el glosario y el blog',
]

const CON_CUENTA = [
  'Guardar tu progreso de una sesión a otra',
  'Escribir notas en las lecciones',
  'Hacer el examen final y obtener el certificado',
  'Preguntar en los comentarios de cada lección',
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Respuesta, antes que nada */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {TITULO}
          </h1>
          <p className="text-2xl sm:text-3xl font-semibold text-brand-light mb-6">
            Hoy, nada.
          </p>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Todo el contenido es gratuito: los cursos, las rutas de aprendizaje,
            los exámenes y los certificados. No pedimos tarjeta y no hay ningún
            periodo de prueba que caduque.
          </p>
        </div>

        {/* Que entra */}
        <section className="mt-14 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white mb-5">
            Qué incluye
          </h2>
          <ul className="space-y-3">
            {INCLUIDO.map((linea) => (
              <li key={linea} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-400" aria-hidden />
                <span className="text-white/80">{linea}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Lo unico que separa a una persona con cuenta de una sin ella */}
        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-dark-surface p-6">
            <h2 className="text-lg font-semibold text-white mb-1">
              Sin cuenta
            </h2>
            <p className="text-sm text-white/50 mb-4">
              No hace falta registrarse para estudiar.
            </p>
            <ul className="space-y-2.5">
              {SIN_CUENTA.map((linea) => (
                <li key={linea} className="flex items-start gap-2.5 text-sm text-white/70">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/40" aria-hidden />
                  {linea}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-dark-surface p-6">
            <h2 className="text-lg font-semibold text-white mb-1">
              Con cuenta gratuita
            </h2>
            <p className="text-sm text-white/50 mb-4">
              Todo lo anterior, y además:
            </p>
            <ul className="space-y-2.5">
              {CON_CUENTA.map((linea) => (
                <li key={linea} className="flex items-start gap-2.5 text-sm text-white/70">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-light" aria-hidden />
                  {linea}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* A donde va quien ya lo tiene claro */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login?mode=register"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-light px-6 py-3 font-medium text-white transition-colors hover:bg-brand"
          >
            Crear cuenta gratis
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/cursos"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3 font-medium text-white transition-colors hover:bg-white/5"
          >
            Ver los cursos
          </Link>
        </div>

        {/* Equipos */}
        <section className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            ¿Formación para tu equipo?
          </h2>
          <p className="text-white/60 mb-6 max-w-lg mx-auto">
            Si quieres usar Nodo360 para formar a un grupo de personas,
            escríbenos y lo vemos.
          </p>
          <a
            href="mailto:soporte@nodo360.com"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white transition-colors hover:bg-white/20"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Escríbenos
          </a>
        </section>

        <p className="mt-10 text-center text-sm text-white/40">
          ¿Otra duda? Está resuelta en las{' '}
          <Link href="/faq" className="text-white/60 underline hover:text-white">
            preguntas frecuentes
          </Link>
          .
        </p>
      </main>

      <Footer />
    </div>
  )
}
