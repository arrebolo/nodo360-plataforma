import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LessonForm } from '@/components/admin/LessonForm'

interface PageProps {
  params: Promise<{
    courseId: string
    moduleId: string
  }>
}

export async function generateMetadata() {
  return {
    title: 'Nueva Lección | Instructor Nodo360',
  }
}

export default async function InstructorNewLessonPage({ params }: PageProps) {
  const { courseId, moduleId } = await params
  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  // Obtener curso
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  // Verificar permisos
  const isOwner = course.instructor_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    redirect('/dashboard')
  }

  // Verificar que el módulo existe y pertenece al curso
  const { data: module } = await supabase
    .from('modules')
    .select('id, title, course_id')
    .eq('id', moduleId)
    .single()

  if (!module || module.course_id !== courseId) {
    notFound()
  }

  const basePath = `/dashboard/instructor/cursos/${courseId}`

  async function createLesson(formData: FormData) {
    'use server'

    console.log('📝 [Instructor Create Lesson] Iniciando creación de lección')

    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Verificar que es dueño del curso
    const { data: course } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .single()

    if (!course || course.instructor_id !== user.id) {
      throw new Error('No tienes permisos para modificar este curso')
    }

    // Obtener el máximo order_index actual para este módulo
    const { data: maxOrderData } = await supabase
      .from('lessons')
      .select('order_index')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const nextOrderIndex = maxOrderData ? maxOrderData.order_index + 1 : 0

    console.log('📝 [Instructor Create Lesson] Nuevo order_index:', nextOrderIndex)

    // Preparar datos de la lección
    const lessonData = {
      course_id: courseId,
      module_id: moduleId,
      title: formData.get('title') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string || null,
      content: formData.get('content') as string || null,
      video_url: formData.get('video_url') as string || null,
      video_duration_minutes: formData.get('video_duration_minutes')
        ? parseInt(formData.get('video_duration_minutes') as string)
        : null,
      slides_url: formData.get('slides_url') as string || null,
      slides_type: formData.get('slides_type') as string || 'google_slides',
      is_free_preview: formData.get('is_free_preview') === 'on',
      order_index: nextOrderIndex,
    }

    console.log('📝 [Instructor Create Lesson] Datos:', lessonData)

    const { error } = await supabase
      .from('lessons')
      .insert(lessonData)

    if (error) {
      console.error('❌ [Instructor Create Lesson] Error:', error)
      throw new Error('Error al crear lección: ' + error.message)
    }

    console.log('✅ [Instructor Create Lesson] Lección creada correctamente')

    revalidatePath(`/dashboard/instructor/cursos/${courseId}/modulos/${moduleId}/lecciones`)
    redirect(`/dashboard/instructor/cursos/${courseId}/modulos/${moduleId}/lecciones`)
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/dashboard/instructor/cursos" className="text-white/60 hover:text-white transition">
            Mis Cursos
          </Link>
          <span className="text-white/40">/</span>
          <Link href={`${basePath}/modulos`} className="text-white/60 hover:text-white transition">
            {course.title}
          </Link>
          <span className="text-white/40">/</span>
          <Link href={`${basePath}/modulos/${moduleId}/lecciones`} className="text-white/60 hover:text-white transition">
            {module.title}
          </Link>
          <span className="text-white/40">/</span>
          <span className="text-white font-medium">Nueva Lección</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`${basePath}/modulos/${moduleId}/lecciones`}
            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-white">
            Nueva Lección
          </h1>
        </div>

        {/* Form */}
        <LessonForm
          action={createLesson}
          courseId={courseId}
          moduleId={moduleId}
        />
      </div>
    </div>
  )
}
