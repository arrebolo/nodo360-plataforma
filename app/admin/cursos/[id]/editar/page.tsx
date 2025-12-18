// app/admin/cursos/[id]/editar/page.tsx
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CourseForm, CourseFormValues } from '@/components/admin/CourseForm'

export const metadata: Metadata = {
  title: 'Editar curso | Admin Nodo360',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCoursePage({ params }: PageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams

  // Verificar autenticacion
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar rol admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // Cargar datos del curso
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      slug,
      subtitle,
      description,
      duration_label,
      is_premium,
      is_certifiable,
      published_at,
      difficulty_level,
      topic_category
    `)
    .eq('id', id)
    .maybeSingle()

  if (error || !course) {
    console.error('[EditCoursePage] Curso no encontrado:', error?.message)
    notFound()
  }

  // Cargar rutas disponibles
  const { data: paths } = await supabase
    .from('learning_paths')
    .select('id, slug, name, is_active, position')
    .order('position', { ascending: true })

  // Cargar path_id del curso (primera ruta asignada)
  const { data: pathCourseRows } = await supabase
    .from('path_courses')
    .select('path_id')
    .eq('course_id', id)
    .limit(1)

  const primaryPathId = pathCourseRows?.[0]?.path_id ?? null

  const initialData: CourseFormValues = {
    id: course.id,
    title: course.title ?? '',
    slug: course.slug ?? '',
    subtitle: course.subtitle ?? '',
    description: course.description ?? '',
    duration_label: course.duration_label ?? '',
    is_premium: course.is_premium ?? false,
    is_certifiable: course.is_certifiable ?? false,
    published_at: course.published_at,
    difficulty_level: course.difficulty_level ?? '',
    topic_category: course.topic_category ?? '',
    path_id: primaryPathId,
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <CourseForm mode="edit" initialData={initialData} paths={paths ?? []} />
    </main>
  )
}
