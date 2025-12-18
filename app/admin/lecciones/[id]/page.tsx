// app/admin/lecciones/[id]/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateLessonMedia, updateLessonBasic } from '@/app/admin/lecciones/actions'

export const metadata: Metadata = {
  title: 'Editar Leccion | Admin Nodo360',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminLessonEditPage({ params }: PageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams

  // Validar formato UUID antes de consultar Supabase
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    console.error('[AdminLessonEditPage] ID invalido (no es UUID):', id)
    notFound()
  }

  const supabase = await createClient()

  // Verificar autenticacion
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar rol admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  // Cargar leccion
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      slug,
      description,
      order_index,
      video_duration_minutes,
      video_url,
      slides_url,
      pdf_url,
      resources_url,
      module_id
    `)
    .eq('id', id)
    .maybeSingle()

  if (error || !lesson) {
    console.error('[AdminLessonEditPage] Error cargando leccion:', error)
    notFound()
  }

  // Cargar modulo para mostrar contexto
  let moduleInfo: { id: string; title: string; course_id: string } | null = null
  let courseInfo: { id: string; title: string; slug: string } | null = null

  if (lesson.module_id) {
    const { data: moduleData } = await supabase
      .from('modules')
      .select('id, title, course_id')
      .eq('id', lesson.module_id)
      .maybeSingle()

    if (moduleData) {
      moduleInfo = moduleData

      if (moduleData.course_id) {
        const { data: courseData } = await supabase
          .from('courses')
          .select('id, title, slug')
          .eq('id', moduleData.course_id)
          .maybeSingle()

        courseInfo = courseData
      }
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-[#6F665C]">
        <Link href="/admin/cursos" className="hover:text-[#5A9FD4]">
          Cursos
        </Link>
        {courseInfo && (
          <>
            <span>/</span>
            <Link href={`/admin/cursos/${courseInfo.id}`} className="hover:text-[#5A9FD4]">
              {courseInfo.title}
            </Link>
          </>
        )}
        {moduleInfo && (
          <>
            <span>/</span>
            <span className="text-[#D7D3CE]">{moduleInfo.title}</span>
          </>
        )}
        <span>/</span>
        <span className="text-[#FAF4ED]">{lesson.title}</span>
      </nav>

      {/* Header */}
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#F7931A]/80 font-medium">
          Leccion
        </p>
        <h1 className="text-[24px] font-bold text-[#FAF4ED]">
          {lesson.title}
        </h1>
        <p className="text-[13px] text-[#D7D3CE]">
          Configura el contenido multimedia y los datos basicos de esta leccion.
        </p>
      </header>

      {/* SECCION 1: DATOS BASICOS */}
      <section className="bg-[rgba(38,36,33,0.96)] border border-[rgba(250,244,237,0.12)] rounded-[18px] p-6">
        <h2 className="text-[16px] font-semibold text-[#FAF4ED] mb-4">
          Datos basicos
        </h2>

        <form action={updateLessonBasic} className="space-y-4">
          <input type="hidden" name="lesson_id" value={id} />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
                Titulo *
              </label>
              <input
                name="title"
                defaultValue={lesson.title ?? ''}
                className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
                Slug *
              </label>
              <input
                name="slug"
                defaultValue={lesson.slug ?? ''}
                className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
              Descripcion
            </label>
            <textarea
              name="description"
              defaultValue={lesson.description ?? ''}
              className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition resize-y min-h-[80px]"
              placeholder="Breve descripcion de la leccion..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
                Orden
              </label>
              <input
                name="order_index"
                type="number"
                defaultValue={lesson.order_index ?? 1}
                className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
                Duracion (minutos)
              </label>
              <input
                name="video_duration_minutes"
                type="number"
                defaultValue={lesson.video_duration_minutes ?? ''}
                className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
                placeholder="15"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold bg-[#5A9FD4] text-white hover:-translate-y-0.5 transition"
          >
            Guardar datos basicos
          </button>
        </form>
      </section>

      {/* SECCION 2: CONTENIDO MULTIMEDIA */}
      <section className="bg-[rgba(38,36,33,0.96)] border border-[rgba(250,244,237,0.12)] rounded-[18px] p-6">
        <h2 className="text-[16px] font-semibold text-[#FAF4ED] mb-4">
          Contenido multimedia
        </h2>

        <form action={updateLessonMedia} className="space-y-4">
          <input type="hidden" name="lesson_id" value={id} />

          {/* VIDEO */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#D7D3CE]">
              URL del video
            </label>
            <input
              name="video_url"
              defaultValue={lesson.video_url ?? ''}
              className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
              placeholder="https://youtu.be/... o https://vimeo.com/..."
            />
            <p className="text-[11px] text-[#6F665C]">
              Recomendado: video en YouTube/Vimeo como &quot;no listado&quot; o URL de video en Supabase Storage.
            </p>
          </div>

          {/* SLIDES */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#D7D3CE]">
              URL de presentacion (slides)
            </label>
            <input
              name="slides_url"
              defaultValue={lesson.slides_url ?? ''}
              className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
              placeholder="https://.../presentacion.pdf"
            />
            <p className="text-[11px] text-[#6F665C]">
              Puedes subir un PDF o PPTX a Supabase Storage (bucket &quot;lesson-assets&quot;) y pegar aqui el enlace publico.
            </p>
          </div>

          {/* PDF */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#D7D3CE]">
              URL de PDF/Documento
            </label>
            <input
              name="pdf_url"
              defaultValue={lesson.pdf_url ?? ''}
              className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
              placeholder="https://drive.google.com/file/d/... o https://dropbox.com/..."
            />
            <p className="text-[11px] text-[#6F665C]">
              PDF en Google Drive, Dropbox, o enlace directo.
            </p>
          </div>

          {/* RECURSOS */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#D7D3CE]">
              URL de guia o recursos
            </label>
            <input
              name="resources_url"
              defaultValue={lesson.resources_url ?? ''}
              className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
              placeholder="https://.../guia.pdf o pagina externa (Notion, GitBook, etc.)"
            />
            <p className="text-[11px] text-[#6F665C]">
              Enlace a guia extendida, checklist, documentacion o cualquier recurso adicional.
            </p>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold bg-gradient-to-r from-[#4CAF7A] to-[#F7931A] text-[#1F1E1B] shadow-[0_8px_20px_rgba(247,147,26,0.35)] hover:-translate-y-0.5 transition"
          >
            Guardar contenido multimedia
          </button>
        </form>
      </section>

      {/* Vista previa de URLs */}
      {(lesson.video_url || lesson.slides_url || lesson.pdf_url || lesson.resources_url) && (
        <section className="bg-[rgba(59,116,159,0.08)] border border-[rgba(59,116,159,0.2)] rounded-[14px] p-5">
          <h3 className="text-[14px] font-semibold text-[#FAF4ED] mb-3">
            Enlaces actuales
          </h3>
          <ul className="space-y-2 text-[13px]">
            {lesson.video_url && (
              <li className="flex items-center gap-2">
                <span className="text-[#6F665C]">Video:</span>
                <a
                  href={lesson.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5A9FD4] hover:underline truncate max-w-[400px]"
                >
                  {lesson.video_url}
                </a>
              </li>
            )}
            {lesson.slides_url && (
              <li className="flex items-center gap-2">
                <span className="text-[#6F665C]">Slides:</span>
                <a
                  href={lesson.slides_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5A9FD4] hover:underline truncate max-w-[400px]"
                >
                  {lesson.slides_url}
                </a>
              </li>
            )}
            {lesson.pdf_url && (
              <li className="flex items-center gap-2">
                <span className="text-[#6F665C]">PDF:</span>
                <a
                  href={lesson.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5A9FD4] hover:underline truncate max-w-[400px]"
                >
                  {lesson.pdf_url}
                </a>
              </li>
            )}
            {lesson.resources_url && (
              <li className="flex items-center gap-2">
                <span className="text-[#6F665C]">Recursos:</span>
                <a
                  href={lesson.resources_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5A9FD4] hover:underline truncate max-w-[400px]"
                >
                  {lesson.resources_url}
                </a>
              </li>
            )}
          </ul>
        </section>
      )}

      {/* Enlace de vuelta */}
      <div className="pt-4">
        {courseInfo ? (
          <Link
            href={`/admin/cursos/${courseInfo.id}`}
            className="text-[13px] text-[#5A9FD4] hover:text-[#7AB8E8] transition-colors"
          >
            ← Volver al curso
          </Link>
        ) : (
          <Link
            href="/admin/cursos"
            className="text-[13px] text-[#5A9FD4] hover:text-[#7AB8E8] transition-colors"
          >
            ← Volver a cursos
          </Link>
        )}
      </div>
    </main>
  )
}
