import { FileText, Book, Video, Download, ExternalLink } from 'lucide-react'

interface Resource {
  id: string
  type: 'document' | 'book' | 'video' | 'download' | 'link'
  title: string
  url: string
}

interface LessonResourcesProps {
  resources?: Resource[]
}

const iconMap = {
  document: FileText,
  book: Book,
  video: Video,
  download: Download,
  link: ExternalLink,
}

export function LessonResources({ resources }: LessonResourcesProps) {
  // Placeholder resources si no se proveen
  const defaultResources: Resource[] = [
    {
      id: '1',
      type: 'document',
      title: 'Documentación oficial de Bitcoin',
      url: 'https://bitcoin.org/es/documentacion',
    },
    {
      id: '2',
      type: 'book',
      title: 'Bitcoin: A Peer-to-Peer Electronic Cash System',
      url: 'https://bitcoin.org/bitcoin.pdf',
    },
    {
      id: '3',
      type: 'link',
      title: 'GitHub de Bitcoin Core',
      url: 'https://github.com/bitcoin/bitcoin',
    },
  ]

  const displayResources = resources || defaultResources

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6">
      <h3 className="text-lg font-bold text-white mb-4">📚 Recursos</h3>

      <div className="space-y-3">
        {displayResources.map((resource) => {
          const Icon = iconMap[resource.type]

          return (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 bg-black/30 rounded-lg border border-white/10 hover:border-[#dc2626]/50 hover:bg-white/5 transition-all group"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#dc2626]/20 flex items-center justify-center group-hover:bg-[#dc2626]/30 transition-colors">
                <Icon className="w-4 h-4 text-[#dc2626]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white group-hover:text-[#dc2626] transition-colors line-clamp-2">
                  {resource.title}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-[#dc2626] transition-colors flex-shrink-0" />
            </a>
          )
        })}
      </div>

      {/* Community Banner */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="p-4 bg-gradient-to-r from-[#dc2626]/20 to-transparent rounded-lg border border-[#dc2626]/30">
          <h4 className="text-sm font-medium text-white mb-2">💬 ¿Tienes dudas?</h4>
          <p className="text-xs text-white/60 mb-3">
            Únete a nuestra comunidad y pregunta lo que necesites
          </p>
          <a
            href="/comunidad"
            className="inline-block px-4 py-2 bg-[#dc2626] text-white text-sm font-medium rounded-lg hover:bg-[#b91c1c] transition-colors"
          >
            Ir a la comunidad
          </a>
        </div>
      </div>
    </div>
  )
}
