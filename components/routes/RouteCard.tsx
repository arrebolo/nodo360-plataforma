// components/routes/RouteCard.tsx
import Link from 'next/link'
import Image from 'next/image'

type RouteCardProps = {
  route: {
    id: string
    slug: string
    name: string
    emoji?: string | null
    short_description?: string | null
    course_count?: number
    image_url?: string | null
  }
}

export function RouteCard({ route }: RouteCardProps) {
  return (
    <Link
      href={`/rutas/${route.slug}`}
      className="group relative block w-full overflow-hidden rounded-[20px] border border-[rgba(250,244,237,0.08)] bg-[#1a1918] transition-all duration-300 hover:border-[#8B5CF6]/50 hover:bg-[#1f1d1b] hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)]"
    >
      {/* Gradiente de hover - MORADO */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6]/0 via-[#8B5CF6]/0 to-[#8B5CF6]/0 group-hover:from-[#8B5CF6]/5 group-hover:via-transparent group-hover:to-transparent transition-all duration-500" />

      {/* Linea de acento morado en hover */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8B5CF6]/0 group-hover:bg-[#8B5CF6] transition-all duration-300" />

      <div className="relative flex items-center gap-6 p-6 md:p-7">
        {/* Imagen/Icono crypto */}
        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6]/15 to-[#6366F1]/10 border border-[#8B5CF6]/20 shadow-[0_4px_20px_rgba(139,92,246,0.1)] group-hover:border-[#8B5CF6]/50 group-hover:shadow-[0_4px_25px_rgba(139,92,246,0.25)] transition-all duration-300 overflow-hidden">
          {route.image_url ? (
            <Image
              src={route.image_url}
              alt={route.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <CryptoIcon name={route.name} emoji={route.emoji} />
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[18px] md:text-[20px] font-semibold text-[#FAF4ED] group-hover:text-[#A78BFA] transition-colors duration-300">
            {route.name}
          </h3>

          {route.short_description && (
            <p className="mt-2 text-[14px] text-[#D7D3CE] line-clamp-2 leading-relaxed">
              {route.short_description}
            </p>
          )}

          {/* Meta info - ICONO BLOCKCHAIN */}
          <div className="mt-3 flex items-center gap-4">
            <span className="inline-flex items-center gap-2 text-[13px] text-[#6F665C]">
              <BlockchainIcon />
              {route.course_count ?? 0} curso{(route.course_count ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Flecha con estilo morado */}
        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6] group-hover:bg-[#8B5CF6]/20 group-hover:border-[#8B5CF6]/50 transition-all duration-300">
          <span className="text-[18px] group-hover:translate-x-0.5 transition-transform duration-300">
            →
          </span>
        </div>
      </div>
    </Link>
  )
}

// Componente de icono crypto segun el nombre de la ruta
function CryptoIcon({ name, emoji }: { name: string; emoji?: string | null }) {
  const nameLower = name.toLowerCase()

  // Bitcoin
  if (nameLower.includes('bitcoin') || nameLower.includes('btc')) {
    return (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="14" fill="#F7931A"/>
        <path d="M22.5 14.5c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.8-.2-1.3-.3l.7-2.6-1.6-.4-.7 2.7c-.3-.1-.7-.2-1-.3l-2.2-.5-.4 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 0 .1 0 .2.1-.1 0-.1 0-.2 0l-1.2 4.7c-.1.2-.3.6-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.8 2.1.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.8c2.8.5 4.9.3 5.8-2.2.7-2-.1-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.5zm-3.7 5.2c-.5 2-3.9.9-5 .6l.9-3.6c1.1.3 4.6.8 4.1 3zm.5-5.3c-.5 1.8-3.3.9-4.2.7l.8-3.3c.9.2 3.9.7 3.4 2.6z" fill="white"/>
      </svg>
    )
  }

  // Ethereum / Web3
  if (nameLower.includes('ethereum') || nameLower.includes('eth') || nameLower.includes('web3')) {
    return (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="14" fill="#627EEA"/>
        <path d="M16 6v7.5l6.5 2.9L16 6z" fill="white" fillOpacity="0.6"/>
        <path d="M16 6L9.5 16.4l6.5-2.9V6z" fill="white"/>
        <path d="M16 21.5v4.5l6.5-9-6.5 4.5z" fill="white" fillOpacity="0.6"/>
        <path d="M16 26v-4.5L9.5 17l6.5 9z" fill="white"/>
        <path d="M16 20.3l6.5-3.9-6.5-2.9v6.8z" fill="white" fillOpacity="0.2"/>
        <path d="M9.5 16.4l6.5 3.9v-6.8l-6.5 2.9z" fill="white" fillOpacity="0.6"/>
      </svg>
    )
  }

  // Seguridad
  if (nameLower.includes('seguridad') || nameLower.includes('security')) {
    return (
      <svg viewBox="0 0 32 32" className="w-8 h-8">
        <circle cx="16" cy="16" r="14" fill="#10B981"/>
        <path d="M16 7l-7 3v5c0 5.5 3 10.7 7 12 4-1.3 7-6.5 7-12v-5l-7-3zm-1 15l-3-3 1.4-1.4 1.6 1.6 4.6-4.6 1.4 1.4-6 6z" fill="white"/>
      </svg>
    )
  }

  // Default - Emoji o icono generico
  if (emoji) {
    return <span className="text-[28px]">{emoji}</span>
  }

  return (
    <svg viewBox="0 0 32 32" className="w-8 h-8">
      <circle cx="16" cy="16" r="14" fill="#8B5CF6"/>
      <path d="M16 8a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" fill="white" fillOpacity="0.3"/>
      <circle cx="16" cy="16" r="3" fill="white"/>
    </svg>
  )
}

// Icono de blockchain para el contador
function BlockchainIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#8B5CF6]">
      <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" fillOpacity="0.6"/>
      <rect x="10" y="1" width="5" height="5" rx="1" fill="currentColor" fillOpacity="0.8"/>
      <rect x="1" y="10" width="5" height="5" rx="1" fill="currentColor" fillOpacity="0.8"/>
      <rect x="10" y="10" width="5" height="5" rx="1" fill="currentColor"/>
      <path d="M6 3.5h4M6 12.5h4M3.5 6v4M12.5 6v4" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.4"/>
    </svg>
  )
}
