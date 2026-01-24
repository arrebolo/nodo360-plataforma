import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import {
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  Star,
  BookOpen,
  Shield,
} from 'lucide-react'
import { MentorApplicationForm } from './MentorApplicationForm'

export const metadata = {
  title: 'Aplicar a Mentor | Nodo360',
  description: 'Envía tu solicitud para convertirte en mentor de la comunidad',
}

export default async function AplicarMentorPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Verificar si ya es mentor
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'mentor') {
    redirect('/dashboard/mentor')
  }

  // Verificar elegibilidad
  const { data: eligibility } = await supabase
    .rpc('can_apply_mentor', { p_user_id: user.id })

  const canApply = eligibility?.can_apply === true

  return (
    <div className="min-h-screen bg-dark">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard/mentor"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mentor
        </Link>

        {/* Header */}
        <PageHeader
          icon={Users}
          title="Aplicar a Mentor"
          subtitle="Comparte tu experiencia y ayuda a otros a crecer"
        />

        {/* Requisitos */}
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-brand" />
            </div>
            <h2 className="text-lg font-semibold text-white">Requisitos</h2>
          </div>
          <div className="space-y-3">
            <RequirementItem
              met={eligibility?.has_enough_points}
              label="Mínimo 650 puntos de experiencia"
              icon={<Star className="w-4 h-4" />}
            />
            <RequirementItem
              met={eligibility?.has_completed_courses}
              label="Cursos requeridos completados"
              icon={<BookOpen className="w-4 h-4" />}
            />
            <RequirementItem
              met={eligibility?.no_pending_application}
              label="Sin aplicación pendiente"
              icon={<CheckCircle className="w-4 h-4" />}
            />
            <RequirementItem
              met={eligibility?.cooldown_passed}
              label="Sin período de espera activo"
              icon={<Shield className="w-4 h-4" />}
            />
          </div>
        </Card>

        {/* Formulario o mensaje de no elegible */}
        {canApply ? (
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Formulario de Aplicación</h2>
                <p className="text-sm text-white/50">Completa los campos para enviar tu solicitud</p>
              </div>
            </div>
            <MentorApplicationForm />
          </Card>
        ) : (
          <Card className="text-center py-8">
            <XCircle className="w-12 h-12 mx-auto text-white/30 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">No puedes aplicar aún</h3>
            <p className="text-sm text-white/50 max-w-md mx-auto">
              {eligibility?.reason || 'No cumples todos los requisitos para aplicar a mentor. Sigue aprendiendo y vuelve cuando los completes.'}
            </p>
            {eligibility?.can_reapply_at && (
              <p className="text-xs text-white/40 mt-3">
                Podrás aplicar nuevamente el {new Date(eligibility.can_reapply_at).toLocaleDateString('es-ES')}
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

function RequirementItem({
  met,
  label,
  icon,
}: {
  met?: boolean
  label: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
      <span className={met ? 'text-green-400' : 'text-white/30'}>{icon}</span>
      <span className={`text-sm flex-1 ${met ? 'text-white' : 'text-white/50'}`}>{label}</span>
      {met ? (
        <CheckCircle className="w-4 h-4 text-green-400" />
      ) : (
        <XCircle className="w-4 h-4 text-white/30" />
      )}
    </div>
  )
}
