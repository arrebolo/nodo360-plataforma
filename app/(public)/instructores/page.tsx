import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, FileText, Users, CheckCircle2, RotateCcw, XCircle, BadgeCheck, FileSearch, BookOpen, Sparkles } from 'lucide-react'
import { Footer } from '@/components/navigation/Footer'

/**
 * /instructores  ·  "Hazte instructor"
 *
 * Antes era un listado de instructores certificados. Dos problemas:
 *
 *   1. instructor_profiles tiene UNA fila, y es interna. La pagina anunciaba un
 *      claustro que no existe.
 *   2. Consultaba learning_paths.title, columna que no existe -se llama name-,
 *      asi que la consulta fallaba, learningPaths quedaba en null y el filtro
 *      por ruta se pintaba vacio sin que nada avisara.
 *
 * Un listado de una persona no es un listado. Lo que si hay que contar es como
 * se entra, porque eso si funciona: el circuito de revision por mentores esta
 * construido y en uso (paginas de revision en admin y mentor, y los tres
 * correos de aprobado, cambios solicitados y rechazado).
 *
 * NADA DE INGRESOS. No hay pagos, ni reparto, ni cursos de pago. Prometer
 * cualquier cosa en esa direccion seria exactamente lo que este proyecto dice
 * no hacer.
 */

const TITULO = 'Hazte instructor'
const DESCRIPCION =
  'Cómo publicar un curso en Nodo360: qué se espera del material, cómo lo revisan los mentores y cómo proponer el tuyo.'

