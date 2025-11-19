// Exportar cliente y funciones de conexión
export { createClient, testConnection } from './client';

// Exportar tipos
export type { Database } from './types';

// Exportar helpers (solo funciones públicas sin autenticación)
export {
  // Cursos
  getCourses,
  getCourseBySlug,
  getCourseWithContent,

  // Módulos
  getModulesByCourse,

  // Lecciones
  getLessonsByModule,
  getLessonBySlug,

  // Progreso, Bookmarks, Notas - Comentados para MVP (requieren autenticación)
  // markLessonCompleted,
  // getUserProgressByCourse,
  // addBookmark,
  // removeBookmark,
  // getUserBookmarks,
  // saveNote,
  // getLessonNotes,
  // deleteNote,
} from './helpers';