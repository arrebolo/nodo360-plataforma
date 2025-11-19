'use client'

interface Resource {
  id: string
  title: string
  description: string
  type: 'pdf' | 'slides' | 'code' | 'template' | 'worksheet'
  size: string
  url: string
  isPremium?: boolean
}

interface AdvancedResourcesProps {
  resources?: Resource[]
}

const RESOURCE_ICONS = {
  pdf: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  slides: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  code: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  template: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  worksheet: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
}

const RESOURCE_COLORS = {
  pdf: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'text-red-400',
    button: 'bg-red-500/20 hover:bg-red-500/30 text-red-400',
  },
  slides: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
    button: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400',
  },
  code: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: 'text-green-400',
    button: 'bg-green-500/20 hover:bg-green-500/30 text-green-400',
  },
  template: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-400',
    button: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400',
  },
  worksheet: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon: 'text-yellow-400',
    button: 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400',
  },
}

const MOCK_RESOURCES: Resource[] = [
  {
    id: 'res-1',
    title: 'Guía Completa de Seguridad en Wallets',
    description: 'PDF con mejores prácticas, checklist de seguridad y casos de estudio reales.',
    type: 'pdf',
    size: '2.4 MB',
    url: '#',
    isPremium: true,
  },
  {
    id: 'res-2',
    title: 'Presentación: Anatomía de una Wallet',
    description: 'Slides interactivos explicando la arquitectura técnica de las wallets.',
    type: 'slides',
    size: '1.8 MB',
    url: '#',
    isPremium: true,
  },
  {
    id: 'res-3',
    title: 'Código: Generador de Wallets',
    description: 'Repositorio con código de ejemplo para crear tu propia wallet simple.',
    type: 'code',
    size: '450 KB',
    url: '#',
    isPremium: true,
  },
  {
    id: 'res-4',
    title: 'Plantilla de Respaldo de Wallet',
    description: 'Template imprimible para documentar de forma segura tus frases semilla.',
    type: 'template',
    size: '120 KB',
    url: '#',
    isPremium: true,
  },
  {
    id: 'res-5',
    title: 'Ejercicio: Auditoria de Seguridad',
    description: 'Worksheet para evaluar la seguridad de tu configuración actual.',
    type: 'worksheet',
    size: '340 KB',
    url: '#',
    isPremium: true,
  },
]

export function AdvancedResources({ resources = MOCK_RESOURCES }: AdvancedResourcesProps) {
  const handleDownload = (resource: Resource) => {
    // In real implementation, this would trigger actual download
    console.log('Downloading:', resource.title)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="font-semibold text-white">Recursos Premium</h3>
        <span className="ml-auto px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
          {resources.length} archivos
        </span>
      </div>

      {/* Premium Badge */}
      <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-lg p-4 border border-yellow-500/30">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Contenido Exclusivo Premium</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Material adicional disponible solo para miembros premium
            </p>
          </div>
        </div>
      </div>

      {/* Resources List */}
      <div className="space-y-3">
        {resources.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No hay recursos disponibles para esta lección
          </p>
        ) : (
          resources.map((resource) => {
            const colors = RESOURCE_COLORS[resource.type]
            const icon = RESOURCE_ICONS[resource.type]

            return (
              <div
                key={resource.id}
                className={`${colors.bg} rounded-lg p-4 border ${colors.border} hover:border-opacity-50 transition-all group`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 ${colors.icon}`}>{icon}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-white text-sm">{resource.title}</h4>
                      {resource.isPremium && (
                        <span className="flex-shrink-0 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{resource.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="uppercase">{resource.type}</span>
                        <span>•</span>
                        <span>{resource.size}</span>
                      </div>
                      <button
                        onClick={() => handleDownload(resource)}
                        className={`px-3 py-1.5 ${colors.button} rounded-lg text-xs font-medium transition-colors flex items-center gap-1`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Descargar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Download All Button */}
      {resources.length > 0 && (
        <button className="w-full mt-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-semibold rounded-lg transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar Todos los Recursos
        </button>
      )}
    </div>
  )
}
