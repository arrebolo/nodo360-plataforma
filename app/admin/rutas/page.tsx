// app/admin/rutas/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Rutas de Aprendizaje | Admin Nodo360',
}

export default async function AdminPathsPage() {
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

  // Cargar rutas
  const { data: paths, error } = await supabase
    .from('learning_paths')
    .select('id, slug, name, emoji, is_active, position, created_at')
    .order('position', { ascending: true })

  if (error) {
    console.error('[AdminPaths] Error cargando rutas:', error)
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#FAF4ED]">
            Rutas de Aprendizaje
          </h1>
          <p className="text-[13px] text-[#D7D3CE] mt-1">
            Gestiona las rutas y sus cursos asociados
          </p>
        </div>
        <Link
          href="/admin/rutas/nueva"
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold bg-gradient-to-r from-[#4CAF7A] to-[#F7931A] text-[#1F1E1B] shadow-[0_8px_20px_rgba(247,147,26,0.35)] hover:-translate-y-0.5 transition"
        >
          Nueva ruta
        </Link>
      </div>

      {/* Tabla */}
      <div className="bg-[rgba(38,36,33,0.96)] border border-[rgba(250,244,237,0.12)] rounded-[18px] overflow-hidden">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-[rgba(250,244,237,0.1)] text-left text-[#D7D3CE]">
              <th className="py-3 px-4 font-medium">Nombre</th>
              <th className="py-3 px-4 font-medium">Slug</th>
              <th className="py-3 px-4 font-medium text-center">Activa</th>
              <th className="py-3 px-4 font-medium text-center">Posicion</th>
              <th className="py-3 px-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paths?.map((p) => (
              <tr
                key={p.id}
                className="border-b border-[rgba(250,244,237,0.06)] hover:bg-[rgba(250,244,237,0.03)] transition"
              >
                <td className="py-3 px-4 text-[#FAF4ED]">
                  {p.emoji && <span className="mr-2">{p.emoji}</span>}
                  {p.name}
                </td>
                <td className="py-3 px-4 text-[12px] text-[#6F665C] font-mono">
                  {p.slug}
                </td>
                <td className="py-3 px-4 text-center">
                  {p.is_active ? (
                    <span className="text-[#4CAF7A]">Si</span>
                  ) : (
                    <span className="text-[#6F665C]">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center text-[#D7D3CE]">
                  {p.position}
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/admin/rutas/${p.id}`}
                    className="text-[12px] text-[#5A9FD4] hover:text-[#7AB8E8] hover:underline transition"
                  >
                    Editar / Cursos
                  </Link>
                </td>
              </tr>
            ))}
            {(!paths || paths.length === 0) && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#6F665C]">
                  No hay rutas creadas todavia
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
