'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface EnrollButtonProps {
  courseId: string
  courseSlug: string
  isEnrolled?: boolean
  className?: string
}

export default function EnrollButton({
  courseId,
  courseSlug,
  isEnrolled = false,
  className = '',
}: EnrollButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [enrolled, setEnrolled] = useState(isEnrolled)

  const handleEnroll = async () => {
    console.log('🎓 [EnrollButton] Iniciando inscripción al curso:', courseId)
    setLoading(true)

    try {
      const supabase = createClient()

      // Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.log('❌ [EnrollButton] Usuario no autenticado, redirigiendo a login')
        toast.error('Debes iniciar sesión para inscribirte')
        router.push(`/login?redirect=/cursos/${courseSlug}`)
        return
      }

      console.log('✅ [EnrollButton] Usuario autenticado:', user.id)

      // Verificar si ya está inscrito
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single()

      if (existingEnrollment) {
        console.log('ℹ️ [EnrollButton] Usuario ya está inscrito')
        toast.info('Ya estás inscrito en este curso')
        setEnrolled(true)
        router.refresh()
        return
      }

      // Crear inscripción
      const { error: enrollError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
        } as any) // TODO: Regenerar tipos de Supabase si hay error de tipos

      if (enrollError) {
        console.error('❌ [EnrollButton] Error al inscribirse:', enrollError)
        toast.error('Error al inscribirse en el curso')
        return
      }

      console.log('✅ [EnrollButton] Inscripción exitosa')
      toast.success('¡Te has inscrito exitosamente! 🎉')
      setEnrolled(true)

      // Refrescar la página para mostrar el nuevo estado
      router.refresh()
    } catch (error) {
      console.error('❌ [EnrollButton] Error inesperado:', error)
      toast.error('Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (enrolled) {
    return (
      <div className={`inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-medium rounded-lg border border-white/20 ${className}`}>
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Ya estás inscrito
      </div>
    )
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#ff6b35]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Inscribiendo...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Inscribirse Gratis
        </>
      )}
    </button>
  )
}
