// Ejemplo de estructura de datos para un curso
// Este archivo muestra cómo organizar los datos de tus cursos

export const exampleCourseData = {
  id: 'fundamentos-blockchain',
  slug: 'fundamentos-blockchain',
  title: 'Fundamentos de Blockchain',
  description: 'Entiende la tecnología que impulsa Bitcoin y las criptomonedas del futuro',
  level: 'beginner',
  duration: '12 horas',
  
  modules: [
    {
      id: 'modulo-1',
      slug: 'modulo-1',
      title: 'Introducción a Blockchain',
      description: 'Conceptos básicos y fundamentos',
      lessons: [
        {
          id: 'leccion-1-1',
          slug: 'que-es-blockchain',
          title: '¿Qué es Blockchain?',
          duration: '15 min',
          type: 'video',
        },
        {
          id: 'leccion-1-2',
          slug: 'historia-blockchain',
          title: 'Historia de Blockchain',
          duration: '12 min',
          type: 'video',
        },
        {
          id: 'leccion-1-3',
          slug: 'casos-uso',
          title: 'Casos de Uso',
          duration: '18 min',
          type: 'video',
        },
      ]
    },
    {
      id: 'modulo-2',
      slug: 'modulo-2',
      title: 'Criptografía Básica',
      description: 'Hash, firmas digitales y más',
      lessons: [
        {
          id: 'leccion-2-1',
          slug: 'funciones-hash',
          title: 'Funciones Hash',
          duration: '20 min',
          type: 'video',
        },
        {
          id: 'leccion-2-2',
          slug: 'criptografia-asimetrica',
          title: 'Criptografía Asimétrica',
          duration: '22 min',
          type: 'video',
        },
        {
          id: 'leccion-2-3',
          slug: 'firmas-digitales',
          title: 'Firmas Digitales',
          duration: '16 min',
          type: 'video',
        },
      ]
    },
    {
      id: 'modulo-3',
      slug: 'modulo-3',
      title: 'Bloques y Cadenas',
      description: 'Cómo funciona la cadena de bloques',
      lessons: [
        {
          id: 'leccion-3-1',
          slug: 'estructura-bloque',
          title: 'Estructura de un Bloque',
          duration: '18 min',
          type: 'video',
        },
        {
          id: 'leccion-3-2',
          slug: 'mineria-consenso',
          title: 'Minería y Consenso',
          duration: '25 min',
          type: 'video',
        },
        {
          id: 'leccion-3-3',
          slug: 'seguridad-inmutabilidad',
          title: 'Seguridad e Inmutabilidad',
          duration: '20 min',
          type: 'video',
        },
      ]
    },
  ]
}

// Ejemplo de breadcrumbs para una lección específica
export const exampleBreadcrumbs = [
  { label: 'Inicio', href: '/' },
  { label: 'Cursos', href: '/cursos' },
  { label: 'Fundamentos de Blockchain', href: '/cursos/fundamentos-blockchain' },
  { label: 'Módulo 1', href: '/cursos/fundamentos-blockchain/modulo-1' },
  { label: '¿Qué es Blockchain?' }, // Sin href = página actual
]

// Ejemplo de progreso del usuario
export const exampleUserProgress = {
  courseId: 'fundamentos-blockchain',
  completedLessons: [
    'leccion-1-1',
    'leccion-1-2',
    'leccion-2-1',
  ],
  currentLesson: 'leccion-2-2',
  lastAccessed: '2025-11-11T10:30:00Z',
}
