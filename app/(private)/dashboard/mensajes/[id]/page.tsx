import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatView from '@/components/messages/ChatView'

export const metadata = {
  title: 'Chat | Nodo360',
  description: 'Conversación',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: PageProps) {
  const { id: conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify the conversation exists and user has access
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

  return (
    <div className="h-[calc(100vh-120px)] max-w-3xl mx-auto">
      <div className="h-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <ChatView
          conversationId={conversationId}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