export const metadata: Metadata = {
  alternates: { canonical: '/instructores' },
  title: TITULO,
  description: DESCRIPCION,
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Nodo360',
    url: '/instructores',
    title: `${TITULO} | Nodo360`,
    description: DESCRIPCION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITULO} | Nodo360`,
    description: DESCRIPCION,
  },
}

const LO_QUE_SE_ESPERA = [
  {
    titulo: 'Se explica, no se recomienda',
    texto:
      'El material cuenta cómo funcionan las cosas. No dice qué comprar, ni cuándo, ni promete rentabilidades. Un curso que termina en una recomendación de inversión no entra.',
  },
  {
    titulo: 'Con fuentes, y citadas',
    texto:
      'Las cifras y los hechos llevan de dónde salen. Cuando una fuente oficial no da un dato, se dice que no lo da en lugar de rellenarlo con una estimación de terceros.',
  },
  {
    titulo: 'Español neutro',
    texto:
      'Válido en España y en Latinoamérica. Sin localismos que obliguen a media clase a buscar qué significa una palabra.',
  },
  {
    titulo: 'Sin hype',
    texto:
      'Ni «domina», ni «de cero a experto», ni «el futuro del dinero». El tema ya es interesante; el adjetivo sobra y resta credibilidad.',
  },
  {
    titulo: 'Lo que no se sabe, se dice',
    texto:
      'En Bitcoin y Web3 hay preguntas abiertas y cosas que cambian. Un curso que las esquiva envejece peor que uno que las señala.',
  },
]

const VERIFICACION = [
  {
    icono: FileSearch,
    titulo: 'Eliges la especialidad',
    texto:
      'Hay once: fundamentos de Bitcoin, seguridad y custodia, nodos, Lightning, blockchain y consenso, Ethereum y contratos, DeFi, Web3, mercados, fiscalidad y derecho. Se pide una, no todas.',
  },
  {
    icono: BookOpen,
    titulo: 'Si la especialidad tiene examen, lo haces',
    texto:
      'Quince preguntas de su banco, distintas en cada intento, con las opciones en otro orden. Mide lo que sabes de la materia, no lo bien que se te da un test: la nota no decide nada por sí sola.',
  },
  {
    icono: Users,
    titulo: 'Y después hablamos',
    texto:
      'Repreguntas en voz alta sobre lo que respondiste, y una parte práctica. Es donde se distingue a quien entendió de quien recuerda cuál era la opción correcta, y sin las dos no hay verificación.',
  },
  {
    icono: Sparkles,
    titulo: 'Decide una persona, y lo escribe',
    texto:
      'No aprueba el examen: aprueba quien evalúa, con sus notas. Si te la deniegan te dicen por qué, y puedes volver a pedirla. Fiscalidad y derecho piden además acreditación profesional: ahí un examen nuestro no basta.',
  },
]

const REVISION = [
  {
    icono: FileText,
    titulo: 'Propones el curso',
    texto:
      'Un guion: a quién va dirigido, qué sabrá hacer quien lo termine, los módulos y las lecciones. No hace falta tenerlo escrito para proponerlo.',
  },
  {
    icono: Users,
    titulo: 'Lo revisa una persona',
    texto:
      'Alguien lee el material entero antes de que lo vea ningún alumno. Hoy lo hace el equipo de Nodo360; cuando haya mentores verificados, cada curso lo revisarán dos. No es un trámite: es el filtro del que depende que esto se pueda leer sin desconfiar.',
  },
  {
    icono: RotateCcw,
    titulo: 'Casi siempre hay cambios',
    texto:
      'Lo normal es una ronda de correcciones con comentarios concretos. Se recibe por correo, se corrige y se vuelve a enviar. Las veces que hagan falta.',
  },
  {
    icono: CheckCircle2,
    titulo: 'Se publica',
    texto:
      'El curso entra en el catálogo con tu nombre, tu biografía y el enlace que quieras. Gratuito para cualquiera, como todos los demás.',
  },
]

const HOY_RECIBES = [
  'Tu nombre y tu biografía en la ficha del curso y en cada lección.',
  'Una revisión seria de tu material, con comentarios concretos, la haya escrito quien la haya escrito.',
  'El curso alojado, mantenido y traducido al formato de la plataforma: módulos, examen y certificado verificable para tus alumnos.',
  'Acceso al panel de instructor para ver cuánta gente lo está haciendo y por dónde va.',
]

export default function InstructoresPage() {
  return (
    <div className="min-h-screen bg-dark">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-light mb-3">
          Instructores
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-5">
          {TITULO}
        </h1>
        <p className="text-lg text-white/70 leading-relaxed max-w-2xl">
          Nodo360 publica cursos de Bitcoin, blockchain y Web3 en español. Si
          sabes de algo de esto y quieres enseñarlo, esta página cuenta qué se
          espera del material, quién lo revisa y cómo proponerlo.
        </p>

        {/* Aviso de tamaño: mejor decirlo que dejar que se descubra */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-white/70 leading-relaxed">
            Conviene saberlo antes de escribir nada:{' '}
            <strong className="text-white/90">
              esto es un proyecto pequeño y todos los cursos son gratuitos
            </strong>
            . No hay pagos a instructores ni reparto de ingresos, porque no hay
            ingresos que repartir. Lo que hay es un catálogo cuidado, gente
            estudiándolo y una revisión que se toma en serio.
          </p>
        </div>

        {/* Qué se espera */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-white mb-2">
            Qué se espera de un curso
          </h2>
          <p className="text-white/60 mb-8">
            Son los mismos criterios con los que se revisa el material que ya
            está publicado.
          </p>
          <div className="space-y-5">
            {LO_QUE_SE_ESPERA.map((c) => (
              <div key={c.titulo} className="border-l-2 border-brand-light/40 pl-5">
                <h3 className="font-semibold text-white mb-1">{c.titulo}</h3>
                <p className="text-white/65 leading-relaxed">{c.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cómo funciona la revisión */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-white mb-8">
            Cómo funciona la revisión
          </h2>
          <div className="space-y-6">
            {REVISION.map(({ icono: Icono, titulo, texto }, i) => (
              <div key={titulo} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light/10">
                    <Icono className="h-5 w-5 text-brand-light" aria-hidden />
                  </div>
                  {i < REVISION.length - 1 && (
                    <div className="mt-2 w-px flex-1 bg-white/10" />
                  )}
                </div>
                <div className="pb-2">
                  <h3 className="font-semibold text-white mb-1">{titulo}</h3>
                  <p className="text-white/65 leading-relaxed">{texto}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/10 bg-dark-surface p-5">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-white/40" aria-hidden />
            <p className="text-sm text-white/60 leading-relaxed">
              También se rechazan cursos, y se explica por qué. Casi siempre es
              por tono —material que vende en vez de explicar— o por afirmaciones
              sin respaldo. No es un juicio sobre quien lo escribió.
            </p>
          </div>
        </section>

        {/* La verificación, que es lo que habilita a publicar */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-white mb-2">
            La verificación es por especialidad
          </h2>
          <p className="text-white/60 mb-6">
            No se verifica «a instructores»: se verifica en una materia concreta.
          </p>

          <div className="space-y-6">
            {VERIFICACION.map(({ icono: Icono, titulo, texto }, i) => (
              <div key={titulo} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                    <Icono className="h-5 w-5 text-blue-300" aria-hidden />
                  </div>
                  {i < VERIFICACION.length - 1 && (
                    <div className="mt-2 w-px flex-1 bg-white/10" />
                  )}
                </div>
                <div className="pb-2">
                  <h3 className="font-semibold text-white mb-1">{titulo}</h3>
                  <p className="text-white/65 leading-relaxed">{texto}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/10 bg-dark-surface p-5">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" aria-hidden />
            <p className="text-sm text-white/60 leading-relaxed">
              Estar verificado en una especialidad no habilita en las demás.
              Verificado en Bitcoin no es verificado en fiscalidad, y el sello
              que aparece junto a tu nombre dice en qué, no «verificado» a secas.
              Es la única forma de que signifique algo.
            </p>
          </div>
        </section>

        {/* Qué recibes hoy */}
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-white mb-2">
            Qué recibes hoy
          </h2>
          <p className="text-white/60 mb-6">
            Literalmente lo que hay ahora mismo, sin contar planes.
          </p>
          <ul className="space-y-3">
            {HOY_RECIBES.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" aria-hidden />
                <span className="text-white/70 leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Cómo aplicar */}
        <section className="mt-14 rounded-2xl border border-brand-light/25 bg-brand-light/[0.06] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white mb-3">
            Cómo proponer un curso
          </h2>
          <p className="text-white/70 leading-relaxed mb-2">
            Por ahora, escribiendo. No hay formulario todavía y preferimos
            decirlo a poner uno que no lleve a ninguna parte.
          </p>
          <p className="text-white/70 leading-relaxed mb-6">
            Cuéntanos quién eres, sobre qué querrías escribir y a quién va
            dirigido. Con tres párrafos basta para empezar a hablar.
          </p>
          <a
            href="mailto:instructores@nodo360.com?subject=Propuesta%20de%20curso"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-light px-6 py-3 font-medium text-white transition-colors hover:bg-brand"
          >
            <Mail className="h-4 w-4" aria-hidden />
            instructores@nodo360.com
          </a>
        </section>

        <p className="mt-10 text-sm text-white/40">
          ¿Prefieres empezar estudiando?{' '}
          <Link href="/cursos" className="text-white/60 underline hover:text-white">
            Mira el catálogo
          </Link>
          .
        </p>
      </main>

      <Footer />
    </div>
  )
}
