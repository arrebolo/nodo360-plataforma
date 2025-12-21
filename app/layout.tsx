import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
// import Header from "@/components/navigation/Header"; // Removed - not implemented yet
// import Footer from "@/components/navigation/Footer"; // Removed - not implemented yet
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nodo360.com'),
  title: {
    default: "Nodo360 - Formación profesional en Bitcoin, Blockchain y Web3",
    template: "%s | Nodo360",
  },
  description: "Aprende Bitcoin, Blockchain, DeFi y desarrollo Web3 desde cero. Más de 5,000 estudiantes y 25+ cursos profesionales.",
  keywords: ['bitcoin', 'blockchain', 'criptomonedas', 'web3', 'educación', 'cursos', 'español', 'DeFi'],
  authors: [{ name: 'Nodo360' }],
  creator: 'Nodo360',
  icons: {
    icon: '/imagenes/logo-nodo360.png',
    apple: '/imagenes/logo-nodo360.png',
    shortcut: '/imagenes/logo-nodo360.png',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Nodo360',
    title: 'Nodo360 - Aprende Bitcoin y Blockchain',
    description: 'La plataforma educativa más completa en español para aprender Bitcoin, Blockchain y Web3',
    images: [
      {
        url: '/imagenes/og-nodo360.png',
        width: 1200,
        height: 630,
        alt: 'Nodo360 - Aprende Bitcoin y Blockchain',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nodo360 - Aprende Bitcoin y Blockchain',
    description: 'La plataforma educativa más completa en español para aprender Bitcoin, Blockchain y Web3',
    images: ['/imagenes/og-nodo360.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.className}>
      <body className="bg-black text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
