'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Breadcrumbs({ customItems = null }) {
  const pathname = usePathname()

  // Si se pasan items personalizados, usar esos
  if (customItems && customItems.length > 0) {
    return (
      <nav aria-label="Breadcrumb" className="py-4 px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center space-x-2 text-sm">
          {customItems.map((item, index) => {
            const isLast = index === customItems.length - 1
            
            return (
              <li key={item.href || index} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="w-4 h-4 mx-2 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                
                {isLast ? (
                  <span className="text-gray-400 font-medium">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-gray-300 hover:text-red-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }

  // Generar breadcrumbs automáticamente desde la URL
  const pathSegments = pathname.split('/').filter(segment => segment)
  
  // Si estamos en la home, no mostrar breadcrumbs
  if (pathSegments.length === 0) {
    return null
  }

  // Crear items de breadcrumb desde los segmentos de URL
  const breadcrumbItems = [
    { label: 'Inicio', href: '/' }
  ]

  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    
    // Convertir el segment a un label legible
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    breadcrumbItems.push({
      label,
      href: currentPath
    })
  })

  return (
    <nav aria-label="Breadcrumb" className="py-4 px-4 sm:px-6 lg:px-8 bg-nodo-dark border-b border-nodo-border">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center space-x-2 text-sm" itemScope itemType="https://schema.org/BreadcrumbList">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1
            
            return (
              <li 
                key={item.href} 
                className="flex items-center"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                {index > 0 && (
                  <svg
                    className="w-4 h-4 mx-2 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                
                {isLast ? (
                  <span 
                    className="text-gray-400 font-medium"
                    itemProp="name"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-gray-300 hover:text-red-600 transition-colors"
                    itemProp="item"
                  >
                    <span itemProp="name">{item.label}</span>
                  </Link>
                )}
                
                <meta itemProp="position" content={String(index + 1)} />
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
