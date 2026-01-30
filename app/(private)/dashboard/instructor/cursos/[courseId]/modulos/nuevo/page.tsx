import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, Save, HelpCircle } from 'lucide-react'

interface NuevoModuloPageProps {
  params: Promise<{ courseId: string }>
}

export async function generateMetadata() {
  return {
    title: 'Nuevo Módulo | Instructor Nodo360',
  }
}

async function createModule(courseId: string, basePath: string, formData: FormData) {
  'use server'

  console.log('🔍 [Instructor Create Module] Creando módulo para curso:', courseId)

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

  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || null

  // Obtener el order_index más alto
  const { data: lastModule } = await supabase
    .from('modules')
    .select('order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const orderIndex = lastModule ? lastModule.order_index + 1 : 0

  // Generar slug
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  console.log('📊 [Instructor Create Module] Datos:', { title, orderIndex, slug })

  // Crear módulo
  const { data, error } = await supabase
    .from('modules')
    .insert({
      course_id: courseId,
      title,
      description,
      order_index: orderIndex,
      slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('❌ [Instructor Create Module] Error:', error)
    throw new Error('Error al crear módulo: ' + error.message)
  }

  console.log('✅ [Instructor Create Module] Módulo creado:', data.id)

  revalidatePath(`/dashboard/instructor/cursos/${courseId}/modulos`)
  redirect(`/dashboard/instructor/cursos/${courseId}/modulos/${data.id}/lecciones`)
}

export default async function NuevoModuloPage({ params }: NuevoModuloPageProps) {
  const { courseId } = await params
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
    .select('id, title, slug, instructor_id')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  // Verificar permisos: debe ser el instructor del curso o admin
  const isOwner = course.instructor_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    redirect('/dashboard')
  }

  const basePath = `/dashboard/instructor/cursos/${courseId}`
  const createAction = createModule.bind(null, course.id, basePath)

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-3xl mx-auto px-6 py-8">
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
          <span className="text-white font-medium">Nuevo Módulo</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <Link
            href={`${basePath}/modulos`}
            className="flex items-center gap-2 text-white/60 hover:text-white transition mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a módulos
          </Link>

          <h1 className="text-2xl font-bold text-white mb-2">
            Crear Nuevo Módulo
          </h1>
          <p className="text-white/60">
            {course.title}
          </p>
        </div>

        {/* Formulario */}
        <form action={createAction} className="space-y-6">
          <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                Titulo del Modulo *
                <span className="group relative">
                  <HelpCircle className="w-4 h-4 text-white/40 hover:text-white/60 cursor-help" />
                  <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-dark-tertiary border border-white/20 rounded-lg shadow-xl max-w-xs whitespace-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Usa un nombre descriptivo que indique el contenido del modulo. Ej: Modulo 1 - Fundamentos
                  </span>
                </span>
              </label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 transition"
                placeholder="Ej: Modulo 1 - Fundamentos de Bitcoin"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                Descripcion
                <span className="group relative">
                  <HelpCircle className="w-4 h-4 text-white/40 hover:text-white/60 cursor-help" />
                  <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-dark-tertiary border border-white/20 rounded-lg shadow-xl max-w-xs whitespace-normal opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Breve resumen de lo que cubre este modulo. Ayuda a los estudiantes a entender que aprenderan
                  </span>
                </span>
              </label>
              <textarea
                name="description"
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:border-brand-light focus:ring-2 focus:ring-brand-light/20 transition resize-none"
                placeholder="Ej: En este modulo aprenderemos que es Bitcoin, su historia, y por que es importante para la economia digital."
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href={`${basePath}/modulos`}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition text-sm"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition text-sm"
            >
              <Save className="w-4 h-4" />
              Crear Módulo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
