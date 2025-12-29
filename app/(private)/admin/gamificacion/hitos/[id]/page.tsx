import { requireAdmin } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EditBadgeForm from './EditBadgeForm'

async function getBadge(id: string) {
  const supabase = await createClient()

  const { data: badge } = await supabase
    .from('badges')
    .select('*')
    .eq('id', id)
    .single()

  if (!badge) return null

  // Contar usuarios que tienen este badge
  const { count: userCount } = await supabase
    .from('user_badges')
    .select('*', { count: 'exact', head: true })
    .eq('badge_id', id)

  return {
    ...badge,
    userCount: userCount || 0
  }
}

export default async function EditBadgePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()

  const { id } = await params
  const badge = await getBadge(id)

  if (!badge) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/gamificacion/hitos"
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Editar Hito</h1>
            <p className="text-gray-400 mt-1">
              {badge.userCount} usuarios han desbloqueado este hito
            </p>
          </div>
        </div>
      </div>

      {/* Badge Info Card */}
      <div className="bg-gradient-to-br from-[#ff6b35]/10 to-[#f7931a]/10 border border-[#ff6b35]/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{badge.icon}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{badge.title}</h2>
            <p className="text-gray-300 mt-2">{badge.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span className="text-gray-400">
                Creado: {new Date(badge.created_at).toLocaleDateString()}
              </span>
              {badge.updated_at && (
                <span className="text-gray-400">
                  Actualizado: {new Date(badge.updated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <EditBadgeForm badge={badge} />
    </div>
  )
}
