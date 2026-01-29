import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MessageSquare } from 'lucide-react'
import ConversationList from '@/components/messages/ConversationList'

export const metadata = {
  title: 'Mensajes | Nodo360',
  description: 'Tus conversaciones con instructores y estudiantes',
}

export default async function MensajesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-brand-light/10">
          <MessageSquare className="w-6 h-6 text-brand-light" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Mensajes</h1>
          <p className="text-sm text-white/60">Tus conversaciones</p>
        </div>
      </div>

      {/* Conversation List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <ConversationList currentUserId={user.id} />
      </div>
    </div>
  )
}
