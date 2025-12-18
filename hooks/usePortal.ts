'use client'

import { useEffect, useState } from 'react'

export function usePortal(id: string) {
  const [portal, setPortal] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let div = document.getElementById(id)

    if (!div) {
      div = document.createElement('div')
      div.id = id
      document.body.appendChild(div)
    }

    setPortal(div)
  }, [id])

  return portal
}
