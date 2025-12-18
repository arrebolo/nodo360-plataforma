// app/admin/cursos/nuevo/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CourseForm } from '@/components/admin/CourseForm'

export const metadata: Metadata = {
  title: 'Crear curso | Admin Nodo360',
}

export default async function NewCoursePage() {
  // Verificar autenticacion y rol admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar rol
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  // Cargar rutas disponibles
  const { data: paths } = await supabase
    .from('learning_paths')
    .select('id, slug, name, is_active, position')
    .order('position', { ascending: true })

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <CourseForm mode="create" paths={paths ?? []} />
    </main>
  )
}
