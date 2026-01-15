import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvitacionesPanel from '@/components/admin/InvitacionesPanel'

export const metadata: Metadata = {
  title: 'Gestión de Invitaciones | Admin',
  description: 'Administrar códigos de invitación',
}

export default async function InvitacionesPage() {
  const supabase = await createClient()

  // Verificar autenticación y rol admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Obtener invitaciones
  const { data: invites, error } = await supabase
    .from('invites')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Admin Invites] Error:', error)
  }

  return (
    <div className="min-h-screen bg-dark-base p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Códigos de Invitación</h1>
            <p className="text-gray-400 mt-1">Gestiona el acceso a la plataforma</p>
          </div>
        </div>

        <InvitacionesPanel initialInvites={invites || []} />
      </div>
    </div>
  )
}
