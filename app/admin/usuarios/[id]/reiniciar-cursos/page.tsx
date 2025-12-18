import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { ResetCoursesClient } from './ResetCoursesClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: 'Reiniciar Cursos | Admin | Nodo360',
    description: 'Reiniciar progreso de cursos de un usuario',
  }
}

export default async function ResetCoursesPage({ params }: PageProps) {
  const { id: userId } = await params
  const supabase = await createClient()

  // Verificar autenticación y rol admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/admin/usuarios')
  }

  const { data: adminProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!adminProfile || adminProfile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Obtener datos del usuario objetivo
  const { data: targetUser } = await supabase
    .from('users')
    .select('id, full_name, email, avatar_url')
    .eq('id', userId)
    .single()

  if (!targetUser) {
    notFound()
  }

  // Obtener enrollments con información del curso
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select(`
      id,
      course_id,
      enrolled_at,
      progress_percentage,
      course:course_id (
        id,
        title,
        slug,
        thumbnail_url
      )
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false })

  // Para cada enrollment, obtener estadísticas de progreso
  const enrollmentsWithProgress = await Promise.all(
    (enrollments || []).map(async (enrollment: any) => {
      if (!enrollment.course) return null

      // Obtener lecciones del curso
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, module:module_id!inner(course_id)')
        .eq('module.course_id', enrollment.course_id)

      const lessonIds = lessons?.map(l => l.id) || []

      // Obtener progreso completado
      const { count: completedCount } = await supabase
        .from('user_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_completed', true)
        .in('lesson_id', lessonIds)

      // Verificar si tiene certificado
      const { data: certificate } = await supabase
        .from('certificates')
        .select('id, certificate_number')
        .eq('user_id', userId)
        .eq('course_id', enrollment.course_id)
        .single()

      return {
        ...enrollment,
        totalLessons: lessonIds.length,
        completedLessons: completedCount || 0,
        hasCertificate: !!certificate,
        certificateNumber: certificate?.certificate_number || null
      }
    })
  )

  const validEnrollments = enrollmentsWithProgress.filter(e => e !== null)

  return (
    <div className="min-h-screen bg-[#0a0d14]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/usuarios/${userId}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Usuario
          </Link>

          <div className="flex items-center gap-4">
            {targetUser.avatar_url ? (
              <img
                src={targetUser.avatar_url}
                alt=""
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-bold text-2xl">
                {(targetUser.full_name || targetUser.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">
                Reiniciar Cursos
              </h1>
              <p className="text-gray-400">
                {targetUser.full_name || targetUser.email}
              </p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Acción Irreversible</h3>
              <p className="text-red-300/80 text-sm">
                Reiniciar el progreso eliminará permanentemente todos los registros de lecciones completadas,
                el XP ganado y opcionalmente los certificados. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </div>

        {validEnrollments.length === 0 ? (
          <div className="bg-white/5 rounded-xl p-12 text-center border border-white/10">
            <p className="text-gray-400">
              Este usuario no está inscrito en ningún curso.
            </p>
          </div>
        ) : (
          <ResetCoursesClient
            userId={userId}
            enrollments={validEnrollments}
          />
        )}
      </div>
    </div>
  )
}
