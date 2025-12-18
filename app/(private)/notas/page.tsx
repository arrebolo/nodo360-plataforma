// app/(private)/notas/page.tsx

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FilePenLine, BookOpen, Clock, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NotesPage() {
  const supabase = await createClient()

  // 1) Comprobamos usuario
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login?redirect=/notas')
  }

  // 2) Traer notas del usuario con info de lección y curso
  const { data: notes, error } = await supabase
    .from('notes')
    .select(
      `
      id,
      content,
      video_timestamp_seconds,
      created_at,
      lesson:lesson_id (
        id,
        title,
        slug,
        module:modules (
          id,
          title,
          course:courses (
            id,
            title,
            slug
          )
        )
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Notas] Error cargando notas:', error)
  }

  // Tipar las notas para acceso seguro a relaciones anidadas
  type NoteWithRelations = {
    id: string
    content: string
    video_timestamp_seconds: number | null
    created_at: string
    lesson: {
      id: string
      title: string
      slug: string
      module: {
        id: string
        title: string
        course: {
          id: string
          title: string
          slug: string
        } | null
      } | null
    } | null
  }

  const safeNotes = (notes || []) as unknown as NoteWithRelations[]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff6b35] to-[#f7931a] bg-clip-text text-transparent">
              Mis Notas
            </h1>
            <p className="text-sm text-white/60 mt-1">
              Revisa y vuelve rápidamente a las lecciones donde tomaste notas.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Link>
        </div>

        {/* Resumen simple */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ff6b35]/20">
              <FilePenLine className="w-5 h-5 text-[#ff6b35]" />
            </div>
            <div>
              <p className="text-xs text-white/60">Total de notas</p>
              <p className="text-xl font-semibold">
                {safeNotes.length}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#38bdf8]/20">
              <BookOpen className="w-5 h-5 text-[#38bdf8]" />
            </div>
            <div>
              <p className="text-xs text-white/60">Cursos con notas</p>
              <p className="text-xl font-semibold">
                {
                  new Set(
                    safeNotes
                      .map((n) => n.lesson?.module?.course?.id)
                      .filter(Boolean) as string[]
                  ).size
                }
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-white/60">Última nota</p>
              <p className="text-sm font-medium">
                {safeNotes[0]?.created_at
                  ? new Date(safeNotes[0].created_at).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Sin notas aún'}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de notas */}
        {safeNotes.length === 0 ? (
          <div className="mt-10 text-center text-white/60">
            <p className="text-lg mb-2">Todavía no has creado notas ✍️</p>
            <p className="text-sm">
              Durante una lección, usa el panel de notas para guardar ideas importantes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {safeNotes.map((note) => {
              const lesson = note.lesson
              const module = lesson?.module
              const course = module?.course

              const timeLabel =
                typeof note.video_timestamp_seconds === 'number'
                  ? `${Math.floor(note.video_timestamp_seconds / 60)
                      .toString()
                      .padStart(2, '0')}:${(note.video_timestamp_seconds % 60)
                      .toString()
                      .padStart(2, '0')}`
                  : null

              const lessonUrl =
                course && lesson
                  ? `/cursos/${course.slug}/${lesson.slug}`
                  : undefined

              return (
                <div
                  key={note.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
                >
                  {/* Cabecera: curso + lección */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      {course && (
                        <p className="text-xs text-white/50 truncate">
                          {course.title}
                        </p>
                      )}
                      {lesson && (
                        <p className="text-sm font-semibold truncate">
                          {lesson.title}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-white/50">
                      {timeLabel && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 border border-white/10">
                          <Clock className="w-3 h-3" />
                          {timeLabel}
                        </span>
                      )}
                      {note.created_at && (
                        <span>
                          {new Date(note.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contenido de la nota */}
                  <p className="text-sm text-white/80 whitespace-pre-wrap mb-3">
                    {note.content}
                  </p>

                  {/* Botón para volver a la lección */}
                  {lessonUrl && (
                    <div className="flex justify-end">
                      <Link
                        href={lessonUrl}
                        className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white hover:opacity-90 transition"
                      >
                        Volver a la lección
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
