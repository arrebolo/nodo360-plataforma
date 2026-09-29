import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/admin/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export const metadata: Metadata = {
  // Plantilla propia, y no un title de cadena suelta.
  //
  // Una cadena suelta aqui CANCELA la plantilla del layout raiz para todo lo
  // que cuelgue de este segmento: por eso las paginas de admin llevaban la
  // marca escrita a mano, cada una con su formato («Admin Nodo360», «Admin |
  // Nodo360», «Admin Panel | Nodo360»). Con la plantilla, la ponen una sola vez
  // y siempre igual.
  title: {
    default: 'Panel Admin',
    template: '%s | Admin | Nodo360',
  },
  description: 'Panel de administración de Nodo360',
  // Fuera de los buscadores, todo el segmento.
  //
  // El layout raiz declara index: true, y `robots` no se mezcla campo a campo:
  // el segmento mas cercano que lo declara gana entero. Asi que esto tapa las
  // 13 paginas del panel sin tocar ninguna.
  //
  // No sustituye al control de acceso —requireAdmin() sigue delante— pero hoy
  // una URL del panel filtrada en un enlace o en un log podia acabar indexada,
  // y el titulo de la pagina es informacion de dentro.
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
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


