import { requireAdmin } from '@/lib/admin/auth'
import Sidebar from '@/components/admin/Sidebar'

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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <Sidebar
            userEmail={profile.email || 'Admin'}
            userRole={profile.role}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
