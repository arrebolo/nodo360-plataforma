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
  // Verify admin access
  await requireAdmin('/admin')

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Capa sutil cálida (estilo Nodo360) */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-emerald-500/5" />

      <AdminSidebar />

      <div className="relative flex-1 flex flex-col min-h-screen">
        <AdminHeader />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}


