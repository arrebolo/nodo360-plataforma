import { requireAdmin } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Edit, Eye, EyeOff } from 'lucide-react'

async function getBadges() {
  const supabase = await createClient()

  const { data: badges } = await supabase
    .from('badges')
    .select('*')
    .order('order_index', { ascending: true })

  // Contar usuarios por badge
  const { data: userBadges } = await supabase.from('user_badges').select('badge_id')

  const badgeCounts: Record<string, number> = {}
  userBadges?.forEach((ub) => {
    badgeCounts[ub.badge_id] = (badgeCounts[ub.badge_id] || 0) + 1
  })

  return (
    badges?.map((b) => ({
      ...b,
      userCount: badgeCounts[b.id] || 0
    })) || []
  )
}

export default async function HitosPage() {
  await requireAdmin()

  const badges = await getBadges()

  const rarityColors = {
    common: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    legendary: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Hitos</h1>
          <p className="text-gray-400 mt-1">
            {badges.length} hitos creados - {badges.filter((b) => b.is_active).length} activos
          </p>
        </div>
        <Link
          href="/admin/gamificacion/hitos/nuevo"
          className="flex items-center gap-2 px-4 py-2 bg-[#ff6b35] hover:bg-[#ff8c5a] rounded-lg transition-colors text-white font-medium"
        >
          <Plus size={20} />
          Nuevo Hito
        </Link>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(rarityColors).map(([rarity, colorClasses]) => {
          const count = badges.filter((b) => b.rarity === rarity).length
          return (
            <div key={rarity} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className={`inline-block px-3 py-1 rounded-full text-xs border ${colorClasses} mb-2`}>
                {rarity}
              </div>
              <p className="text-2xl font-bold text-white">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Tabla de hitos */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                  Icono
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                  Título
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                  Categoría
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                  Rareza
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                  Requisito
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                  Usuarios
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {badges.length > 0 ? (
                badges.map((badge) => (
                  <tr key={badge.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <span className="text-3xl">{badge.icon || '🏆'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{badge.title}</p>
                      <p className="text-xs text-gray-400">{badge.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400 capitalize">
                        {badge.category || 'Sin categoría'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs border ${
                          rarityColors[badge.rarity as keyof typeof rarityColors]
                        }`}
                      >
                        {badge.rarity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {badge.requirement_type ? (
                        <>
                          {badge.requirement_type}: {badge.requirement_value}
                        </>
                      ) : (
                        <span className="text-gray-500">Sin requisito</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-blue-400 font-medium">
                        {badge.userCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {badge.is_active ? (
                          <>
                            <Eye size={16} className="text-emerald-400" />
                            <span className="text-xs text-emerald-400">Activo</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={16} className="text-gray-500" />
                            <span className="text-xs text-gray-500">Inactivo</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/gamificacion/hitos/${badge.id}`}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="Editar hito"
                        >
                          <Edit size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-gray-400 mb-4">No hay hitos creados</p>
                    <Link
                      href="/admin/gamificacion/hitos/nuevo"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6b35] hover:bg-[#ff8c5a] rounded-lg transition-colors text-white font-medium"
                    >
                      <Plus size={20} />
                      Crear primer hito
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota informativa */}
      {badges.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-sm text-blue-400">
            💡 <strong>Tip:</strong> Los hitos se otorgan automáticamente cuando los usuarios
            cumplen los requisitos. Puedes desactivar un hito temporalmente sin eliminarlo.
          </p>
        </div>
      )}
    </div>
  )
}
