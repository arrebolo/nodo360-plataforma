// app/admin/rutas/nueva/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { saveLearningPath } from '@/app/admin/rutas/actions'

export const metadata: Metadata = {
  title: 'Nueva Ruta | Admin Nodo360',
}

export default async function NewPathPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold text-[#FAF4ED]">
          Nueva ruta de aprendizaje
        </h1>
        <Link
          href="/admin/rutas"
          className="text-[13px] text-[#5A9FD4] hover:text-[#7AB8E8]"
        >
          Volver al listado
        </Link>
      </div>

      {/* Formulario */}
      <form action={saveLearningPath} className="space-y-5">
        <input type="hidden" name="id" value="" />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
              Slug *
            </label>
            <input
              name="slug"
              className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] placeholder-[#6F665C] focus:border-[#F7931A] focus:outline-none transition font-mono"
              placeholder="bitcoin-soberano"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
              Emoji
            </label>
            <input
              name="emoji"
              className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] placeholder-[#6F665C] focus:border-[#F7931A] focus:outline-none transition"
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
            className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] placeholder-[#6F665C] focus:border-[#F7931A] focus:outline-none transition"
            placeholder="Ruta Bitcoin - De cero a usuario soberano"
            required
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
            Descripcion corta
          </label>
          <textarea
            name="short_description"
            className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] placeholder-[#6F665C] focus:border-[#F7931A] focus:outline-none transition resize-y min-h-[80px]"
            placeholder="Breve descripcion para las tarjetas..."
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#D7D3CE] mb-1.5">
            Descripcion larga
          </label>
          <textarea
            name="long_description"
            className="w-full rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-4 py-2.5 text-[14px] text-[#FAF4ED] placeholder-[#6F665C] focus:border-[#F7931A] focus:outline-none transition resize-y min-h-[120px]"
            placeholder="Descripcion detallada de la ruta..."
          />
        </div>

        <div className="flex flex-wrap gap-6 items-center py-2">
          <label className="inline-flex items-center gap-2 text-[14px] text-[#D7D3CE] cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked
              className="w-4 h-4 rounded border-[rgba(250,244,237,0.2)] bg-[#2C2A28] text-[#4CAF7A] focus:ring-[#4CAF7A]"
            />
            <span>Ruta activa</span>
          </label>

          <div>
            <label className="block text-[12px] font-medium text-[#D7D3CE] mb-1">
              Posicion
            </label>
            <input
              name="position"
              type="number"
              defaultValue={1}
              className="w-24 rounded-lg border border-[rgba(250,244,237,0.15)] bg-[#2C2A28] px-3 py-2 text-[14px] text-[#FAF4ED] focus:border-[#F7931A] focus:outline-none transition"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-semibold bg-gradient-to-r from-[#4CAF7A] to-[#F7931A] text-[#1F1E1B] shadow-[0_8px_20px_rgba(247,147,26,0.35)] hover:-translate-y-0.5 transition"
          >
            Crear ruta
          </button>

          <Link
            href="/admin/rutas"
            className="px-5 py-2.5 rounded-full border border-[rgba(250,244,237,0.2)] text-[14px] text-[#D7D3CE] hover:bg-[rgba(250,244,237,0.05)] transition"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  )
}
