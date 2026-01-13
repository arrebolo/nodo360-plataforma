import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BookmarksList } from './BookmarksList'

export const metadata = {
  title: 'Guardados | Nodo360',
  description: 'Tus lecciones guardadas para ver después'
}

export default async function BookmarksPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`
      id,
      lesson_id,
      note,
      created_at,
      lesson:lesson_id (
        id,
        title,
        slug,
        description,
        video_duration_minutes,
        module:module_id (
          id,
          title,
          course:course_id (
            id,
            title,
            slug,
            thumbnail_url,
            level
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

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
          <span className="text-3xl">🔖</span>
          Guardados
        </h1>
        <p className="text-white/50">Lecciones que has guardado para ver después</p>
      </div>

      <BookmarksList initialBookmarks={(bookmarks || []) as any} />
    </div>
  )
}
