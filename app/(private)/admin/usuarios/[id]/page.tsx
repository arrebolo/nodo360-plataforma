import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Componentes reales (verificados)
import ChangeRoleForm from './ChangeRoleForm'
import AdjustXPForm from './AdjustXPForm'
import UserXPHistory from '@/components/admin/UserXPHistory'
import { ResetCourseSection } from '@/components/admin/ResetCourseSection'
import { UserManagementActions } from '@/components/admin/UserManagementActions'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  // 🔑 FIX CLAVE NEXT.JS 16.1
  const { id: userId } = await params
  if (!userId) notFound()

  const supabase = await createClient()

  /* ======================================================
     AUTH + ROL ADMIN
  ====================================================== */
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData?.user) {
    redirect('/login?redirect=/admin/usuarios')
  }

  const { data: me, error: meError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', authData.user.id)
    .single()

  if (meError || me?.role !== 'admin') {
    redirect('/dashboard')
  }

  /* ======================================================
     USUARIO OBJETIVO
  ====================================================== */
  const { data: targetUser, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at, is_suspended, suspended_reason, suspended_at')
    .eq('id', userId)
    .single()

  if (userError || !targetUser) {
    notFound()
  }

  /* ======================================================
     STATS GAMIFICACIÓN (XP REAL)
  ====================================================== */
  const { data: stats } = await supabase
    .from('user_gamification_stats')
    .select(
      'total_xp, current_level, xp_to_next_level, current_streak, longest_streak'
    )
    .eq('user_id', userId)
    .maybeSingle()

  const currentXP = stats?.total_xp ?? 0

  return (
    <div className="space-y-6">
      {/* =========================================
          HEADER USUARIO
      ========================================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-white">Usuario</h1>
            <div className="text-sm text-white/80 space-y-0.5">
              <div>
                <span className="text-white/60">ID:</span>{' '}
                <span className="text-white">{targetUser.id}</span>
              </div>
              <div>
                <span className="text-white/60">Email:</span>{' '}
                <span className="text-white">{targetUser.email || '—'}</span>
              </div>
              <div>
                <span className="text-white/60">Nombre:</span>{' '}
                <span className="text-white">{targetUser.full_name || '—'}</span>
              </div>
              <div>
                <span className="text-white/60">Rol:</span>{' '}
                <span className="text-white">{targetUser.role}</span>
              </div>
              <div>
                <span className="text-white/60">Estado:</span>{' '}
                {targetUser.is_suspended ? (
                  <span className="text-yellow-400 font-medium">Suspendido</span>
                ) : (
                  <span className="text-green-400">Activo</span>
                )}
              </div>
            </div>
            {targetUser.is_suspended && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  <strong>Cuenta suspendida</strong>
                  {targetUser.suspended_reason && (
                    <span className="block text-yellow-400/80 mt-1">
                      Motivo: {targetUser.suspended_reason}
                    </span>
                  )}
                  {targetUser.suspended_at && (
                    <span className="block text-yellow-400/60 text-xs mt-1">
                      Desde: {new Date(targetUser.suspended_at).toLocaleDateString('es-ES')}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Stats rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="XP total" value={currentXP} />
            <Stat label="Nivel" value={stats?.current_level ?? 1} />
            <Stat label="XP a next" value={stats?.xp_to_next_level ?? 0} />
            <Stat label="Racha" value={stats?.current_streak ?? 0} />
            <Stat label="Mejor racha" value={stats?.longest_streak ?? 0} />
          </div>
        </div>
      </div>

      {/* =========================================
          ACCIONES ADMIN
      ========================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Cambiar rol</h2>
          <ChangeRoleForm
            userId={targetUser.id}
            currentRole={targetUser.role}
          />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Ajustar XP</h2>
          <AdjustXPForm
            userId={targetUser.id}
            currentXP={currentXP}
          />
        </div>
      </div>

      {/* =========================================
          GESTIÓN DE CUENTA
      ========================================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Gestión de cuenta</h2>
        <p className="text-sm text-gray-400 mb-4">
          Suspende temporalmente o elimina permanentemente la cuenta del usuario.
        </p>
        <UserManagementActions user={targetUser} />
      </div>

      {/* =========================================
          REINICIAR CURSO
      ========================================= */}
      <ResetCourseSection userId={targetUser.id} />

      {/* =========================================
          AUDITORÍA VISUAL XP
      ========================================= */}
      <UserXPHistory userId={targetUser.id} />
    </div>
  )
}

/* ======================================================
   COMPONENTE STAT
====================================================== */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-black/30 border border-white/10 rounded-xl px-4 py-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-white font-semibold">{value}</div>
    </div>
  )
}
