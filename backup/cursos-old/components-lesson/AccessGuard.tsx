'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProgressManager } from '@/lib/progress-manager'
import { Lock, ArrowLeft } from 'lucide-react'

interface AccessGuardProps {
  courseSlug: string
  lessonSlug: string
  isPremium: boolean
  allLessons: Array<{ slug: string; order_index: number }>
  children: React.ReactNode
}

export function AccessGuard({
  courseSlug,
  lessonSlug,
  isPremium,
  allLessons,
  children
}: AccessGuardProps) {
  const router = useRouter()
  const [canAccess, setCanAccess] = useState(true)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAccess = ProgressManager.canAccessLesson(
      courseSlug,
      lessonSlug,
      allLessons
    )

    setCanAccess(checkAccess)
    setIsChecking(false)

    // Si no tiene acceso, redirigir después de un momento
    if (!checkAccess) {
      const timer = setTimeout(() => {
        router.push(`/cursos/${courseSlug}?blocked=${lessonSlug}`)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [courseSlug, lessonSlug, allLessons, router])

  // Mostrar loading mientras verifica
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <div className="animate-pulse text-white">Verificando acceso...</div>
      </div>
    )
  }

  // Si no tiene acceso, mostrar pantalla de bloqueo
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          {/* Icono de candado con animación */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-[#FFD700]/20 rounded-full blur-3xl" />
            <div className="relative bg-white/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto border border-[#FFD700]/30">
              <Lock className="w-12 h-12 text-[#FFD700]" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Lección Bloqueada
          </h1>

          {/* Descripción */}
          <p className="text-lg text-white/70 mb-2">
            Esta lección tiene progresión secuencial.
          </p>
          <p className="text-white/60 mb-8">
            Debes completar la lección anterior para desbloquear esta.
          </p>

          {/* Indicador de progreso */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-center gap-2 text-sm text-white/70">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Completa la lección anterior para continuar</span>
            </div>
          </div>

          {/* Botón de retorno */}
          <button
            onClick={() => router.push(`/cursos/${courseSlug}`)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Curso
          </button>

          {/* Mensaje de redirección */}
          <p className="mt-6 text-sm text-white/50">
            Redirigiendo automáticamente en unos segundos...
          </p>
        </div>
      </div>
    )
  }

  // Tiene acceso, mostrar contenido
  return <>{children}</>
}

// Componente auxiliar para el icono de check
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}
