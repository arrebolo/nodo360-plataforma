// app/admin/lecciones/actions.ts
'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper para verificar admin
async function verifyAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('No autorizado')
  return user
}

// =====================================
// ACTUALIZAR MULTIMEDIA DE LECCION
// =====================================
export async function updateLessonMedia(formData: FormData) {
  await verifyAdmin()

  const lessonId = formData.get('lesson_id') as string

  if (!lessonId) {
    throw new Error('Falta lesson_id')
  }

  console.log('[updateLessonMedia] Actualizando leccion:', lessonId)

  // Obtener y limpiar URLs
  const videoUrl = ((formData.get('video_url') as string) || '').trim() || null
  const slidesUrl = ((formData.get('slides_url') as string) || '').trim() || null
  const pdfUrl = ((formData.get('pdf_url') as string) || '').trim() || null
  const resourcesUrl = ((formData.get('resources_url') as string) || '').trim() || null

  const { error } = await supabaseAdmin
    .from('lessons')
    .update({
      video_url: videoUrl,
      slides_url: slidesUrl,
      pdf_url: pdfUrl,
      resources_url: resourcesUrl,
    })
    .eq('id', lessonId)

  if (error) {
    console.error('[updateLessonMedia] Error:', error)
    throw new Error(error.message)
  }

  console.log('[updateLessonMedia] Leccion actualizada')
  revalidatePath(`/admin/lecciones/${lessonId}`)
}

// =====================================
// ACTUALIZAR DATOS BASICOS DE LECCION
// =====================================
export async function updateLessonBasic(formData: FormData) {
  await verifyAdmin()

  const lessonId = formData.get('lesson_id') as string

  if (!lessonId) {
    throw new Error('Falta lesson_id')
  }

  console.log('[updateLessonBasic] Actualizando leccion:', lessonId)

  const title = ((formData.get('title') as string) || '').trim()
  const slug = ((formData.get('slug') as string) || '').trim()
  const description = ((formData.get('description') as string) || '').trim() || null
  const orderIndex = Number(formData.get('order_index')) || 1
  const videoDurationMinutes = Number(formData.get('video_duration_minutes')) || null

  if (!title || !slug) {
    throw new Error('Titulo y slug son obligatorios')
  }

  const { error } = await supabaseAdmin
    .from('lessons')
    .update({
      title,
      slug,
      description,
      order_index: orderIndex,
      video_duration_minutes: videoDurationMinutes,
    })
    .eq('id', lessonId)

  if (error) {
    console.error('[updateLessonBasic] Error:', error)
    throw new Error(error.message)
  }

  console.log('[updateLessonBasic] Leccion actualizada')
  revalidatePath(`/admin/lecciones/${lessonId}`)
}
