import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquare, Calendar, Globe, User } from 'lucide-react'

export const metadata = {
  title: 'Feedback Beta | Admin Nodo360'
}

export default async function AdminFeedbackPage() {
  const supabase = await createClient()

  // Verificar admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Obtener feedback
  const { data: feedbacks } = await supabase
    .from('beta_feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <MessageSquare className="w-7 h-7 text-[#f7931a]" />
        Feedback de Beta
      </h1>

      {feedbacks && feedbacks.length > 0 ? (
        <div className="space-y-4">
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
              <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {fb.user_email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  {fb.page_url || 'N/A'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(fb.created_at).toLocaleString('es-ES')}
                </span>
              </div>
              <p className="text-white">{fb.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay feedback todavia</p>
        </div>
      )}
    </div>
  )
}
