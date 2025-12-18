// hooks/useUserRole.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type UserRole = 'student' | 'mentor' | 'instructor' | 'admin' | 'user'

interface UseUserRoleResult {
  role: UserRole | null
  isAdmin: boolean
  isMentor: boolean
  isInstructor: boolean
  isLoading: boolean
}

export function useUserRole(): UseUserRoleResult {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRole = async () => {
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setRole(null)
          return
        }

        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        const dbRole = ((data as { role?: string } | null)?.role as UserRole) ?? 'student'
        setRole(dbRole)
      } catch (err) {
        console.error('[useUserRole] Error inesperado:', err)
        setRole(null)
      } finally {
        setLoading(false)
      }
    }

    loadRole()
  }, [])

  return {
    role,
    isAdmin: role === 'admin',
    isInstructor: role === 'instructor',
    isMentor: role === 'mentor',
    isLoading: loading,
  }
}
