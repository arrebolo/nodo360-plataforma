import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ADMIN_EMAILS = ['admin@nodo360.com', 'alberto@nodo360.com']

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/admin')
  }

  const userRole = user.user_metadata?.role || 'user'
  const isAdmin = userRole === 'admin' || ADMIN_EMAILS.includes(user.email || '')

  if (!isAdmin) {
    redirect('/dashboard')
  }

  return { user, supabase }
}

export async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const userRole = user.user_metadata?.role || 'user'
  const isAdmin = userRole === 'admin' || ADMIN_EMAILS.includes(user.email || '')

  return isAdmin ? user : null
}
