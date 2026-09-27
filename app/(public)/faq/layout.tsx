import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes sobre Bitcoin, Blockchain y Crypto',
  description: 'Resolvemos tus dudas sobre Bitcoin, criptomonedas, blockchain y Web3. Aprende con respuestas claras y sencillas. FAQ completa en español.',
  keywords: [
    'preguntas frecuentes bitcoin',
    'faq crypto',
    'dudas blockchain',
    'preguntas criptomonedas',
    'que es bitcoin',
    'como comprar bitcoin',
    'que es blockchain',
    'que es defi',
    'wallet criptomonedas',
    'faq web3',
  ],
  openGraph: {
    title: 'Preguntas Frecuentes sobre Bitcoin y Crypto | Nodo360',
    description: 'Resolvemos tus dudas sobre Bitcoin, criptomonedas, blockchain y Web3. Respuestas claras y sencillas.',
    type: 'website',
    url: 'https://nodo360.com/faq',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ Bitcoin y Crypto | Nodo360',
    description: 'Resolvemos tus dudas sobre Bitcoin, criptomonedas y blockchain.',
  },
  alternates: {
    canonical: '/faq',
  },
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
