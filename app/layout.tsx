import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import "./globals.css"

const font = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Nodo360 - Formación profesional en Bitcoin, Blockchain y Web3",
    template: "%s | Nodo360"
  },
  description:
    "Aprende Bitcoin, Blockchain, DeFi y desarrollo Web3 desde cero. Más de 5,000 estudiantes y 25+ cursos profesionales.",
  icons: {
    icon: "/imagenes/logo-nodo360.png",
    apple: "/imagenes/logo-nodo360.png",
    shortcut: "/imagenes/logo-nodo360.png",
  },
  openGraph: {
    title: "Nodo360 - Aprende Bitcoin y Blockchain",
    description: "La plataforma educativa más completa en español para aprender Bitcoin, Blockchain y Web3",
    url: "https://nodo360.com",
    siteName: "Nodo360",
    images: [
      {
        url: "/imagenes/og-nodo360.png",
        width: 1200,
        height: 630,
        alt: "Nodo360 - Aprende Bitcoin y Blockchain",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nodo360 - Aprende Bitcoin y Blockchain",
    description: "La plataforma educativa más completa en español para aprender Bitcoin, Blockchain y Web3",
    images: ["/imagenes/og-nodo360.png"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={font.className}>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
