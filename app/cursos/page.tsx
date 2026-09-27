import { getAllCourses } from '@/lib/db/courses-queries'
import { CursosClient } from '@/components/cursos/CursosClient'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  // Propio, y no el del layout raiz: ese decia que esta pagina era una
  // copia de la home.
  alternates: { canonical: '/cursos' },
  title: 'Cursos de Bitcoin y Blockchain',
  description: 'Aprende Bitcoin, Blockchain, DeFi y Web3 con cursos en español. Desde principiante hasta avanzado. Certificados incluidos.',
  openGraph: {
    title: 'Cursos de Bitcoin y Blockchain | Nodo360',
    description: 'Aprende Bitcoin, Blockchain, DeFi y Web3 con cursos en español.',
    type: 'website',
    url: 'https://nodo360.com/cursos',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cursos de Bitcoin y Blockchain | Nodo360',
    description: 'Aprende Bitcoin, Blockchain, DeFi y Web3 con cursos en español.',
  },
}

export default async function CursosPage() {
  const courses = await getAllCourses()

  // Matriculas del usuario, para que la tarjeta diga "Continuar" o "Repasar"
  // en lugar de tratar a todo el mundo como si no estuviera inscrito. Si no
  // hay sesion, el mapa queda vacio y las tarjetas se comportan como antes.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const matriculas = new Map<string, { progreso: number; completado: boolean }>()
  if (user) {
    const { data } = await supabase
      .from('course_enrollments')
      .select('course_id, progress_percentage, completed_at')
      .eq('user_id', user.id)

    for (const m of data ?? []) {
      matriculas.set(m.course_id, {
        progreso: m.progress_percentage ?? 0,
        completado: !!m.completed_at || (m.progress_percentage ?? 0) >= 100,
      })
    }
  }

  return (
    <CursosClient
      allCourses={courses}
      matriculas={Object.fromEntries(matriculas)}
    />
  )
}


