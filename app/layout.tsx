import type { Metadata } from "next";
import { Providers } from "./providers";
import SiteHeaderServer from "@/components/navigation/SiteHeader/SiteHeaderServer";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/JsonLd";
import { GoogleAnalytics } from "@/components/analytics";
import "./globals.css";
import { ScrollToTopOnNavigate } from '@/components/navigation/ScrollToTopOnNavigate';

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
    images: [{ url: "/imagenes/og-nodo360.png", width: 1200, height: 630, alt: "Nodo360" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@nodo360",
    creator: "@nodo360",
    title: "Nodo360 - Aprende Bitcoin y Blockchain",
    description: "Cursos gratuitos de Bitcoin, Blockchain y Web3 en español, con certificado verificable al completarlos",
    images: ["/imagenes/og-nodo360.png"],
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
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nodo360.com",
  },
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


