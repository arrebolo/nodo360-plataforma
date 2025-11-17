import { Inter } from 'next/font/google'
import Header from '@/components/navigation/Header'
import Footer from '@/components/navigation/Footer'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata = {
  title: 'Nodo360 - Formación profesional en Bitcoin, Blockchain y Web3',
  description: 'Aprende Bitcoin, Blockchain, DeFi y desarrollo Web3 desde cero. Más de 5,000 estudiantes y 25+ cursos profesionales.',
  keywords: 'bitcoin, blockchain, web3, defi, criptomonedas, cursos, formación',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.className}>
      <body className="bg-black text-white antialiased">
        <Header />
        <main className="pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
