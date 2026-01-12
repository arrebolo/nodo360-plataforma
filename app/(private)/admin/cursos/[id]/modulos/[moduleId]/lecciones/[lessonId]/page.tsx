import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/auth'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LessonForm } from '@/components/admin/LessonForm'

interface PageProps {
  params: Promise<{
    id: string
    moduleId: string
    lessonId: string
  }>
}

export default async function EditLessonPage({ params }: PageProps) {
  await requireAdmin()
  const { id, moduleId, lessonId } = await params
  const courseId = id
  const supabase = await createClient()

  // Obtener lección
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single()

  if (!lesson || lesson.module_id !== moduleId) {
    notFound()
  }

  // Obtener módulo
  const { data: module } = await supabase
    .from('modules')
    .select('title, course_id')
    .eq('id', moduleId)
    .single()

  if (!module || module.course_id !== courseId) {
    notFound()
  }

  // Obtener curso
  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  async function updateLesson(formData: FormData) {
    'use server'

    console.log('✏️ [Update Lesson] Iniciando actualización de lección:', lessonId)

    await requireAdmin()
    const supabase = await createClient()

    // Preparar datos de la lección (sin cambiar order_index)
    const lessonData = {
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
    }

    console.log('✏️ [Update Lesson] Datos:', lessonData)

    const { error } = await supabase
      .from('lessons')
      .update(lessonData)
      .eq('id', lessonId)

    if (error) {
      console.error('❌ [Update Lesson] Error:', error)
      throw new Error('Error al actualizar lección: ' + error.message)
    }

    console.log('✅ [Update Lesson] Lección actualizada correctamente')

    revalidatePath(`/admin/cursos/${courseId}/modulos/${moduleId}/lecciones`)
    redirect(`/admin/cursos/${courseId}/modulos/${moduleId}/lecciones`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-secondary via-dark-surface to-dark-secondary text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link href="/admin/cursos" className="text-white/70 hover:text-white transition">
            Cursos
          </Link>
          <span className="text-white/70">/</span>
          <Link href={`/admin/cursos/${courseId}/modulos`} className="text-white/70 hover:text-white transition">
            {course.title}
          </Link>
          <span className="text-white/70">/</span>
          <Link href={`/admin/cursos/${courseId}/modulos/${moduleId}/lecciones`} className="text-white/70 hover:text-white transition">
            {module.title}
          </Link>
          <span className="text-white/70">/</span>
          <span className="text-white font-medium">{lesson.title}</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`/admin/cursos/${courseId}/modulos/${moduleId}/lecciones`}
            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-light to-brand bg-clip-text text-transparent">
            Editar Lección
          </h1>
        </div>

        {/* Form */}
        <LessonForm
          action={updateLesson}
          initialData={lesson}
          courseId={courseId}
          moduleId={moduleId}
        />
      </div>
    </div>
  )
}
