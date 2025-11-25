'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserRole, getHighestRole } from '@/types/roles'

interface UserRoleRow {
  role: string
}

interface UseUserRolesReturn {
  roles: UserRole[]
  highestRole: UserRole
  isLoading: boolean
  error: Error | null
  hasRole: (role: UserRole) => boolean
  isAdmin: boolean
  isMentor: boolean
  isCouncil: boolean
}

export function useUserRoles(): UseUserRolesReturn {
  const [roles, setRoles] = useState<UserRole[]>(['user'])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchRoles() {
      try {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setRoles(['user'])
          return
        }

        const { data, error: fetchError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (fetchError) throw fetchError

        const rolesData = data as UserRoleRow[] | null
        if (rolesData && rolesData.length > 0) {
          setRoles(rolesData.map(r => r.role as UserRole))
        } else {
          setRoles(['user'])
        }
      } catch (err) {
        console.error('❌ [useUserRoles] Error:', err)
        setError(err instanceof Error ? err : new Error('Error fetching roles'))
        setRoles(['user'])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoles()
  }, [])

  const highestRole = getHighestRole(roles)

  const hasRole = (role: UserRole) => roles.includes(role)

  return {
    roles,
    highestRole,
    isLoading,
    error,
    hasRole,
    isAdmin: hasRole('admin') || hasRole('council'),
    isMentor: hasRole('mentor'),
    isCouncil: hasRole('council'),
  }
}
