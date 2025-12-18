// app/admin/rutas/[id]/page.tsx
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  saveLearningPath,
  addCourseToPath,
  removeCourseFromPath,
  updateCourseOrder,
} from '@/app/admin/rutas/actions'

export const metadata: Metadata = {
  title: 'Editar Ruta | Admin Nodo360',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminPathDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams

  // Validar formato UUID antes de consultar Supabase
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    console.error('[AdminPathDetailPage] ID invalido (no es UUID):', id)
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

  // 1) Datos de la ruta
  const { data: path, error: pathError } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (pathError || !path) {
    console.error('[AdminPathDetail] Error cargando ruta:', pathError)
    notFound()
  }

  // 2) Cursos de esta ruta
  const { data: pathCourses, error: pcError } = await supabase
    .from('path_courses')
    .select(`
      id,
      order_index,
      course:courses (
        id,
        slug,
        title,
        level,
        is_premium
      )
    `)
    .eq('path_id', id)
    .order('order_index', { ascending: true })

  if (pcError) {
    console.error('[AdminPathDetail] Error cargando cursos:', pcError)
  }

  // 3) Todos los cursos disponibles
  const { data: allCourses, error: coursesError } = await supabase
    .from('courses')
    .select('id, slug, title, level, is_premium')
    .order('title', { ascending: true })

  if (coursesError) {
    console.error('[AdminPathDetail] Error cargando cursos:', coursesError)
  }

  // Filtrar cursos ya asignados
  const usedCourseIds = new Set(
    (pathCourses ?? [])
      .map((pc: any) => pc.course?.id)
      .filter((id: string | undefined): id is string => Boolean(id))
  )

  const availableCourses = (allCourses ?? []).filter(
    (c) => !usedCourseIds.has(c.id)
  )

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* CABECERA */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <a
              href="/admin/rutas"
              className="text-[12px] text-[#5A9FD4] hover:text-[#7AB8E8] mb-2 inline-block"
            >
              Volver al listado
            </a>
            <h1 className="text-[24px] font-bold text-[#FAF4ED]">
              {path.emoji && <span className="mr-2">{path.emoji}</span>}
              {path.name}
            </h1>
            <p className="text-[13px] text-[#6F665C] font-mono">/{path.slug}</p>
          </div>

          <a
            href="/admin/cursos"
            className="text-[12px] text-[#5A9FD4] hover:text-[#7AB8E8] hover:underline"
          >
            Ir al panel de cursos
          </a>
        </div>
      </section>

      {/* FORMULARIO DE EDICION DE RUTA */}
      <section className="bg-[rgba(38,36,33,0.96)] border border-[rgba(250,244,237,0.12)] rounded-[18px] p-6">
        <h2 className="text-[18px] font-semibold text-[#FAF4ED] mb-4">
          Datos de la ruta
        </h2>

        <form action={saveLearningPath} className="space-y-4">
          <input type="hidden" name="id" defaultValue={path.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
                Slug *
              </label>
              <input
                name="slug"
                defaultValue={path.slug}
                className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
                Emoji
              </label>
              <input
                name="emoji"
                defaultValue={path.emoji ?? ''}
                className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
                placeholder="e.g. un emoji"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
              Nombre *
            </label>
            <input
              name="name"
              defaultValue={path.name}
              className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
              Descripcion corta
            </label>
            <textarea
              name="short_description"
              defaultValue={path.short_description ?? ''}
              className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition resize-y min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
              Descripcion larga
            </label>
            <textarea
              name="long_description"
              defaultValue={path.long_description ?? ''}
              className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition resize-y min-h-[120px]"
            />
          </div>

          <div className="flex flex-wrap gap-6 items-center">
            <label className="inline-flex items-center gap-2 text-[14px] text-[#D7D3CE] cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={path.is_active}
                className="w-4 h-4 rounded"
              />
              Ruta activa
            </label>

            <div>
              <label className="block text-[12px] font-medium text-[#D7D3CE] mb-1">
                Posicion
              </label>
              <input
                name="position"
                type="number"
                defaultValue={path.position ?? 0}
                className="w-24 rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-3 py-2 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-semibold bg-gradient-to-r from-[#4CAF7A] to-[#F7931A] text-[#1F1E1B] shadow-[0_8px_20px_rgba(247,147,26,0.35)] hover:-translate-y-0.5 transition"
          >
            Guardar cambios
          </button>
        </form>
      </section>

      {/* CURSOS DE ESTA RUTA */}
      <section className="bg-[rgba(38,36,33,0.96)] border border-[rgba(250,244,237,0.12)] rounded-[18px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-semibold text-[#FAF4ED]">
            Cursos en esta ruta
          </h2>
          <span className="text-[12px] text-[#6F665C]">
            {pathCourses?.length ?? 0} curso{pathCourses?.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* TABLA DE CURSOS */}
        {pathCourses && pathCourses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-[rgba(250,244,237,0.1)] text-left text-[#D7D3CE]">
                  <th className="py-2 font-medium w-28">Orden</th>
                  <th className="py-2 font-medium">Curso</th>
                  <th className="py-2 font-medium">Tipo</th>
                  <th className="py-2 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pathCourses.map((pc: any) => (
                  <tr key={pc.id} className="border-b border-[rgba(250,244,237,0.06)]">
                    {/* ORDEN (editable) */}
                    <td className="py-2 pr-2">
                      <form action={updateCourseOrder} className="flex items-center gap-2">
                        <input type="hidden" name="record_id" value={pc.id} />
                        <input type="hidden" name="path_id" value={path.id} />
                        <input
                          type="number"
                          name="order_index"
                          defaultValue={pc.order_index}
                          className="w-16 rounded border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-2 py-1.5 text-[13px] text-[#FAF4ED] text-center focus:border-[#F7931A] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="text-[11px] text-[#5A9FD4] hover:text-[#7AB8E8] hover:underline"
                        >
                          Guardar
                        </button>
                      </form>
                    </td>

                    {/* NOMBRE DEL CURSO */}
                    <td className="py-2 text-[#FAF4ED]">
                      <a
                        href={`/admin/cursos/${pc.course?.id}`}
                        className="hover:text-[#F7931A] transition"
                      >
                        {pc.course?.title}
                      </a>
                      <span className="text-[11px] text-[#6F665C] ml-2 font-mono">
                        ({pc.course?.slug})
                      </span>
                    </td>

                    {/* TIPO */}
                    <td className="py-2 text-[12px]">
                      {pc.course?.is_premium ? (
                        <span className="text-[#F7931A]">Premium</span>
                      ) : (
                        <span className="text-[#4CAF7A]">Gratis</span>
                      )}
                    </td>

                    {/* ACCIONES */}
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <a
                          href={`/admin/cursos/${pc.course?.id}`}
                          className="text-[11px] text-[#5A9FD4] hover:text-[#7AB8E8] hover:underline"
                        >
                          Editar
                        </a>
                        <form action={removeCourseFromPath} className="inline">
                          <input type="hidden" name="path_course_id" value={pc.id} />
                          <input type="hidden" name="path_id" value={path.id} />
                          <button
                            type="submit"
                            className="text-[11px] text-[#E15B5B] hover:text-[#FF7B7B] hover:underline"
                          >
                            Quitar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[rgba(38,36,33,0.5)] border border-[rgba(250,244,237,0.08)] rounded-lg p-4 text-center mb-4">
            <p className="text-[13px] text-[#6F665C]">
              Esta ruta todavia no tiene cursos asignados.
            </p>
          </div>
        )}

        {/* ANADIR CURSO */}
        <div className="border-t border-[rgba(250,244,237,0.1)] pt-5 mt-4">
          <h3 className="text-[14px] font-semibold text-[#FAF4ED] mb-3">
            Anadir curso a esta ruta
          </h3>

          {availableCourses.length > 0 ? (
            <form action={addCourseToPath} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="path_id" value={path.id} />

              <select
                name="course_id"
                className="flex-1 min-w-[200px] rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
                required
              >
                <option value="">Selecciona un curso...</option>
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.slug})
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold bg-[#5A9FD4] text-white hover:-translate-y-0.5 hover:bg-[#6BB0E5] transition"
              >
                Anadir curso
              </button>
            </form>
          ) : (
            <p className="text-[13px] text-[#6F665C]">
              No hay cursos disponibles para anadir (todos ya estan asignados).
            </p>
          )}

          {pathCourses && pathCourses.length > 0 && availableCourses.length > 0 && (
            <p className="text-[11px] text-[#6F665C] mt-3">
              Los cursos ya asignados no aparecen en el selector.
            </p>
          )}
        </div>
      </section>

      {/* NAVEGACION */}
      <section className="bg-[rgba(59,116,159,0.08)] border border-[rgba(59,116,159,0.2)] rounded-[14px] p-5">
        <h3 className="text-[14px] font-semibold text-[#FAF4ED] mb-2">
          Navegacion entre paneles
        </h3>
        <ul className="text-[13px] text-[#D7D3CE] space-y-1">
          <li>
            <a href="/admin/rutas" className="text-[#5A9FD4] hover:underline">Panel de rutas</a> - Ver y editar todas las rutas
          </li>
          <li>
            <a href="/admin/cursos" className="text-[#5A9FD4] hover:underline">Panel de cursos</a> - Ver y editar todos los cursos
          </li>
        </ul>
      </section>
    </main>
  )
}
