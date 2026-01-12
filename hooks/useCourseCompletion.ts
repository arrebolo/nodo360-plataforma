'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type NextCourseRecommendation = {
  slug: string
  title: string
  level: string
  lessonsCount: number
}

type UserProgress = {
  totalCoursesCompleted: number
  totalLessonsCompleted: number
  currentStreak?: number
}

type CompletionData = {
  userName: string | null
  userProgress: UserProgress | null
  nextRecommendation: NextCourseRecommendation | null
  certificateUrl: string | null
  certificateNumber: string | null
  isLoading: boolean
  error: string | null
}

/**
 * Hook para obtener datos de completado de curso
 * - Genera certificado automaticamente si no existe
 * - Carga lazy cuando showModal es true para evitar fetches innecesarios
 */
export function useCourseCompletion(
  courseSlug: string,
  userId: string | null,
  showModal: boolean
): CompletionData {
  const [data, setData] = useState<CompletionData>({
    userName: null,
    userProgress: null,
    nextRecommendation: null,
    certificateUrl: null,
    certificateNumber: null,
    isLoading: false,
    error: null,
  })

  // Track if we already attempted to generate certificate
  const certificateAttemptedRef = useRef(false)

  const fetchCompletionData = useCallback(async () => {
    if (!userId || !showModal) return

    setData((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const supabase = createClient()

      // 1. Get course info first (needed for certificate generation)
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, level')
        .eq('slug', courseSlug)
        .single()

      if (!courseData) {
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Curso no encontrado',
        }))
        return
      }

      const courseId = courseData.id

      // 2. Generate certificate if not already attempted
      let certificateUrl: string | null = null
      let certificateNumber: string | null = null

      if (!certificateAttemptedRef.current) {
        certificateAttemptedRef.current = true

        try {
          const certResponse = await fetch('/api/certificates/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId }),
          })

          const certResult = await certResponse.json()

          if (certResult.success && certResult.certificate) {
            certificateUrl = `/dashboard/certificados?curso=${courseSlug}`
            certificateNumber = certResult.certificate.certificate_number
            console.log('[useCourseCompletion] Certificate:', certificateNumber)
          }
        } catch (certError) {
          console.error('[useCourseCompletion] Certificate generation error:', certError)
        }
      }

      // 3. If certificate URL not set, check if exists in DB
      if (!certificateUrl) {
        const { data: existingCert } = await supabase
          .from('certificates')
          .select('id, certificate_number')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .eq('type', 'course')
          .maybeSingle()

        if (existingCert) {
          certificateUrl = `/dashboard/certificados?curso=${courseSlug}`
          certificateNumber = existingCert.certificate_number
        }
      }

      // 4. Fetch user name
      const { data: userData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single()

      // 5. Fetch completed courses count
      const { count: completedCoursesCount } = await supabase
        .from('course_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('completed_at', 'is', null)

      // 6. Fetch completed lessons count
      const { count: completedLessonsCount } = await supabase
        .from('user_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_completed', true)

      // 7. Find next course recommendation
      let nextRecommendation: NextCourseRecommendation | null = null

      // Get courses user is NOT enrolled in
      const { data: enrolledCourses } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('user_id', userId)

      const enrolledIds = enrolledCourses?.map((e) => e.course_id) || []

      // Find next course recommendation (exclude current enrolled courses)
      const { data: recommendedCourse } = await supabase
        .from('courses')
        .select('slug, title, level, total_lessons')
        .eq('status', 'published')
        .not(
          'id',
          'in',
          `(${enrolledIds.length > 0 ? enrolledIds.join(',') : '00000000-0000-0000-0000-000000000000'})`
        )
        .order('enrolled_count', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (recommendedCourse) {
        const levelLabels: Record<string, string> = {
          beginner: 'Principiante',
          intermediate: 'Intermedio',
          advanced: 'Avanzado',
        }

        nextRecommendation = {
          slug: recommendedCourse.slug,
          title: recommendedCourse.title,
          level: levelLabels[recommendedCourse.level] || recommendedCourse.level,
          lessonsCount: recommendedCourse.total_lessons || 0,
        }
      }

      setData({
        userName: userData?.full_name || null,
        userProgress: {
          totalCoursesCompleted: completedCoursesCount || 0,
          totalLessonsCompleted: completedLessonsCount || 0,
        },
        nextRecommendation,
        certificateUrl,
        certificateNumber,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      console.error('[useCourseCompletion] Error:', error)
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Error cargando datos de completado',
      }))
    }
  }, [userId, courseSlug, showModal])

  // Reset attempt flag when modal closes
  useEffect(() => {
    if (!showModal) {
      certificateAttemptedRef.current = false
    }
  }, [showModal])

  useEffect(() => {
    if (showModal && userId) {
      fetchCompletionData()
    }
  }, [showModal, userId, fetchCompletionData])

  return data
}

export default useCourseCompletion
