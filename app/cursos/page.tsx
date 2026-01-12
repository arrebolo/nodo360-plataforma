import { getAllCourses } from '@/lib/db/courses-queries'
import { CursosClient } from '@/components/cursos/CursosClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cursos de Bitcoin y Blockchain | Nodo360',
  description: 'Aprende Bitcoin y Blockchain desde cero con cursos gratuitos y premium en español',
}

export default async function CursosPage() {
  console.log('🚀 [CursosPage] Renderizando página de cursos...')

  // Fetch courses server-side
  const courses = await getAllCourses()

  console.log(`📊 [CursosPage] ${courses.length} cursos obtenidos`)

  return <CursosClient allCourses={courses} />
}


