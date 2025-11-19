import { requireAdmin } from '@/lib/admin/auth'
import { Users } from 'lucide-react'

export const metadata = {
  title: 'Usuarios | Admin Nodo360',
}

export default async function UsuariosPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto text-center py-20">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#24D4FF]/10 border border-[#24D4FF]/30 mb-8">
          <Users className="w-12 h-12 text-[#24D4FF]" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Gestión de Usuarios
        </h1>
        <p className="text-xl text-[#C5C7D3] mb-8">
          Próximamente: Administración de usuarios, roles y permisos
        </p>
        <div className="inline-block px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60">
          Funcionalidad en desarrollo
        </div>
      </div>
    </div>
  )
}
