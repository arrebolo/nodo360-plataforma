'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkLessonAccess } from '@/lib/progress/checkLessonAccess'

type Props = {
  courseId: string
  lessonId: string
  userId: string | null
  children: React.ReactNode
  redirectTo?: string

  /**
   * Si el curso es gratuito, permitimos acceso según las reglas de gating del módulo/lección.
   * Si no lo pasas, por seguridad asumimos false.
   */
  courseIsFree?: boolean
}

export default function AccessGuard({
  courseId,
  lessonId,
  userId,
  children,
  redirectTo,
  courseIsFree = false,
}: Props) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        // Si no hay userId, checkLessonAccess ya contempla lógica (en tu implementación devuelve accesible),
        // pero aquí mantenemos gating: si quieres permitir preview anónimo, se controla por courseIsFree.
        const res = await checkLessonAccess(userId, lessonId, courseIsFree)

        if (!cancelled) setAllowed(!!res?.canAccess)
      } catch (e) {
        console.error('[AccessGuard] Error verificando acceso:', e)
        if (!cancelled) setAllowed(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [userId, lessonId, courseIsFree])

  useEffect(() => {
    if (allowed === false) {
      const target = redirectTo || `/login?redirect=/cursos/${courseId}`
      router.push(target)
    }
  }, [allowed, redirectTo, router, courseId])

  if (allowed === null) {
    return (
      <div className="w-full py-10 text-center text-sm text-white/60">
        Verificando acceso…
      </div>
    )
  }

  if (allowed === false) return null

  return <>{children}</>
}


