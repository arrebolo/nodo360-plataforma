import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { NotesList } from './NotesList'

export const metadata = {
  title: 'Mis Notas | Nodo360',
  description: 'Todas tus notas de las lecciones'
}

export default async function NotesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notes } = await supabase
    .from('user_notes')
    .select(`
      id,
      note_text,
      created_at,
      updated_at,
      lesson_id,
      lesson:lesson_id (
        id,
        title,
        slug,
        module:module_id (
          id,
          title,
          course:course_id (
            id,
            title,
            slug
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <FileText className="w-7 h-7 text-brand-light" />
          Mis Notas
        </h1>
        <p className="text-white/50">Todas las notas que has tomado en tus lecciones</p>
      </div>

      <NotesList initialNotes={(notes || []) as any} />
    </div>
  )
}
