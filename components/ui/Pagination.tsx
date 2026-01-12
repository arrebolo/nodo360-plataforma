'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}: PaginationProps) {
  if (totalPages <= 1) return null

  // Generar array de paginas a mostrar
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showPages = 5 // Numero de paginas a mostrar

    if (totalPages <= showPages + 2) {
      // Mostrar todas las paginas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Siempre mostrar primera pagina
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      // Paginas alrededor de la actual
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      // Siempre mostrar ultima pagina
      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {/* Boton anterior */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Numeros de pagina */}
      {pages.map((page, index) => (
        page === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-white/40">
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`
              min-w-[36px] h-9 px-3 rounded-lg font-medium transition
              ${currentPage === page
                ? 'bg-brand-light text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
              }
            `}
          >
            {page}
          </button>
        )
      ))}

      {/* Boton siguiente */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

export default Pagination
