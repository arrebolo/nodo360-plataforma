import { requireAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowLeft, Shield } from 'lucide-react'
import Link from 'next/link'
import ModerationPanel from '@/components/admin/ModerationPanel'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Moderación - Admin Panel | Nodo360',
  description: 'Panel de moderación de mensajes y reportes',
}

const PAGE_SIZE = 20

export default async function ModerationPage() {
  await requireAdmin('/admin/moderacion')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAdmin = createAdminClient() as any

  // Fetch flags pendientes (sin revisar, primera página)
  const { data: flags, count: flagsCount } = await supabaseAdmin
    .from('message_flags')
    .select('*, creator:users!created_by(id, full_name, avatar_url)', { count: 'exact' })
    .is('reviewed_at', null)
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  // Fetch reportes abiertos (open + triaged, primera página)
  const { data: reports, count: reportsCount } = await supabaseAdmin
    .from('message_reports')
    .select(
      `*,
      reporter:users!message_reports_reporter_user_id_fkey(full_name, avatar_url),
      reported_user:users!message_reports_reported_user_id_fkey(full_name, avatar_url)`,
      { count: 'exact' }
    )
    .in('status', ['open', 'triaged'])
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  // Stats
  const { count: unreviewedFlags } = await supabaseAdmin
    .from('message_flags')
    .select('*', { count: 'exact', head: true })
    .is('reviewed_at', null)

  const { count: highSeverityFlags } = await supabaseAdmin
    .from('message_flags')
    .select('*', { count: 'exact', head: true })
    .gte('severity', 4)

  const { count: openReports } = await supabaseAdmin
    .from('message_reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')

  const totalFlags = flagsCount || 0
  const totalReports = reportsCount || 0

  return (
    <div className="min-h-screen bg-dark-deep">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Admin
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/20 rounded-lg">
              <Shield className="w-6 h-6 text-brand-light" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Moderación</h1>
              <p className="text-white/60 mt-1">
                Gestión de flags automáticos y reportes de usuarios
              </p>
            </div>
          </div>
        </div>

        {/* Panel */}
        <ModerationPanel
          initialFlags={flags || []}
          initialFlagsPagination={{
            page: 1,
            pageSize: PAGE_SIZE,
            total: totalFlags,
            totalPages: Math.ceil(totalFlags / PAGE_SIZE),
          }}
          initialReports={reports || []}
          initialReportsPagination={{
            page: 1,
            pageSize: PAGE_SIZE,
            total: totalReports,
            totalPages: Math.ceil(totalReports / PAGE_SIZE),
          }}
          stats={{
            totalFlags: flagsCount || 0,
            openReports: openReports || 0,
            highSeverityFlags: highSeverityFlags || 0,
          }}
        />
      </div>
    </div>
  )
}
