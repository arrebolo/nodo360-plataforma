import { requireAdmin } from '@/lib/admin/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export const metadata = {
  title: 'Panel Admin | Nodo360',
  description: 'Panel de administración de Nodo360',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar autenticación y permisos
  const { profile } = await requireAdmin('/admin')

  return (
    <div className="min-h-screen bg-[#0a0d14] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <AdminHeader user={{
          full_name: profile.full_name,
          email: profile.email || 'Admin',
          role: profile.role
        }} />
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
