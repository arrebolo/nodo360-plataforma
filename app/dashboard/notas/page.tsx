import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search, BookOpen, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NotesDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="text-white p-10">
        Debes iniciar sesión para ver tus notas.
      </div>
    )
  }

  // Obtener todas las notas del usuario con relación a lecciones y cursos
  const { data: notes } = await supabase
    .from('user_notes')
    .select(`
      id,
      content,
      updated_at,
      lesson:lessons(
        id,
        title,
        slug,
        module:modules(
          id,
          title,
          order_index,
          course:courses(
            id,
            title,
            slug
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // Tipar las notas para acceso seguro a relaciones anidadas
  type NoteWithRelations = {
    id: string
    content: string
    updated_at: string
    lesson: {
      id: string
      title: string
      slug: string
      module: {
        id: string
        title: string
        order_index: number
        course: {
          id: string
          title: string
          slug: string
        }
      }
    }
  }

  const typedNotes = (notes || []) as unknown as NoteWithRelations[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e] pb-20">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1a1f2e]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Mis Notas</h1>
          <Link
            href="/dashboard"
            className="text-white/70 hover:text-white transition"
          >
            Volver al panel
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-10">

        {/* Buscador */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-3 text-white/40 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar notas..."
            className="w-full bg-white/5 border border-white/10 text-white px-10 py-3 rounded-xl placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#f7931a]"
          />
        </div>

        {/* Si no hay notas */}
        {typedNotes.length === 0 && (
          <div className="text-white/60 text-center py-20">
            Aún no has tomado ninguna nota.
          </div>
        )}

        {/* Lista de notas */}
        <div className="space-y-4">
          {typedNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {note.lesson.title}
                  </h3>

                  <div className="text-white/50 text-sm mt-1 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{note.lesson.module.course.title}</span>
                    <ChevronRight className="w-4 h-4" />
                    <span>{note.lesson.module.title}</span>
                  </div>
                </div>

                <Link
                  href={`/cursos/${note.lesson.module.course.slug}/${note.lesson.slug}`}
                  className="text-[#f7931a] hover:underline"
                >
                  Ir a la lección →
                </Link>
              </div>

              <p className="text-white/70 mt-4 whitespace-pre-wrap">
                {note.content}
              </p>

              <div className="text-white/40 text-xs mt-3">
                Última edición: {new Date(note.updated_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
