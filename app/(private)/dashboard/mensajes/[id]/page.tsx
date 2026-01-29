import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import ChatView from '@/components/messages/ChatView'

export const metadata = {
  title: 'Conversación | Nodo360',
  description: 'Chat con instructor o estudiante',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ConversacionPage({ params }: PageProps) {
  const { id: conversationId } = await params
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Verificar que la conversación existe y el usuario tiene acceso
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, participant_1, participant_2')
    .eq('id', conversationId)
    .single()

  if (!conversation) {
    redirect('/dashboard/mensajes')
  }

  if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
    redirect('/dashboard/mensajes')
  }

  // Obtener info del otro participante
  const otherUserId = conversation.participant_1 === user.id
    ? conversation.participant_2
    : conversation.participant_1

  const { data: otherUser } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', otherUserId)
    .single()

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard/mensajes"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mensajes
        </Link>

        {/* Header */}
        <PageHeader
          icon={MessageCircle}
          title={otherUser?.full_name || 'Conversación'}
          subtitle="Chat directo"
        />

        {/* Chat */}
        <div className="bg-dark-surface border border-white/10 rounded-2xl overflow-hidden h-[calc(100vh-280px)] min-h-[500px]">
          <ChatView
            conversationId={conversationId}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  )
}
