import type { Metadata } from 'next'
import { glossaryTerms } from '@/lib/glossary-data'

// El numero sale del propio glosario. Escrito a mano ponia "+50" con 72
// terminos publicados: un titulo que se queda corto cada vez que se anade uno.
const TOTAL_TERMINOS = glossaryTerms.length

export const metadata: Metadata = {
  // Con title de cadena suelta, los hijos de este segmento se quedaban sin la
  // plantilla del layout raiz: los terminos salian como "¿Qué es X?…" a secas,
  // sin "| Nodo360". Con plantilla propia, cada termino la lleva una vez.
  title: {
    default: `Glosario Crypto: ${TOTAL_TERMINOS} Términos de Bitcoin, Blockchain y Web3`,
    template: '%s | Nodo360',
  },
  description: 'Diccionario completo de criptomonedas en español. Definiciones claras de Bitcoin, Blockchain, DeFi, NFT, Web3, minería, wallets y más. Tu guía definitiva.',
  keywords: [
    'glosario crypto',
    'diccionario bitcoin',
    'términos blockchain',
    'qué es bitcoin',
    'qué es blockchain',
    'qué es defi',
    'qué es nft',
    'criptomonedas explicadas',
    'glosario criptomonedas español',
  ],
  openGraph: {
    title: 'Glosario Crypto Completo | Nodo360',
    description: `${TOTAL_TERMINOS} términos de Bitcoin, Blockchain, DeFi y Web3 explicados en español.`,
    type: 'website',
    url: 'https://nodo360.com/glosario',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Glosario Crypto Completo | Nodo360',
    description: `${TOTAL_TERMINOS} términos de Bitcoin, Blockchain, DeFi y Web3 explicados en español.`,
  },
  alternates: {
    canonical: '/glosario',
  },
}

export default function GlosarioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
