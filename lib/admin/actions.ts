'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from './auth'
import { generateSlug, validateCourseData, validateModuleData, validateLessonData } from './utils'
import { checkCoursePublishability, type PublishCheckResult } from './publish-rules'
import { normalizeTitle, normalizeSlug, normalizeDescription } from '@/lib/utils/normalize'

/**
 * COURSE ACTIONS
 */

export async function createCourse(formData: FormData) {
  console.log('🔍 [Admin Action] Creando curso')

  try {
    await requireAdmin()
    const supabase = await createClient()

    const data = {
      title: formData.get('title') as string,
      slug: formData.get('slug') as string || generateSlug(formData.get('title') as string),
      description: formData.get('description') as string,
      long_description: formData.get('long_description') as string || null,
      level: formData.get('level') as string,
      is_free: formData.get('is_free') === 'true',
      is_premium: formData.get('is_premium') === 'true',
      price: parseFloat(formData.get('price') as string) || 0,
      thumbnail_url: formData.get('thumbnail_url') as string || null,
      banner_url: formData.get('banner_url') as string || null,
    }

    // Validar datos
    const validation = validateCourseData(data)
    if (!validation.valid) {
      return { success: false, errors: validation.errors }
    }

    // Verificar slug único
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', data.slug)
      .single()

    if (existing) {
      return { success: false, errors: { slug: 'Este slug ya existe' } }
    }

    // Crear curso
    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [Admin Action] Error al crear curso:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [Admin Action] Curso creado:', course.id)
    revalidatePath('/admin/cursos')
    return { success: true, data: course }
  } catch (error: any) {
    console.error('❌ [Admin Action] Error inesperado:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCourse(courseId: string, formData: FormData) {
  console.log('🔍 [Admin Action] Actualizando curso:', courseId)

  try {
    await requireAdmin()
    const supabase = await createClient()

    const data = {
      title: formData.get('title') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string,
      long_description: formData.get('long_description') as string || null,
      level: formData.get('level') as string,
      is_free: formData.get('is_free') === 'true',
      is_premium: formData.get('is_premium') === 'true',
      price: parseFloat(formData.get('price') as string) || 0,
      thumbnail_url: formData.get('thumbnail_url') as string || null,
      banner_url: formData.get('banner_url') as string || null,
    }

    // Validar datos
    const validation = validateCourseData(data)
    if (!validation.valid) {
      return { success: false, errors: validation.errors }
    }

    // Verificar slug único (excepto el curso actual)
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', courseId)
      .single()

    if (existing) {
      return { success: false, errors: { slug: 'Este slug ya existe' } }
    }

    // Actualizar curso
    const { error } = await supabase
      .from('courses')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)

    if (error) {
      console.error('❌ [Admin Action] Error al actualizar curso:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [Admin Action] Curso actualizado')
    revalidatePath('/admin/cursos')
    revalidatePath(`/admin/cursos/${courseId}`)
    return { success: true }
  } catch (error: any) {
    console.error('❌ [Admin Action] Error inesperado:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCourse(courseId: string) {
  console.log('🔍 [Admin Action] Eliminando curso:', courseId)

  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      console.error('❌ [Admin Action] Error al eliminar curso:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [Admin Action] Curso eliminado')
    revalidatePath('/admin/cursos')
    return { success: true }
  } catch (error: any) {
    console.error('❌ [Admin Action] Error inesperado:', error)
    return { success: false, error: error.message }
  }
}

/**
 * MODULE ACTIONS
 */

export async function createModule(courseId: string, formData: FormData) {
  console.log('🔍 [Admin Action] Creando módulo para curso:', courseId)

  try {
    await requireAdmin()
    const supabase = await createClient()

    // Obtener el último order_index
    const { data: lastModule } = await supabase
      .from('modules')
      .select('order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = lastModule ? lastModule.order_index + 1 : 0

    const data = {
      course_id: courseId,
      title: formData.get('title') as string,
      slug: formData.get('slug') as string || generateSlug(formData.get('title') as string),
      description: formData.get('description') as string || null,
      order_index: nextOrder,
    }

    // Validar datos
    const validation = validateModuleData(data)
    if (!validation.valid) {
      return { success: false, errors: validation.errors }
    }

    // Crear módulo
    const { data: module, error } = await supabase
      .from('modules')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [Admin Action] Error al crear módulo:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [Admin Action] Módulo creado:', module.id)
    revalidatePath(`/admin/cursos/${courseId}`)
    return { success: true, data: module }
  } catch (error: any) {
    console.error('❌ [Admin Action] Error inesperado:', error)
    return { success: false, error: error.message }
  }
}

export async function updateModule(moduleId: string, formData: FormData) {
  console.log('🔍 [Admin Action] Actualizando módulo:', moduleId)

  try {
    await requireAdmin()
    const supabase = await createClient()

    const data = {
      title: formData.get('title') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string || null,
    }

    const { error } = await supabase
      .from('modules')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', moduleId)

    if (error) {
      console.error('❌ [Admin Action] Error al actualizar módulo:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [Admin Action] Módulo actualizado')
    revalidatePath('/admin/cursos')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteModule(moduleId: string) {
  console.log('🔍 [Admin Action] Eliminando módulo:', moduleId)

  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId)

    if (error) {
      console.error('❌ [Admin Action] Error al eliminar módulo:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [Admin Action] Módulo eliminado')
    revalidatePath('/admin/cursos')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * LESSON ACTIONS
 */

export async function createLesson(moduleId: string, formData: FormData) {
  console.log('🔍 [Admin Action] Creando lección para módulo:', moduleId)

  try {
    await requireAdmin()
    const supabase = await createClient()

    // Obtener el último order_index
    const { data: lastLesson } = await supabase
      .from('lessons')
      .select('order_index')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = lastLesson ? lastLesson.order_index + 1 : 0

    const data = {
      module_id: moduleId,
      title: formData.get('title') as string,
      slug: formData.get('slug') as string || generateSlug(formData.get('title') as string),
      description: formData.get('description') as string || null,
      content: formData.get('content') as string || null,
      video_url: formData.get('video_url') as string || null,
      video_duration_minutes: parseInt(formData.get('video_duration_minutes') as string) || null,
      is_free_preview: formData.get('is_free_preview') === 'true',
      order_index: nextOrder,
    }

    // Validar datos
    const validation = validateLessonData(data)
    if (!validation.valid) {
      return { success: false, errors: validation.errors }
    }

    // Crear lección
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [Admin Action] Error al crear lección:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [Admin Action] Lección creada:', lesson.id)
    revalidatePath('/admin/cursos')
    return { success: true, data: lesson }
  } catch (error: any) {
    console.error('❌ [Admin Action] Error inesperado:', error)
    return { success: false, error: error.message }
  }
}

export async function updateLesson(lessonId: string, formData: FormData) {
  console.log('🔍 [Admin Action] Actualizando lección:', lessonId)

  try {
    await requireAdmin()
    const supabase = await createClient()

    const data = {
      title: formData.get('title') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string || null,
      content: formData.get('content') as string || null,
      video_url: formData.get('video_url') as string || null,
      video_duration_minutes: parseInt(formData.get('video_duration_minutes') as string) || null,
      is_free_preview: formData.get('is_free_preview') === 'true',
    }

    const validation = validateLessonData(data)
    if (!validation.valid) {
      return { success: false, errors: validation.errors }
    }

    const { error } = await supabase
      .from('lessons')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lessonId)

    if (error) {
      console.error('❌ [Admin Action] Error al actualizar lección:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [Admin Action] Lección actualizada')
    revalidatePath('/admin/cursos')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteLesson(lessonId: string) {
  console.log('🔍 [Admin Action] Eliminando lección:', lessonId)

  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)

    if (error) {
      console.error('❌ [Admin Action] Error al eliminar lección:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ [Admin Action] Lección eliminada')
    revalidatePath('/admin/cursos')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * PUBLISH ACTIONS
 */

/**
 * Publica un curso después de validar que cumple todos los requisitos
 */
export async function publishCourse(
  courseId: string,
  forcePublish: boolean = false // Si true, ignora warnings (pero no hardErrors)
): Promise<{
  success: boolean
  error?: string
  check: PublishCheckResult
}> {
  // 1. Verificar permisos
  await requireAdmin()

  console.log('🔍 [publishCourse] Verificando curso:', courseId)

  // 2. Ejecutar verificación de publicabilidad
  const check = await checkCoursePublishability(courseId)

  // 3. Si hay hard errors, bloquear
  if (!check.canPublish) {
    console.log('❌ [publishCourse] Bloqueado por errores:', check.hardErrors)
    return {
      success: false,
      error: 'El curso no cumple los requisitos mínimos para ser publicado.',
      check
    }
  }

  // 4. Si hay warnings y no se fuerza, advertir
  if (check.warnings.length > 0 && !forcePublish) {
    console.log('⚠️ [publishCourse] Hay advertencias, requiere confirmación')
    return {
      success: false,
      error: 'WARNINGS_REQUIRE_CONFIRMATION',
      check
    }
  }

  // 5. Publicar el curso
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .update({
      status: 'published',
      updated_at: new Date().toISOString()
    })
    .eq('id', courseId)
    .select('id, title, slug, status')
    .single()

  if (error) {
    console.error('❌ [publishCourse] Error al publicar:', error)
    return {
      success: false,
      error: 'Error al publicar el curso: ' + error.message,
      check
    }
  }

  console.log('✅ [publishCourse] Curso publicado:', data.title)
  revalidatePath('/admin/cursos')
  revalidatePath(`/admin/cursos/${courseId}`)
  revalidatePath('/cursos')

  return {
    success: true,
    check
  }
}

/**
 * Despublica un curso (vuelve a borrador)
 */
export async function unpublishCourse(courseId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  const supabase = await createClient()

  const { error } = await supabase
    .from('courses')
    .update({
      status: 'draft',
      updated_at: new Date().toISOString()
    })
    .eq('id', courseId)

  if (error) {
    console.error('❌ [unpublishCourse] Error:', error)
    return { success: false, error: error.message }
  }

  console.log('✅ [unpublishCourse] Curso despublicado:', courseId)
  revalidatePath('/admin/cursos')
  revalidatePath(`/admin/cursos/${courseId}`)
  revalidatePath('/cursos')

  return { success: true }
}

/**
 * Obtiene el estado de publicabilidad de un curso (para mostrar en UI)
 */
export async function getCoursePublishStatus(courseId: string): Promise<PublishCheckResult> {
  await requireAdmin()
  return checkCoursePublishability(courseId)
}


