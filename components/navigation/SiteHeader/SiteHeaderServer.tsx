import SiteHeaderClient from './SiteHeaderClient'
import { createClient } from '@/lib/supabase/server'

export default async function SiteHeaderServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <SiteHeaderClient isAuthed={false} />
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <SiteHeaderClient
      isAuthed
      userName={profile?.full_name ?? user.email?.split('@')[0] ?? 'Cuenta'}
      userEmail={user.email ?? ''}
      role={(profile?.role ?? 'student') as 'student' | 'instructor' | 'mentor' | 'admin'}
      avatarUrl={profile?.avatar_url}
    />
  )
}
