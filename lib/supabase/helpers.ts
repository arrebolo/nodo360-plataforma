import { supabase } from './client';
import type { Database } from './types';

// Tipos para facilitar el uso
type Course = Database['public']['Tables']['courses']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

/**
 * CURSOS
 */

// Obtener todos los cursos
export async function getCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('order_index', { ascending: true });
  
  if (error) throw error;
  return data as Course[];
}

// Obtener un curso por slug
export async function getCourseBySlug(slug: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) throw error;
  return data as Course;
}

// Obtener curso con sus módulos y lecciones
export async function getCourseWithContent(slug: string) {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules (
        *,
        lessons (*)
      )
    `)
    .eq('slug', slug)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * MÓDULOS
 */

// Obtener módulos de un curso
export async function getModulesByCourse(courseId: string) {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  
  if (error) throw error;
  return data as Module[];
}

/**
 * LECCIONES
 */

// Obtener lecciones de un módulo
export async function getLessonsByModule(moduleId: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true });
  
  if (error) throw error;
  return data as Lesson[];
}

// Obtener una lección por slug
export async function getLessonBySlug(moduleSlug: string, lessonSlug: string) {
  console.log('🔍 [helpers.getLessonBySlug] Buscando lección:', { moduleSlug, lessonSlug })

  const { data, error } = await supabase
    .from('lessons')
    .select(`
      *,
      module:modules!inner (
        slug,
        course_id,
        course:courses!inner (
          slug
        )
      )
    `)
    .eq('slug', lessonSlug)
    .eq('module.slug', moduleSlug)
    .single();

  if (error) {
    console.error('❌ [helpers.getLessonBySlug] Error:', error)
    throw error;
  }

  console.log('✅ [helpers.getLessonBySlug] Lección encontrada:', {
    lessonSlug: (data as any)?.slug,
    moduleSlug: (data as any)?.module?.slug,
    courseSlug: (data as any)?.module?.course?.slug
  })

  return data;
}

/**
 * PROGRESO DEL USUARIO, BOOKMARKS, NOTAS
 * Comentado para MVP - requiere autenticación
 */

/*
// Marcar una lección como completada
export async function markLessonCompleted(userId: string, lessonId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Obtener progreso del usuario en un curso
export async function getUserProgressByCourse(userId: string, courseId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .select(`
      *,
      lessons!inner (
        id,
        modules!inner (
          course_id
        )
      )
    `)
    .eq('user_id', userId)
    .eq('lessons.modules.course_id', courseId);

  if (error) throw error;
  return data;
}

// Agregar bookmark
export async function addBookmark(userId: string, lessonId: string) {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: userId,
      lesson_id: lessonId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Eliminar bookmark
export async function removeBookmark(userId: string, lessonId: string) {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('lesson_id', lessonId);

  if (error) throw error;
}

// Obtener bookmarks del usuario
export async function getUserBookmarks(userId: string) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      lessons (
        *,
        modules (
          *,
          courses (*)
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Crear o actualizar nota
export async function saveNote(userId: string, lessonId: string, content: string) {
  const { data, error } = await supabase
    .from('notes')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Obtener notas de una lección
export async function getLessonNotes(userId: string, lessonId: string) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Eliminar nota
export async function deleteNote(noteId: string) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) throw error;
}
*/