import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import ConversationList from '@/components/messages/ConversationList'

export const metadata = {
  title: 'Mis Mensajes | Nodo360',
  description: 'Tus conversaciones con instructores y estudiantes',
}

export default async function MisMensajesPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Contar conversaciones del usuario
  const { count: conversationCount } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        {/* Header */}
        <PageHeader
          icon={MessageCircle}
          title="Mis Mensajes"
          subtitle={`${conversationCount || 0} conversacion${conversationCount !== 1 ? 'es' : ''}`}
        />

        {/* Content */}
        <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
          <ConversationList currentUserId={user.id} />
        </div>
      </div>
    </div>
  )
}
