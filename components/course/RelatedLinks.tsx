import Link from 'next/link'
import { ExternalLink, FileText } from 'lucide-react'
import type { RelatedLinksProps } from '@/types/course-system'

export function RelatedLinks({ items }: RelatedLinksProps) {
  if (items.length === 0) return null

  return (
    <div className="bg-nodo-card border border-nodo-icon rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">📚 Enlaces de Interés</h3>
      <div className="space-y-3">
        {items.map((item, index) => {
          const isExternal = item.type === 'externo'
          const Icon = isExternal ? ExternalLink : FileText

          const linkContent = (
            <>
              <div className="flex items-start gap-3 flex-1">
                <Icon
                  className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    isExternal ? 'text-blue-400' : 'text-[#F7931A]'
                  }`}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white mb-1">{item.title}</div>
                  <div className="text-sm text-gray-500">{item.source}</div>
                </div>
              </div>
            </>
          )

          if (isExternal) {
            return (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-nodo-icon hover:border-[#F7931A]/30 hover:bg-nodo-bg transition-all group"
              >
                {linkContent}
              </a>
            )
          }

          return (
            <Link
              key={index}
              href={item.url}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#2a2a2a] hover:border-[#F7931A]/30 hover:bg-[#1a1a1a] transition-all group"
            >
              {linkContent}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
