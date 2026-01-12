import { requireAdmin } from '@/lib/admin/auth'
import { BarChart3 } from 'lucide-react'

export const metadata = {
  title: 'Reportes | Admin Nodo360',
}

export default async function ReportesPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto text-center py-20">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 border border-success/30 mb-8">
          <BarChart3 className="w-12 h-12 text-success" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Reportes y Estadísticas
        </h1>
        <p className="text-xl text-white/70 mb-8">
          Próximamente: Análisis de progreso, métricas de usuarios y reportes detallados
        </p>
        <div className="inline-block px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60">
          Funcionalidad en desarrollo
        </div>
      </div>
    </div>
  )
}

