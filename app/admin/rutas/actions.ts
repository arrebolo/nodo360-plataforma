// app/admin/rutas/actions.ts
'use server'

import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
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

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('No autorizado')
  }

  return user
}

// Crear / actualizar ruta (learning_paths)
export async function saveLearningPath(formData: FormData) {
  await verifyAdmin()

  const id = (formData.get('id') as string) || null
  const slug = (formData.get('slug') as string)?.trim()
  const name = (formData.get('name') as string)?.trim()
  const emoji = (formData.get('emoji') as string)?.trim() || null
  const shortDescription = (formData.get('short_description') as string)?.trim() || null
  const longDescription = (formData.get('long_description') as string)?.trim() || null
  const isActive = formData.get('is_active') === 'on'
  const positionRaw = formData.get('position') as string
  const position = positionRaw ? Number(positionRaw) : 0

  console.log('[saveLearningPath]', id ? 'Actualizando' : 'Creando', 'ruta:', name)

  if (!slug || !name) {
    throw new Error('Slug y nombre son obligatorios')
  }

  const payload = {
    slug,
    name,
    emoji,
    short_description: shortDescription,
    long_description: longDescription,
    is_active: isActive,
    position,
  }

  let error

  if (id) {
    const res = await supabaseAdmin
      .from('learning_paths')
      .update(payload)
      .eq('id', id)
      .select('id')
      .maybeSingle()
    error = res.error
  } else {
    const res = await supabaseAdmin
      .from('learning_paths')
      .insert(payload)
      .select('id')
      .single()
    error = res.error
  }

  if (error) {
    console.error('[saveLearningPath] Error:', error)
    throw new Error(error.message)
  }

  console.log('[saveLearningPath] Ruta guardada')
  revalidatePath('/admin/rutas')
  redirect('/admin/rutas')
}

// Anadir curso a una ruta (path_courses)
export async function addCourseToPath(formData: FormData) {
  await verifyAdmin()

  const pathId = formData.get('path_id') as string
  const courseId = formData.get('course_id') as string
  const orderRaw = formData.get('order_index') as string
  let orderIndex = orderRaw ? Number(orderRaw) : null

  console.log('[addCourseToPath] Anadiendo curso', courseId, 'a ruta', pathId)

  if (!pathId || !courseId) {
    throw new Error('Ruta y curso son obligatorios')
  }

  // Si no se indica orden, lo ponemos al final
  if (orderIndex === null || Number.isNaN(orderIndex)) {
    const { data: rows, error: maxError } = await supabaseAdmin
      .from('path_courses')
      .select('order_index')
      .eq('path_id', pathId)
      .order('order_index', { ascending: false })
      .limit(1)

    if (maxError) {
      console.error('[addCourseToPath] Error al calcular orden:', maxError)
      throw new Error(maxError.message)
    }

    orderIndex = rows?.[0]?.order_index ? rows[0].order_index + 1 : 1
  }

  const { error } = await supabaseAdmin.from('path_courses').insert({
    path_id: pathId,
    course_id: courseId,
    order_index: orderIndex,
    is_required: true,
  })

  if (error) {
    console.error('[addCourseToPath] Error:', error)
    throw new Error(error.message)
  }

  console.log('[addCourseToPath] Curso anadido')
  revalidatePath(`/admin/rutas/${pathId}`)
}

// Quitar curso de una ruta
export async function removeCourseFromPath(formData: FormData) {
  await verifyAdmin()

  const pathCourseId = formData.get('path_course_id') as string
  const pathId = formData.get('path_id') as string

  console.log('[removeCourseFromPath] Quitando relacion:', pathCourseId)

  if (!pathCourseId) {
    throw new Error('Falta path_course_id')
  }

  const { error } = await supabaseAdmin
    .from('path_courses')
    .delete()
    .eq('id', pathCourseId)

  if (error) {
    console.error('[removeCourseFromPath] Error:', error)
    throw new Error(error.message)
  }

  console.log('[removeCourseFromPath] Curso quitado de la ruta')
  if (pathId) {
    revalidatePath(`/admin/rutas/${pathId}`)
  }
}

// Actualizar orden de un curso en la ruta
export async function updateCourseOrder(formData: FormData) {
  await verifyAdmin()

  const recordId = formData.get('record_id') as string
  const pathId = formData.get('path_id') as string
  const orderIndex = Number(formData.get('order_index'))

  console.log('[updateCourseOrder] record_id:', recordId, 'order:', orderIndex)

  if (!recordId || isNaN(orderIndex)) {
    throw new Error('Faltan parámetros record_id u order_index')
  }

  const { error } = await supabaseAdmin
    .from('path_courses')
    .update({ order_index: orderIndex })
    .eq('id', recordId)

  if (error) {
    console.error('[updateCourseOrder] Error:', error)
    throw new Error(error.message)
  }

  console.log('[updateCourseOrder] Orden actualizado')
  if (pathId) {
    revalidatePath(`/admin/rutas/${pathId}`)
  }
}

// Eliminar ruta completa
export async function deleteLearningPath(formData: FormData) {
  await verifyAdmin()

  const pathId = formData.get('path_id') as string

  console.log('[deleteLearningPath] Eliminando ruta:', pathId)

  if (!pathId) {
    throw new Error('Falta path_id')
  }

  // Primero eliminar relaciones
  await supabaseAdmin
    .from('path_courses')
    .delete()
    .eq('path_id', pathId)

  // Luego eliminar la ruta
  const { error } = await supabaseAdmin
    .from('learning_paths')
    .delete()
    .eq('id', pathId)

  if (error) {
    console.error('[deleteLearningPath] Error:', error)
    throw new Error(error.message)
  }

  console.log('[deleteLearningPath] Ruta eliminada')
  revalidatePath('/admin/rutas')
  redirect('/admin/rutas')
}
