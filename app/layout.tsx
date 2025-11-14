import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import Header from "@/components/navigation/Header"; // Removed - not implemented yet
// import Footer from "@/components/navigation/Footer"; // Removed - not implemented yet
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nodo360 - Formación profesional en Bitcoin, Blockchain y Web3",
  description: "Aprende Bitcoin, Blockchain, DeFi y desarrollo Web3 desde cero. Más de 5,000 estudiantes y 25+ cursos profesionales.",
  icons: {
    icon: '/imagenes/logo-nodo360.png.png',
    apple: '/imagenes/logo-nodo360.png.png',
    shortcut: '/imagenes/logo-nodo360.png.png',
  },
  openGraph: {
    title: 'Nodo360 - Aprende Bitcoin y Blockchain',
    description: 'La plataforma educativa más completa en español para aprender Bitcoin, Blockchain y Web3',
    url: 'https://nodo360.com',
    siteName: 'Nodo360',
    images: [
      {
        url: '/imagenes/logo-nodo360.png.png',
        width: 1200,
        height: 630,
        alt: 'Nodo360 - Aprende Bitcoin y Blockchain',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nodo360 - Aprende Bitcoin y Blockchain',
    description: 'La plataforma educativa más completa en español para aprender Bitcoin, Blockchain y Web3',
    images: ['/imagenes/logo-nodo360.png.png'],
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
        {/* <Header /> - Removed for MVP */}
        <main>
          {children}
        </main>
        {/* <Footer /> - Removed for MVP */}
      </body>
    </html>
  );
}
