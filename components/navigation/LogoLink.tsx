'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getStartRoute } from '@/lib/navigation/startRoute'

interface LogoLinkProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function LogoLink({ children, className = '', onClick }: LogoLinkProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const targetRoute = await getStartRoute()
      router.push(targetRoute)
      onClick?.()
    } catch (error) {
      console.error('Error navegando:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center ${className}`}
      aria-label="Ir a inicio"
    >
      {loading ? (
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      ) : (
        children
      )}
    </button>
  )
}


