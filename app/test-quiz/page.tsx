import { ModuleQuizSection } from '@/components/course/ModuleQuizSection'
import { ModuleStatusBadge } from '@/components/course/ModuleStatusBadge'
import Link from 'next/link'

export const metadata = {
  title: 'Test: Sistema de Quiz | Nodo360',
  description: 'Página de prueba para verificar componentes de quiz',
}

export default function TestQuizPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1a1f2e]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-white font-bold text-xl">NODO360</span>
              <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                TEST MODE
              </span>
            </div>
            <Link
              href="/cursos"
              className="text-white/70 hover:text-white transition"
            >
              ← Volver a cursos
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🧪 Test: Sistema de Quiz y Progresión
          </h1>
          <p className="text-xl text-white/70">
            Esta página muestra todos los estados posibles del sistema de quiz
          </p>
        </div>

        {/* Status Badges */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            1. Status Badges de Módulo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm mb-3">Desbloqueado</p>
              <ModuleStatusBadge status="unlocked" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm mb-3">Bloqueado</p>
              <ModuleStatusBadge status="locked" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm mb-3">En Progreso</p>
              <ModuleStatusBadge
                status="in_progress"
                completedLessons={3}
                totalLessons={5}
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm mb-3">Completado</p>
              <ModuleStatusBadge status="completed" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm mb-3">Premium</p>
              <ModuleStatusBadge status="premium" />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/60 text-sm mb-3">Compact Mode</p>
              <ModuleStatusBadge status="completed" isCompact />
            </div>
          </div>
        </section>

        {/* Quiz States */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            2. Estados del Quiz
          </h2>

          <div className="space-y-8">
            {/* State 1: Lecciones no completadas */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                📚 Estado 1: Lecciones Pendientes
              </h3>
              <ModuleQuizSection
                courseSlug="bitcoin-desde-cero"
                moduleSlug="introduccion"
                requiresQuiz={true}
                allLessonsCompleted={false}
                completedLessonsCount={3}
                totalLessons={5}
                quizStatus="not_attempted"
              />
            </div>

            {/* State 2: Quiz disponible - No intentado */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                🎯 Estado 2: Quiz Disponible (Lecciones Completadas)
              </h3>
              <ModuleQuizSection
                courseSlug="bitcoin-desde-cero"
                moduleSlug="introduccion"
                requiresQuiz={true}
                allLessonsCompleted={true}
                completedLessonsCount={5}
                totalLessons={5}
                quizStatus="not_attempted"
              />
            </div>

            {/* State 3: Quiz intentado pero no aprobado */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                💪 Estado 3: Quiz Intentado - No Aprobado
              </h3>
              <ModuleQuizSection
                courseSlug="bitcoin-desde-cero"
                moduleSlug="introduccion"
                requiresQuiz={true}
                allLessonsCompleted={true}
                completedLessonsCount={5}
                totalLessons={5}
                quizStatus="attempted"
                bestScore={55}
              />
            </div>

            {/* State 4: Quiz aprobado sin certificado */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                🎉 Estado 4: Quiz Aprobado (Sin Certificado Aún)
              </h3>
              <ModuleQuizSection
                courseSlug="bitcoin-desde-cero"
                moduleSlug="introduccion"
                requiresQuiz={true}
                allLessonsCompleted={true}
                completedLessonsCount={5}
                totalLessons={5}
                quizStatus="passed"
                bestScore={85}
              />
            </div>

            {/* State 5: Quiz aprobado con certificado */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                🏆 Estado 5: Quiz Aprobado con Certificado
              </h3>
              <ModuleQuizSection
                courseSlug="bitcoin-desde-cero"
                moduleSlug="introduccion"
                requiresQuiz={true}
                allLessonsCompleted={true}
                completedLessonsCount={5}
                totalLessons={5}
                quizStatus="passed"
                bestScore={92}
                certificateId="test-cert-123"
                certificateUrl="/test-certificate.pdf"
              />
            </div>

            {/* State 6: Quiz bloqueado (módulo anterior no completado) */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                🔒 Estado 6: Quiz Bloqueado (Módulo Anterior Pendiente)
              </h3>
              <ModuleQuizSection
                courseSlug="bitcoin-desde-cero"
                moduleSlug="avanzado"
                requiresQuiz={true}
                allLessonsCompleted={true}
                completedLessonsCount={5}
                totalLessons={5}
                quizStatus="not_attempted"
                isPreviousModuleCompleted={false}
              />
            </div>

            {/* State 7: Sin quiz requerido */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                ✨ Estado 7: Módulo Sin Quiz
              </h3>
              <ModuleQuizSection
                courseSlug="bitcoin-desde-cero"
                moduleSlug="opcional"
                requiresQuiz={false}
                allLessonsCompleted={true}
                completedLessonsCount={3}
                totalLessons={3}
              />
              <p className="text-white/60 text-sm mt-4">
                Este módulo no requiere quiz, por lo que no se muestra nada.
              </p>
            </div>
          </div>
        </section>

        {/* Info */}
        <section className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-300 mb-3">
            ℹ️ Información de Testing
          </h3>
          <div className="text-sm text-blue-200 space-y-2">
            <p>• Esta página muestra todos los posibles estados del sistema de quiz</p>
            <p>• Los badges y componentes son interactivos y responsivos</p>
            <p>• Las animaciones usan Framer Motion para transiciones suaves</p>
            <p>• Los enlaces apuntan a rutas de ejemplo (pueden no existir)</p>
            <p>• Para probar con datos reales, visita un curso real en <Link href="/cursos" className="underline">la lista de cursos</Link></p>
          </div>
        </section>

        {/* Navigation */}
        <div className="mt-12 flex items-center justify-between">
          <Link
            href="/cursos"
            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition"
          >
            ← Ver Cursos Reales
          </Link>

          <Link
            href="/"
            className="px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#ff6b35]/30 transition"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
