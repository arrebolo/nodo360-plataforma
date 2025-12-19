import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import "./globals.css"
import Sidebar from "@/components/navigation/Sidebar"

const font = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Nodo360 - Formación profesional en Bitcoin, Blockchain y Web3",
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
      <body className="min-h-screen bg-black text-white antialiased">
        {/* Fondo Web3 sutil */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(247,147,26,0.15),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,200,150,0.10),transparent_55%)]" />
        </div>

        {/* Layout con Sidebar */}
        <div className="flex min-h-screen">
          {/* Sidebar izquierdo */}
          <Sidebar />

          {/* Contenido principal */}
          <main className="flex-1 lg:ml-0">
            <div className="mx-auto w-full max-w-5xl px-5 py-8 lg:py-12">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
