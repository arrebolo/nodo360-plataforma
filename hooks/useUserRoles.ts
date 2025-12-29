'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserRole, getHighestRole } from '@/types/roles'

// Mapeo de roles de la base de datos a roles del sistema
const DB_ROLE_MAP: Record<string, UserRole> = {
  student: 'user',
  instructor: 'mentor',
  admin: 'admin',
  mentor: 'mentor',
  council: 'council',
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

        // Obtener rol desde la tabla users
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (fetchError) throw fetchError

        if (data?.role) {
          const mappedRole = DB_ROLE_MAP[data.role] || 'user'
          setRoles([mappedRole])
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
