'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkLessonAccess } from '@/lib/progress/checkLessonAccess'

interface Props {
  courseId: string
  courseSlug: string
  lessonId: string
  userId: string | null
  children: React.ReactNode
}

export default function AccessGuard({
  courseId,
  courseSlug,
  lessonId,
  userId,
  children,
}: Props) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true

    async function validate() {
      // Sin user: no bloqueamos aquí (preview/landing); el backend decide en otras capas
      if (!userId) {
        if (active) setAllowed(true)
        return
      }

      const canAccess = await checkLessonAccess({
        courseId,
        lessonId,
        userId,
      })

      if (!active) return

      if (!canAccess) {
        router.replace(`/cursos/${courseSlug}`)
        return
      }

      setAllowed(true)
    }

    validate()

    return () => {
      active = false
    }
  }, [courseId, courseSlug, lessonId, userId, router])

  if (allowed === null) return null
  return <>{children}</>
}
