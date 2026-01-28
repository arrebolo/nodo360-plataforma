import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireInstructorLike } from '@/lib/auth/requireInstructor'
import {
  Link2,
  PlusCircle,
  MousePointer,
  Users,
  TrendingUp,
  Coins,
  ArrowLeft,
  BarChart3,
} from 'lucide-react'
import ReferralLinksClient from './ReferralLinksClient'

export const metadata = {
  title: 'Enlaces de Referido | Instructor Nodo360',
  description: 'Gestiona tus enlaces promocionales y mide conversiones',
}

export default async function InstructorReferidosPage() {
  const { userId } = await requireInstructorLike()
  const supabase = await createClient()

  // Obtener estadísticas agregadas
  const { data: stats } = await supabase
    .from('instructor_referral_stats')
    .select('*')
    .eq('instructor_id', userId)
    .maybeSingle()

  // Obtener enlaces con performance
  const { data: links } = await supabase
    .from('referral_link_performance')
    .select('*')
    .eq('instructor_id', userId)
    .order('created_at', { ascending: false })

  const defaultStats = {
    total_links: 0,
    active_links: 0,
    total_clicks: 0,
    clicks_last_7_days: 0,
    clicks_last_30_days: 0,
    total_conversions: 0,
    total_enrollments: 0,
    conversions_last_30_days: 0,
    total_revenue_cents: 0,
    total_commission_cents: 0,
    conversion_rate_percent: 0,
  }

  const s = stats || defaultStats

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('es-ES', {
      style: 'currency',
      currency: 'EUR',
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/instructor"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Link2 className="w-7 h-7 text-[#f7931a]" />
            Enlaces de Referido
          </h1>
          <p className="text-white/60 mt-1">
            Crea enlaces promocionales para tus cursos y mide conversiones
          </p>
        </div>

        <Link
          href="/dashboard/instructor/referidos/nuevo"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="w-4 h-4" />
          Crear enlace
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <Link2 className="w-4 h-4" />
            <span className="text-xs">Enlaces</span>
          </div>
          <div className="text-2xl font-bold text-white">{s.total_links}</div>
          <div className="text-xs text-white/40">{s.active_links} activos</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <MousePointer className="w-4 h-4" />
            <span className="text-xs">Clics</span>
          </div>
          <div className="text-2xl font-bold text-white">{s.total_clicks}</div>
          <div className="text-xs text-white/40">+{s.clicks_last_7_days} últimos 7d</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs">Conversiones</span>
          </div>
          <div className="text-2xl font-bold text-white">{s.total_conversions}</div>
          <div className="text-xs text-white/40">{s.total_enrollments} inscripciones</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Tasa Conv.</span>
          </div>
          <div className="text-2xl font-bold text-white">{s.conversion_rate_percent}%</div>
          <div className="text-xs text-white/40">clics → inscripciones</div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400/80 mb-2">
            <Coins className="w-4 h-4" />
            <span className="text-xs">Comisión</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {formatCurrency(s.total_commission_cents)}
          </div>
          <div className="text-xs text-green-400/60">total ganado</div>
        </div>
      </div>

      {/* Cómo funciona */}
      <div className="bg-gradient-to-r from-[#ff6b35]/10 to-[#f7931a]/10 border border-[#f7931a]/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#f7931a]" />
          ¿Cómo funcionan los enlaces de referido?
        </h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f7931a]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#f7931a] font-bold">1</span>
            </div>
            <div>
              <p className="text-white font-medium">Crea un enlace</p>
              <p className="text-white/50">Elige un curso o crea uno general</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f7931a]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#f7931a] font-bold">2</span>
            </div>
            <div>
              <p className="text-white font-medium">Compártelo</p>
              <p className="text-white/50">En redes, email, tu blog...</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f7931a]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#f7931a] font-bold">3</span>
            </div>
            <div>
              <p className="text-white font-medium">Gana comisión</p>
              <p className="text-white/50">30% por cada venta atribuida</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de enlaces */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Tus enlaces ({links?.length || 0})
        </h2>

        {links && links.length > 0 ? (
          <ReferralLinksClient initialLinks={links} />
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <Link2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Aún no tienes enlaces
            </h3>
            <p className="text-sm text-white/60 mb-4">
              Crea tu primer enlace de referido y empieza a compartir tus cursos
            </p>
            <Link
              href="/dashboard/instructor/referidos/nuevo"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="w-4 h-4" />
              Crear mi primer enlace
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
