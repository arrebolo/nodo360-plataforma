import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export const metadata: Metadata = {
  title: 'Panel Admin | Nodo360',
  description: 'Panel de administración de Nodo360',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireAdmin('/admin')

  const displayName = profile.full_name?.trim() || 'Administrador'
  const displayEmail = profile.email?.trim() || 'admin@nodo360'

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Capa sutil cálida (estilo Nodo360) */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-emerald-500/5" />

      <AdminSidebar />

      <div className="relative flex-1 flex flex-col min-h-screen">
        <AdminHeader
          user={{
            full_name: displayName,
            email: displayEmail,
            role: profile.role,
          }}
        />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
