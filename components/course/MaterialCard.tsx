'use client'

import { FileText, Download, Link as LinkIcon, Video, File } from 'lucide-react'

type MaterialType = 'pdf' | 'doc' | 'link' | 'video' | 'file'

interface MaterialCardProps {
  title: string
  description: string
  type: MaterialType
  url: string
  size?: string
  downloadable?: boolean
}

const iconMap = {
  pdf: FileText,
  doc: FileText,
  link: LinkIcon,
  video: Video,
  file: File
}

const typeLabels = {
  pdf: 'PDF',
  doc: 'Documento',
  link: 'Enlace',
  video: 'Video',
  file: 'Archivo'
}

export function MaterialCard({
  title,
  description,
  type,
  url,
  size,
  downloadable = false
}: MaterialCardProps) {
  const Icon = iconMap[type] || File
  const isExternal = type === 'link' || url.startsWith('http')

  const handleClick = () => {
    if (isExternal) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = url
    }
  }

  return (
    <button
      onClick={handleClick}
      className="
        group
        w-full
        bg-nodo-card
        border border-nodo-icon
        rounded-xl
        p-8
        text-left
        transition-all duration-300
        hover:scale-105
        hover:shadow-2xl
        hover:shadow-bitcoin-orange/20
        hover:border-bitcoin-orange/50
      "
    >
      <div className="flex items-start gap-4">
        {/* Icon container with gradient */}
        <div className="
          w-14 h-14
          bg-gradient-to-br from-bitcoin-orange to-bitcoin-gold
          rounded-xl
          flex items-center justify-center
          flex-shrink-0
          transition-transform duration-300
          group-hover:scale-110
        ">
          <Icon className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title and Type Badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-xl font-semibold text-white group-hover:text-bitcoin-orange transition-colors">
              {title}
            </h3>
            <span className="px-2 py-1 bg-nodo-bg text-slate-400 text-xs font-medium rounded flex-shrink-0">
              {typeLabels[type]}
            </span>
          </div>

          {/* Description */}
          <p className="text-base text-slate-400 leading-relaxed mb-3">
            {description}
          </p>

          {/* Footer - Size and Download indicator */}
          <div className="flex items-center gap-3 text-sm text-slate-500">
            {size && (
              <div className="flex items-center gap-1">
                <File className="w-4 h-4" />
                <span>{size}</span>
              </div>
            )}
            {downloadable && (
              <div className="flex items-center gap-1 text-bitcoin-orange">
                <Download className="w-4 h-4" />
                <span>Descargar</span>
              </div>
            )}
            {isExternal && (
              <div className="flex items-center gap-1">
                <LinkIcon className="w-4 h-4" />
                <span>Abrir en nueva pestaña</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
