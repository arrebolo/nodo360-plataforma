import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Glosario Crypto: +50 Términos de Bitcoin, Blockchain y Web3 | Nodo360',
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
    description: 'Más de 50 términos de Bitcoin, Blockchain, DeFi y Web3 explicados en español.',
    type: 'website',
    url: 'https://nodo360.com/glosario',
    images: [{ url: '/imagenes/og-glosario.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Glosario Crypto Completo | Nodo360',
    description: 'Más de 50 términos de Bitcoin, Blockchain, DeFi y Web3 explicados en español.',
  },
  alternates: {
    canonical: 'https://nodo360.com/glosario',
  },
}

export default function GlosarioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
