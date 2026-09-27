import type { Metadata } from "next";
import { Providers } from "./providers";
import SiteHeaderServer from "@/components/navigation/SiteHeader/SiteHeaderServer";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/JsonLd";
import { GoogleAnalytics, SignUpTracker } from "@/components/analytics";
import "./globals.css";
import { ScrollToTopOnNavigate } from '@/components/navigation/ScrollToTopOnNavigate';
import { OG_IMAGEN_PROVISIONAL, OG_IMAGENES_PROVISIONALES } from "@/lib/seo/og-image";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://nodo360.com"),
  title: {
    default: "Nodo360 - Formación profesional en Bitcoin, Blockchain y Web3",
    template: "%s | Nodo360",
  },
  description:
    "Aprende Bitcoin, Blockchain y Web3 desde cero, en español. Cursos gratuitos organizados en rutas de aprendizaje, con certificado verificable al completarlos.",
  keywords: ["bitcoin", "blockchain", "criptomonedas", "web3", "educación", "cursos", "español", "DeFi", "crypto"],
  authors: [{ name: "Nodo360" }],
  creator: "Nodo360",
  publisher: "Nodo360",
  icons: {
    icon: "/imagenes/logo-nodo360.png",
    apple: "/imagenes/logo-nodo360.png",
    shortcut: "/imagenes/logo-nodo360.png",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nodo360.com",
    siteName: "Nodo360",
    title: "Nodo360 - Aprende Bitcoin y Blockchain",
    description: "Cursos gratuitos de Bitcoin, Blockchain y Web3 en español, con certificado verificable al completarlos",
    images: OG_IMAGENES_PROVISIONALES,
  },
  twitter: {
    card: "summary_large_image",
    site: "@nodo360",
    creator: "@nodo360",
    title: "Nodo360 - Aprende Bitcoin y Blockchain",
    description: "Cursos gratuitos de Bitcoin, Blockchain y Web3 en español, con certificado verificable al completarlos",
    images: [OG_IMAGEN_PROVISIONAL],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // OJO: aqui NO va alternates.canonical.
  //
  // Los metadatos se heredan, asi que una canonica en el layout raiz se la queda
  // toda pagina que no declare la suya. Se comprobo sirviendo el sitio: /cursos,
  // /rutas, /mentoria y /sobre-nosotros emitian
  // <link rel="canonical" href="https://nodo360.com">, es decir, le decian a
  // Google que son copias de la portada y que no hace falta indexarlas.
  //
  // Sin esta linea, cada pagina lleva la suya (ver alternates en cada page.tsx)
  // y las que no declaren ninguna se autocanonizan por su propia URL, que es el
  // comportamiento correcto.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="font-sans">
      <head>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body className="min-h-screen antialiased bg-dark text-white">
        <GoogleAnalytics />
        {/* Emite sign_up al volver de un registro por OAuth o enlace magico.
            Va aqui y no en /dashboard porque el callback redirige a donde
            estuviera el usuario antes de entrar. */}
        <SignUpTracker />
        {/* Skip to main content - accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-orange focus:text-white focus:rounded-lg focus:outline-none"
        >
          Saltar al contenido principal
        </a>
        <ScrollToTopOnNavigate />
        <SiteHeaderServer />
        <main id="main-content" role="main">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}


