import { Metadata } from 'next'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const metadata: Metadata = {
  title: 'Admin Panel | Nodo360',
  description: 'Panel de administración de Nodo360',
  robots: {
    index: false,
    follow: false,
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#070a10]">
      {/* Sidebar de Admin */}
      <AdminSidebar />

      {/* Contenido principal */}
      <main className="flex-1 lg:ml-64">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
