import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { CourseForm } from '@/components/admin/CourseForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Crear Nuevo Curso | Admin Nodo360',
}

// Server Action para crear curso
async function createCourse(formData: FormData) {
  'use server'

  console.log('🔍 [Create Course] Iniciando creación de curso')

  const { user } = await requireAdmin()
  const supabase = await createClient()

  // Extraer datos del form
  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const long_description = (formData.get('long_description') as string) || null
  const level = formData.get('level') as string
  const status = formData.get('status') as string
  const is_free = formData.get('is_free') === 'true'
  const is_premium = formData.get('is_premium') === 'true'
  const price = formData.get('price') ? parseFloat(formData.get('price') as string) : null
  const thumbnail_url = (formData.get('thumbnail_url') as string) || null
  const banner_url = (formData.get('banner_url') as string) || null

  console.log('📊 [Create Course] Datos del curso:', { title, slug, level, status })

  // Insertar en BD
  const { data, error } = await supabase
    .from('courses')
    .insert({
      title,
      slug,
      description,
      long_description,
      level,
      status,
      is_free,
      is_premium,
      price,
      thumbnail_url,
      banner_url,
      instructor_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('❌ [Create Course] Error:', error)
    throw new Error('Error al crear curso: ' + error.message)
  }

  console.log('✅ [Create Course] Curso creado:', data.id)

  // Revalidar y redirigir
  revalidatePath('/admin/cursos')
  redirect(`/admin/cursos/${data.id}`)
}

export default async function NuevoCursoPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/cursos"
            className="inline-flex items-center gap-2 text-[#C5C7D3] hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a cursos
          </Link>

          <h1 className="text-4xl font-bold text-white mb-2">
            Crear Nuevo Curso
          </h1>
          <p className="text-[#C5C7D3]">
            Completa los detalles básicos del curso
          </p>
        </div>

        {/* Formulario */}
        <CourseForm action={createCourse} />
      </div>
    </div>
  )
}
