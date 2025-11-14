/**
 * OldLessonLayout - Componente de fallback para lecciones legacy
 *
 * Este componente se usa para renderizar lecciones que aún no han sido
 * migradas al nuevo formato JSON (content_json). Muestra el HTML antiguo
 * almacenado en el campo "content" de la base de datos.
 *
 * IMPORTANTE: Este es un componente temporal para mantener backward compatibility.
 * Eventualmente, todas las lecciones deberían migrar al nuevo sistema JSON.
 */

interface OldLessonLayoutProps {
  content: string | null
  title?: string
}

export function OldLessonLayout({ content, title }: OldLessonLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Badge indicando formato legacy */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Formato Legacy
          </span>
        </div>

        {/* Título opcional */}
        {title && (
          <h1 className="text-3xl font-bold text-white mb-6">{title}</h1>
        )}

        {/* Contenido HTML legacy */}
        {content ? (
          <div
            className="prose prose-invert prose-lg max-w-none
                       prose-headings:text-white
                       prose-p:text-gray-300 prose-p:leading-relaxed
                       prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline
                       prose-strong:text-white prose-strong:font-semibold
                       prose-ul:text-gray-300 prose-ol:text-gray-300
                       prose-li:text-gray-300
                       prose-code:text-orange-400 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                       prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700
                       prose-img:rounded-lg prose-img:shadow-xl
                       prose-blockquote:border-l-orange-500 prose-blockquote:text-gray-400"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-16 h-16 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">
              No hay contenido disponible para esta lección
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Esta lección está pendiente de migración al nuevo formato
            </p>
          </div>
        )}

        {/* Nota informativa para administradores */}
        <div className="mt-12 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-400 mb-1">
                Información para administradores
              </p>
              <p className="text-xs text-blue-300/80">
                Esta lección usa el formato legacy (HTML). Para migrarla al nuevo sistema con contenido
                estructurado JSON, consulta la documentación en <code className="bg-blue-500/20 px-1 py-0.5 rounded">docs/MIGRATION-GUIDE.md</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
