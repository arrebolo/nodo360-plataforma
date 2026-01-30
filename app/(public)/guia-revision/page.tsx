import Link from 'next/link'
import {
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
  title: 'Guia de Revision de Cursos | Nodo360',
  description: 'Conoce el proceso de revision de cursos, criterios de aprobacion y consejos para publicar tu curso en Nodo360.',
}

const approvalCriteria = [
  {
    icon: FileText,
    title: 'Contenido original y de calidad',
    description: 'El curso debe contener informacion precisa, actualizada y ser de tu propia creacion.',
  },
  {
    icon: BookOpen,
    title: 'Minimo 3 modulos con lecciones',
    description: 'Estructura tu curso en al menos 3 modulos con contenido sustancial en cada uno.',
  },
  {
    icon: Video,
    title: 'Video o contenido multimedia',
    description: 'Incluye videos explicativos, presentaciones o recursos interactivos.',
  },
  {
    icon: FileText,
    title: 'Descripcion clara del curso',
    description: 'Explica que aprendera el estudiante, requisitos previos y para quien es el curso.',
  },
  {
    icon: Image,
    title: 'Thumbnail y banner de calidad',
    description: 'Imagenes profesionales que representen el contenido del curso.',
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
    title: 'Calidad de video/audio baja',
    description: 'Videos borrosos, audio con ruido o mala iluminacion.',
  },
  {
    icon: AlertTriangle,
    title: 'Informacion incorrecta',
    description: 'Datos erroneos sobre Bitcoin, blockchain o conceptos tecnicos.',
  },
  {
    icon: BookOpen,
    title: 'Falta de estructura',
    description: 'Contenido desorganizado sin progresion logica de aprendizaje.',
  },
]

const tips = [
  'Graba videos con buena iluminacion y audio limpio',
  'Estructura tu curso de lo basico a lo avanzado',
  'Incluye ejercicios practicos en cada modulo',
  'Revisa la ortografia y gramatica de todo el contenido',
  'Usa ejemplos reales y casos de uso practicos',
  'Añade recursos descargables (PDFs, checklists, etc.)',
  'Pide feedback a colegas antes de enviar a revision',
  'Verifica que todos los links y recursos funcionen',
]

const faqs = [
  {
    question: '¿Cuanto tiempo tarda la revision?',
    answer: 'La revision inicial toma entre 24-48 horas habiles. Si tu curso requiere cambios, tendras 24 horas adicionales despues de hacer las correcciones.',
  },
  {
    question: '¿Quien revisa los cursos?',
    answer: 'Los cursos son revisados por mentores certificados de Nodo360 con experiencia en educacion y conocimiento profundo de Bitcoin y blockchain.',
  },
  {
    question: '¿Que pasa si mi curso es rechazado?',
    answer: 'Recibiras un email detallado con los motivos del rechazo y recomendaciones para mejorar. Podras hacer los cambios y volver a enviar sin limite de intentos.',
  },
  {
    question: '¿Puedo editar mi curso despues de publicado?',
    answer: 'Si, pero los cambios significativos requeriran una nueva revision para mantener la calidad de la plataforma.',
  },
  {
    question: '¿Como funcionan las comisiones?',
    answer: 'Los instructores reciben entre 35-40% de cada venta. Las comisiones se pagan mensualmente via transferencia bancaria o crypto.',
  },
]

export default function GuiaRevisionPage() {
  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <header className="border-b border-white/10 bg-dark-secondary/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">N</span>
            <span className="text-xl font-bold text-white">Nodo360</span>
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-brand/20 text-brand hover:bg-brand/30 transition-colors text-sm font-medium"
          >
            Iniciar sesion
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-light/10 border border-brand-light/20 text-brand-light text-sm mb-6">
            <FileSearch className="w-4 h-4" />
            Guia para instructores
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Guia de Revision de Cursos
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
            ¿Como funciona la revision?
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-light/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-brand-light font-bold">1</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Envias tu curso</h3>
                <p className="text-sm text-white/60">
                  Completa todos los campos requeridos y haz clic en "Enviar a revision"
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-light/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-brand-light font-bold">2</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Dos revisores lo evaluan</h3>
                <p className="text-sm text-white/60">
                  Dos revisores evaluarán tu contenido: dos mentores, o un mentor y un instructor especializado en la tematica del curso
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-light/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-brand-light font-bold">3</span>
                </div>
                <h3 className="font-semibold text-white mb-2">Recibiras respuesta</h3>
                <p className="text-sm text-white/60">
                  Te notificaremos por email si fue aprobado o si necesita cambios
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 text-white/70">
                <Users className="w-5 h-5 text-brand-light" />
                <span>
                  <strong className="text-white">Revision colaborativa:</strong> Tu curso es evaluado por dos revisores (mentores o instructores especializados) para garantizar calidad y objetividad.
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
            Criterios de aprobacion
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

        {/* Section 3: Timelines */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/20">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            Tiempos estimados
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-light/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-brand-light" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Revision inicial</h3>
                  <p className="text-2xl font-bold text-brand-light">24-48 horas</p>
                  <p className="text-sm text-white/60 mt-1">Dias habiles</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Tras correcciones</h3>
                  <p className="text-2xl font-bold text-warning">+24 horas</p>
                  <p className="text-sm text-white/60 mt-1">Despues de enviar cambios</p>
                </div>
              </div>
            </div>
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
              Comienza ahora y comparte tu conocimiento con miles de estudiantes
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
                Ver guia de inicio
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            2024 Nodo360. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacidad" className="text-white/40 hover:text-white/60 text-sm transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos" className="text-white/40 hover:text-white/60 text-sm transition-colors">
              Terminos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
