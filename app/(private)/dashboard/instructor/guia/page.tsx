import Link from 'next/link'
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle,
  Clock,
  XCircle,
  Lightbulb,
  FileSearch,
  Users,
  ArrowRight,
  BookOpen,
  Video,
  Image,
  FileText,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  ChevronDown
} from 'lucide-react'

export const metadata = {
  title: 'Guía del instructor',
  description: 'Conoce el proceso de revisión de cursos, criterios de aprobación y consejos para publicar tu curso en Nodo360.',
  // Fuera de los buscadores. Es una pagina operativa del flujo de instructor:
  // no esta en el sitemap y solo la enlazan cuatro pantallas del panel privado,
  // asi que indexarla solo servia para que alguien llegase de fuera a un
  // procedimiento interno. En el paso 7 se funde en la guia del instructor y
  // esta ruta queda como redirección.
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

const approvalCriteria = [
  {
    icon: FileText,
    title: 'Contenido original y de calidad',
    description: 'El curso debe contener información precisa, actualizada y ser de tu propia creación.',
  },
  {
    icon: BookOpen,
    title: 'Mínimo 3 módulos con lecciones',
    description: 'Estructura tu curso en al menos 3 módulos con contenido sustancial en cada uno.',
  },
  // Habia un criterio «Video o contenido multimedia: incluye videos
  // explicativos...». Las 111 lecciones publicadas tienen video_url a NULL: el
  // criterio contradecia el catalogo entero y habria hecho rechazable todo lo
  // que hay publicado.
  {
    icon: FileText,
    title: 'Descripción clara del curso',
    description: 'Explica qué aprenderá el estudiante, requisitos previos y para quién es el curso.',
  },
  {
    icon: Image,
    title: 'Thumbnail y banner de calidad',
    description: 'Imágenes profesionales que representen el contenido del curso.',
  },
]

const rejectionReasons = [
  {
    icon: XCircle,
    title: 'Contenido duplicado',
    description: 'El curso copia contenido de otras fuentes sin valor añadido.',
  },
  {
    icon: Video,
    title: 'Calidad de vídeo o audio baja',
    description: 'Videos borrosos, audio con ruido o mala iluminacion.',
  },
  {
    icon: AlertTriangle,
    title: 'Información incorrecta',
    description: 'Datos erroneos sobre Bitcoin, blockchain o conceptos tecnicos.',
  },
  {
    icon: BookOpen,
    title: 'Falta de estructura',
    description: 'Contenido desorganizado sin progresión lógica de aprendizaje.',
  },
]

const tips = [
  'Graba videos con buena iluminacion y audio limpio',
  'Estructura tu curso de lo básico a lo avanzado',
  'Incluye ejercicios prácticos en cada módulo',
  'Revisa la ortografia y gramatica de todo el contenido',
  'Usa ejemplos reales y casos de uso prácticos',
  'Añade recursos descargables (PDFs, checklists, etc.)',
  'Pide comentarios a colegas antes de enviar a revisión',
  'Verifica que todos los enlaces y recursos funcionen',
]

const faqs = [
  {
    // Decia «entre 24-48 horas habiles» y «+24 horas tras las correcciones».
    // course_reviews tiene 0 filas: ningun curso ha pasado nunca por este
    // flujo, asi que ese plazo no lo ha medido nadie.
    question: '¿Cuánto tiempo tarda la revisión?',
    answer: 'Cada curso se revisa antes de publicarse. Hoy lo revisa el equipo de Nodo360; no hay un plazo fijo, pero recibirás respuesta por correo.',
  },
  {
    // Decia «mentores certificados de Nodo360».
    // instructor_certifications tiene 0 filas y hay un unico mentor: no hay
    // ninguna certificacion emitida detras de esa palabra.
    question: '¿Quién revisa los cursos?',
    answer: 'Hoy la revisión la hace el equipo de Nodo360. Cuando haya mentores verificados, cada curso lo revisarán dos.',
  },
  {
    question: '¿Qué pasa si mi curso es rechazado?',
    answer: 'Recibirás un correo detallado con los motivos del rechazo y recomendaciones para mejorar. Podrás hacer los cambios y volver a enviar sin límite de intentos.',
  },
  {
    question: '¿Puedo editar mi curso después de publicado?',
    answer: 'Si, pero los cambios significativos requeriran una nueva revisión para mantener la calidad de la plataforma.',
  },
  {
    // Decia que los instructores reciben «entre 35-40 % de cada venta» y que se
    // paga «mensualmente via transferencia bancaria o crypto». Nada de eso
    // existe: no hay ventas, ni pasarela de pago, ni acuerdo con nadie.
    question: '¿Cobro algo por publicar un curso?',
    answer: 'Hoy todo el contenido de Nodo360 es gratuito y no hay remuneración para instructores. Si en el futuro hay monetización, las condiciones se acordarán por escrito antes de cualquier cobro.',
  },
]

export default function GuiaRevisionPage() {
  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      {/*
        Aqui habia una cabecera propia con el logo y un boton de «Iniciar
        sesion», y un pie con enlaces legales. Sobraban los dos: esta pagina
        vivia en el area publica y ahora esta dentro del panel, que ya trae su
        cabecera y su pie. En su sitio, volver a donde estabas.
      */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <Link
          href="/dashboard/instructor"
          className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white/80"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al panel
        </Link>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-light/10 border border-brand-light/20 text-brand-light text-sm mb-6">
            <FileSearch className="w-4 h-4" />
            Guía para instructores
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Guía de revisión de cursos
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Todo lo que necesitas saber para que tu curso sea aprobado y publicado en Nodo360
          </p>
        </div>

        {/* Section 1: How it works */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-light/20">
              <FileSearch className="w-5 h-5 text-brand-light" />
            </div>
            ¿Cómo funciona la revisión?
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-light/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-brand-light font-bold">1</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Envias tu curso</h3>
                <p className="text-sm text-white/60">
                  Completa todos los campos requeridos y haz clic en "Enviar a revisión"
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-light/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-brand-light font-bold">2</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Lo revisa el equipo</h3>
                <p className="text-sm text-white/60">
                  Hoy la revisión la hace el equipo de Nodo360. Cuando haya mentores verificados, cada curso lo revisarán dos
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-light/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-brand-light font-bold">3</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Recibirás respuesta</h3>
                <p className="text-sm text-white/60">
                  Te notificaremos por email si fue aprobado o si necesita cambios
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 text-white/70">
                <Users className="w-5 h-5 text-brand-light" />
                <span>
                  {/* Decia «Tu curso es evaluado por dos revisores (mentores o
                      instructores especializados)». Hay un unico mentor y cero
                      certificaciones emitidas: la revisión a dos es el destino,
                      no lo que pasa hoy. */}
                  <strong className="text-white">A dos, cuando se pueda:</strong> la revisión con dos personas es el objetivo, para que la calidad no dependa de un solo criterio. Mientras no haya mentores verificados, la hace el equipo de Nodo360.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Approval Criteria */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/20">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            Criterios de aprobación
          </h2>
          <div className="grid gap-4">
            {approvalCriteria.map((criteria, index) => {
              const Icon = criteria.icon
              return (
                <div
                  key={index}
                  className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{criteria.title}</h3>
                    <p className="text-sm text-white/60">{criteria.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Section 3: Plazos */}
        {/*
          Aqui habia dos cifras en grande: «24-48 horas · Días habiles» para la
          revisión inicial y «+24 horas» tras las correcciones. No salen de
          ninguna medida: course_reviews tiene 0 filas. Un plazo inventado en
          tipografia grande es una promesa, y se incumple sola.
        */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/20">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            Plazos
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <p className="text-white/70 leading-relaxed">
              Cada curso se revisa antes de publicarse. Hoy lo revisa el equipo de
              Nodo360; <strong className="text-white/90">no hay un plazo fijo</strong>,
              pero recibirás respuesta por correo. Si hay que corregir algo, te
              decimos qué, y puedes volver a enviarlo sin límite de intentos.
            </p>
          </div>
        </section>

        {/* Section 4: Rejection Reasons */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-error/20">
              <XCircle className="w-5 h-5 text-error" />
            </div>
            Motivos comunes de rechazo
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {rejectionReasons.map((reason, index) => {
              const Icon = reason.icon
              return (
                <div
                  key={index}
                  className="rounded-xl border border-error/20 bg-error/5 p-5 flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-error/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-error" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{reason.title}</h3>
                    <p className="text-sm text-white/60">{reason.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Section 5: Tips */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-light/20">
              <Lightbulb className="w-5 h-5 text-brand-light" />
            </div>
            Consejos para aprobar a la primera
          </h2>
          <div className="rounded-2xl border border-brand-light/20 bg-brand-light/5 p-6 backdrop-blur-sm">
            <ul className="grid md:grid-cols-2 gap-3">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-brand-light flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* La verificacion: sin esto, enviar a revision no funciona */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <BadgeCheck className="w-5 h-5 text-blue-300" aria-hidden="true" />
            </div>
            Antes de enviar: la verificación
          </h2>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-6 space-y-4">
            <p className="text-white/75 leading-relaxed">
              Para enviar un curso a revisión hace falta estar{' '}
              <strong className="text-white">verificado en su especialidad</strong>. No en
              general: en esa. Verificado en Bitcoin no es verificado en fiscalidad, y es lo
              que hace que el sello junto a tu nombre signifique algo.
            </p>
            <p className="text-white/65 leading-relaxed text-sm">
              Escribir el borrador no requiere nada: puedes preparar el material mientras
              te verificas, y de hecho es el orden natural. Lo que pide la verificación es
              pedir que se publique.
            </p>
            <p className="text-white/65 leading-relaxed text-sm">
              El curso también necesita tener una especialidad asignada. Si no la tiene, el
              envío se detiene ahí y hay que clasificarlo primero.
            </p>
            <Link
              href="/dashboard/instructor/verificacion"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-200 transition-colors hover:bg-blue-500/30"
            >
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              Mi verificación
            </Link>
          </div>
        </section>

        {/* Section 6: FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group rounded-xl border border-white/10 bg-white/5 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-semibold text-white pr-4">{faq.question}</span>
                  <ChevronDown className="w-5 h-5 text-white/60 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 pt-0">
                  <p className="text-white/70">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="rounded-2xl border border-brand-light/20 bg-gradient-to-br from-brand-light/10 via-brand/5 to-transparent p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-3">
              ¿Listo para crear tu curso?
            </h2>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Comienza ahora y comparte lo que sabes con quienes estudian en la plataforma
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/dashboard/instructor/cursos/nuevo"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-light to-brand text-white font-medium hover:opacity-90 transition-opacity"
              >
                Crear mi curso
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/dashboard/instructor/onboarding"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-colors"
              >
                Ver guía de inicio
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
