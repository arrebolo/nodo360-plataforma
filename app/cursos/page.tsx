import { getAllCourses } from '@/lib/db/courses-queries'
import { CursosClient } from '@/components/cursos/CursosClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cursos de Bitcoin y Blockchain | Nodo360',
  description: 'Aprende Bitcoin, Blockchain, DeFi y Web3 con cursos en español. Desde principiante hasta avanzado. Certificados incluidos.',
  openGraph: {
    title: 'Cursos de Bitcoin y Blockchain | Nodo360',
    description: 'Aprende Bitcoin, Blockchain, DeFi y Web3 con cursos en español.',
    type: 'website',
    url: 'https://nodo360.com/cursos',
    images: [{ url: '/imagenes/og-cursos.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cursos de Bitcoin y Blockchain | Nodo360',
    description: 'Aprende Bitcoin, Blockchain, DeFi y Web3 con cursos en español.',
  },
}

export default async function CursosPage() {
  console.log('🚀 [CursosPage] Renderizando página de cursos...')

  // Fetch courses server-side
  const courses = await getAllCourses()

  console.log(`📊 [CursosPage] ${courses.length} cursos obtenidos`)

  return <CursosClient allCourses={courses} />
}


