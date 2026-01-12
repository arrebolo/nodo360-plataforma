'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { BadgeToast, BadgeData } from './BadgeToast'

interface BadgeContextType {
  showBadge: (badge: BadgeData) => void
  showBadges: (badges: BadgeData[]) => void
}

const BadgeContext = createContext<BadgeContextType | null>(null)

export function useBadgeToast() {
  const context = useContext(BadgeContext)
  if (!context) {
    // Return no-op functions if used outside provider (for SSR safety)
    return {
      showBadge: () => {},
      showBadges: () => {},
    }
  }
  return context
}

interface BadgeProviderProps {
  children: ReactNode
}

export function BadgeProvider({ children }: BadgeProviderProps) {
  const [badgeQueue, setBadgeQueue] = useState<BadgeData[]>([])
  const [currentBadge, setCurrentBadge] = useState<BadgeData | null>(null)

  const processQueue = useCallback(() => {
    setBadgeQueue((queue) => {
      if (queue.length > 0) {
        const [next, ...rest] = queue
        // Use setTimeout to avoid state update during render
        setTimeout(() => setCurrentBadge(next), 0)
        return rest
      }
      return queue
    })
  }, [])

  const showBadge = useCallback(
    (badge: BadgeData) => {
      if (!currentBadge) {
        setCurrentBadge(badge)
      } else {
        setBadgeQueue((prev) => [...prev, badge])
      }
    },
    [currentBadge]
  )

  const showBadges = useCallback(
    (badges: BadgeData[]) => {
      if (!badges || badges.length === 0) return

      const [first, ...rest] = badges
      if (!currentBadge) {
        setCurrentBadge(first)
        if (rest.length > 0) {
          setBadgeQueue((prev) => [...prev, ...rest])
        }
      } else {
        setBadgeQueue((prev) => [...prev, ...badges])
      }
    },
    [currentBadge]
  )

  const handleClose = useCallback(() => {
    setCurrentBadge(null)
    // Procesar siguiente en la cola después de un pequeño delay
    setTimeout(() => {
      processQueue()
    }, 400)
  }, [processQueue])

  return (
    <BadgeContext.Provider value={{ showBadge, showBadges }}>
      {children}
      {currentBadge && (
        <BadgeToast
          badge={currentBadge}
          onClose={handleClose}
          autoClose={true}
          autoCloseDelay={6000}
        />
      )}
    </BadgeContext.Provider>
  )
}
