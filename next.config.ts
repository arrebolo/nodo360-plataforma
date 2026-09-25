import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Headers de seguridad
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  {
    // Content Security Policy
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // www.googletagmanager.com sirve gtag.js (GA4). El propio componente de
      // @next/third-parties inyecta ademas un script inline para dataLayer,
      // que ya cubre el 'unsafe-inline' de arriba.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com https://*.sentry.io https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // OJO: el 'https:' de esta linea ya permite cualquier imagen servida por
      // HTTPS, asi que los tres dominios de GA son HOY redundantes. Se listan
      // a proposito: el pixel de respaldo de GA4 sale por img-src, y cuando se
      // acote ese 'https: http:' —conviene hacerlo— quedaran a la vista en vez
      // de romperse en silencio, que es justo lo que acaba de pasar con
      // script-src. No conceden ningun permiso nuevo.
      "img-src 'self' data: blob: https: http: https://www.google-analytics.com https://region1.google-analytics.com https://*.analytics.google.com",
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src 'self' https://www.youtube.com https://youtube.com https://docs.google.com https://*.canva.com",
      // GA4 envia los hits por aqui: google-analytics.com es el destino
      // clasico, region1 el regional que usa desde Europa, y *.analytics
      // .google.com cubre el resto de subdominios del servicio.
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://www.youtube.com https://www.google-analytics.com https://region1.google-analytics.com https://*.analytics.google.com",
      "media-src 'self' https://www.youtube.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; ')
  }
];

const nextConfig: NextConfig = {
  // Optimización de imágenes
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'nodo360.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
    minimumCacheTTL: 60,
  },

  // Configuración de compilador
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // Redirects 301 para URLs antiguas de WordPress (SEO)
  async redirects() {
    return [
      // ========================================
      // /beta, retirada el 26/09/2026
      // ========================================
      // La puerta de la beta ya no existe: el middleware dejo de comprobarla
      // ("Beta access check removed"), asi que cualquier usuario autenticado
      // entra. La pagina, en cambio, seguia publicada diciendo «Estamos
      // activando accesos gradualmente», y nadie la enlazaba: solo se llegaba
      // por un enlace antiguo o escribiendo la URL. Una lista de espera que no
      // existe es peor que ninguna pagina, asi que se retira y se redirige al
      // catalogo, que es lo que esa persona venia a buscar.
      { source: '/beta', destination: '/cursos', permanent: true },
      { source: '/beta/', destination: '/cursos', permanent: true },

      // ========================================
      // Páginas principales antiguas de WordPress
      // ========================================
      { source: '/home', destination: '/', permanent: true },
      { source: '/home/', destination: '/', permanent: true },
      { source: '/inicio', destination: '/', permanent: true },
      { source: '/inicio/', destination: '/', permanent: true },
      { source: '/index.php', destination: '/', permanent: true },
      { source: '/index.php/', destination: '/', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },

      // Contacto
      { source: '/contact', destination: '/sobre-nosotros', permanent: true },
      { source: '/contact/', destination: '/sobre-nosotros', permanent: true },
      { source: '/contacto', destination: '/sobre-nosotros', permanent: true },
      { source: '/contacto/', destination: '/sobre-nosotros', permanent: true },
      { source: '/index.php/contact', destination: '/sobre-nosotros', permanent: true },
      { source: '/index.php/contact/', destination: '/sobre-nosotros', permanent: true },
      { source: '/index.php/contacto', destination: '/sobre-nosotros', permanent: true },
      { source: '/index.php/contacto/', destination: '/sobre-nosotros', permanent: true },

      // Páginas con sufijos numéricos de WordPress
      { source: '/comunidad-2', destination: '/comunidad', permanent: true },
      { source: '/comunidad-2/', destination: '/comunidad', permanent: true },
      { source: '/cart-2', destination: '/cursos', permanent: true },
      { source: '/cart-2/', destination: '/cursos', permanent: true },
      { source: '/cart', destination: '/cursos', permanent: true },
      { source: '/cart/', destination: '/cursos', permanent: true },
      { source: '/carrito', destination: '/cursos', permanent: true },
      { source: '/carrito/', destination: '/cursos', permanent: true },
      { source: '/checkout', destination: '/cursos', permanent: true },
      { source: '/checkout/', destination: '/cursos', permanent: true },

      // ========================================
      // Categorías antiguas de WordPress → Blog
      // ========================================
      { source: '/category/:slug', destination: '/blog', permanent: true },
      { source: '/category/:slug/', destination: '/blog', permanent: true },
      { source: '/categoria/:slug', destination: '/blog', permanent: true },
      { source: '/categoria/:slug/', destination: '/blog', permanent: true },
      { source: '/index.php/category/:slug', destination: '/blog', permanent: true },
      { source: '/index.php/category/:slug/', destination: '/blog', permanent: true },
      { source: '/tag/:slug', destination: '/blog', permanent: true },
      { source: '/tag/:slug/', destination: '/blog', permanent: true },
      { source: '/etiqueta/:slug', destination: '/blog', permanent: true },
      { source: '/etiqueta/:slug/', destination: '/blog', permanent: true },

      // ========================================
      // Artículos antiguos de WordPress → Blog
      // ========================================
      // Formato /año/mes/día/slug
      { source: '/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug', destination: '/blog', permanent: true },
      { source: '/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug/', destination: '/blog', permanent: true },
      { source: '/index.php/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug', destination: '/blog', permanent: true },
      { source: '/index.php/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug/', destination: '/blog', permanent: true },

      // Formato /año/mes/slug
      { source: '/:year(\\d{4})/:month(\\d{2})/:slug', destination: '/blog', permanent: true },
      { source: '/:year(\\d{4})/:month(\\d{2})/:slug/', destination: '/blog', permanent: true },

      // Posts con index.php
      { source: '/index.php/post/:slug', destination: '/blog', permanent: true },
      { source: '/index.php/post/:slug/', destination: '/blog', permanent: true },
      { source: '/index.php/articulo/:slug', destination: '/blog', permanent: true },
      { source: '/index.php/articulo/:slug/', destination: '/blog', permanent: true },

      // ========================================
      // Cursos antiguos que ya no existen
      // ========================================
      { source: '/cursos/bitcoin-principiantes', destination: '/cursos', permanent: true },
      { source: '/cursos/bitcoin-principiantes/', destination: '/cursos', permanent: true },
      { source: '/cursos/principiante', destination: '/cursos', permanent: true },
      { source: '/cursos/principiante/', destination: '/cursos', permanent: true },
      { source: '/cursos/basico', destination: '/cursos', permanent: true },
      { source: '/cursos/basico/', destination: '/cursos', permanent: true },
      { source: '/cursos/avanzado', destination: '/cursos', permanent: true },
      { source: '/cursos/avanzado/', destination: '/cursos', permanent: true },
      { source: '/curso/:slug', destination: '/cursos', permanent: true },
      { source: '/curso/:slug/', destination: '/cursos', permanent: true },

      // ========================================
      // Lecciones retiradas por la reescritura de
      // "Como funciona Bitcoin" (migracion 043)
      // ========================================
      // Las lecciones entran en el sitemap (ver app/sitemap.ts), con la ruta
      // /cursos/{slug-curso}/{slug-leccion}. La reescritura conservo cuatro de
      // los seis slugs reasignandolos a la leccion que trata ese mismo tema,
      // pero estos dos quedaron sin equivalente y hoy devuelven 404.
      //
      // Van con statusCode: 301 y no con permanent: true a proposito.
      // permanent: true emite un 308, que los buscadores tratan igual pero no
      // es lo que dice la mayoria de la documentacion de SEO ni lo que se
      // espera al revisar la cabecera. 301 es lo pedido y lo explicito.
      //
      // Las variantes con barra final no llegan a dispararse: Next normaliza
      // antes quitando la barra, asi que /vieja/ pasa por dos saltos. Se dejan
      // por coherencia con el resto del archivo y por si cambiara esa opcion.

      // "Seguridad y confianza en Bitcoin" trataba en que se apoya la confianza
      // sin intermediarios y si Bitcoin es seguro al 100%. Ese contenido vive
      // ahora en la ultima leccion, que separa lo que el diseno protege de lo
      // que no.
      {
        source: '/cursos/como-funciona-bitcoin-nivel-basico/seguridad-y-confianza-en-bitcoin',
        destination: '/cursos/como-funciona-bitcoin-nivel-basico/descentralizacion-que-significa-realmente',
        statusCode: 301,
      },
      {
        source: '/cursos/como-funciona-bitcoin-nivel-basico/seguridad-y-confianza-en-bitcoin/',
        destination: '/cursos/como-funciona-bitcoin-nivel-basico/descentralizacion-que-significa-realmente',
        statusCode: 301,
      },

      // "Que puedes aprender despues" era orientacion, no contenido: ninguna
      // leccion nueva tiene ese tema. La orientacion paso a ser el cierre de la
      // ultima leccion, pero quien llega buscando por donde seguir encaja mejor
      // en la ficha del curso, que es la que ofrece el recorrido completo.
      {
        source: '/cursos/como-funciona-bitcoin-nivel-basico/que-puedes-aprender-despues-de-entender-como-funciona-bitcoin',
        destination: '/cursos/como-funciona-bitcoin-nivel-basico',
        statusCode: 301,
      },
      {
        source: '/cursos/como-funciona-bitcoin-nivel-basico/que-puedes-aprender-despues-de-entender-como-funciona-bitcoin/',
        destination: '/cursos/como-funciona-bitcoin-nivel-basico',
        statusCode: 301,
      },
      { source: '/courses/:slug', destination: '/cursos', permanent: true },
      { source: '/courses/:slug/', destination: '/cursos', permanent: true },

      // ========================================
      // Curso "Bitcoin como sistema monetario", fusionado dentro de
      // "Fundamentos de Bitcoin" (migracion 045)
      // ========================================
      // Sus 6 lecciones y su ficha quedan sin destino al archivarlo. Cada una
      // apunta a la leccion de Fundamentos que trata ese mismo tema, no a la
      // ficha del curso: aterrizar en el contenido equivalente conserva mucho
      // mejor la intencion de quien llega desde un buscador.
      //
      // Con statusCode: 301 y no permanent: true, que emite 308.

      // la ficha del curso pasa a la de Fundamentos
      {
        source: '/cursos/bitcoin-como-sistema-monetario',
        destination: '/cursos/fundamentos-de-bitcoin',
        statusCode: 301,
      },
      {
        source: '/cursos/bitcoin-como-sistema-monetario/',
        destination: '/cursos/fundamentos-de-bitcoin',
        statusCode: 301,
      },

      // mismo tema: si Bitcoin cumple las funciones del dinero
      {
        source: '/cursos/bitcoin-como-sistema-monetario/bitcoin-como-dinero-digital',
        destination: '/cursos/fundamentos-de-bitcoin/es-bitcoin-dinero-las-tres-funciones',
        statusCode: 301,
      },
      {
        source: '/cursos/bitcoin-como-sistema-monetario/bitcoin-como-dinero-digital/',
        destination: '/cursos/fundamentos-de-bitcoin/es-bitcoin-dinero-las-tres-funciones',
        statusCode: 301,
      },

      // los 21 millones y el halving viven ahora en la 2.2
      {
        source: '/cursos/bitcoin-como-sistema-monetario/oferta-limitada-y-emision-programada',
        destination: '/cursos/fundamentos-de-bitcoin/por-que-bitcoin-es-diferente',
        statusCode: 301,
      },
      {
        source: '/cursos/bitcoin-como-sistema-monetario/oferta-limitada-y-emision-programada/',
        destination: '/cursos/fundamentos-de-bitcoin/por-que-bitcoin-es-diferente',
        statusCode: 301,
      },

      // mismo tema y mismo slug, ya en Fundamentos
      {
        source: '/cursos/bitcoin-como-sistema-monetario/bitcoin-frente-al-dinero-fiat',
        destination: '/cursos/fundamentos-de-bitcoin/bitcoin-frente-al-dinero-fiat',
        statusCode: 301,
      },
      {
        source: '/cursos/bitcoin-como-sistema-monetario/bitcoin-frente-al-dinero-fiat/',
        destination: '/cursos/fundamentos-de-bitcoin/bitcoin-frente-al-dinero-fiat',
        statusCode: 301,
      },

      // la soberania es parte de lo que resuelve, tratado en la 2.3
      {
        source: '/cursos/bitcoin-como-sistema-monetario/soberania-individual-y-neutralidad-monetaria',
        destination: '/cursos/fundamentos-de-bitcoin/que-problemas-resuelve-realmente',
        statusCode: 301,
      },
      {
        source: '/cursos/bitcoin-como-sistema-monetario/soberania-individual-y-neutralidad-monetaria/',
        destination: '/cursos/fundamentos-de-bitcoin/que-problemas-resuelve-realmente',
        statusCode: 301,
      },

      // era la leccion duplicada; queda una sola
      {
        source: '/cursos/bitcoin-como-sistema-monetario/que-problemas-si-resuelve-bitcoin',
        destination: '/cursos/fundamentos-de-bitcoin/que-problemas-resuelve-realmente',
        statusCode: 301,
      },
      {
        source: '/cursos/bitcoin-como-sistema-monetario/que-problemas-si-resuelve-bitcoin/',
        destination: '/cursos/fundamentos-de-bitcoin/que-problemas-resuelve-realmente',
        statusCode: 301,
      },

      // mismo tema y mismo slug, ya en Fundamentos
      {
        source: '/cursos/bitcoin-como-sistema-monetario/limites-y-criticas-a-bitcoin',
        destination: '/cursos/fundamentos-de-bitcoin/limites-y-criticas-a-bitcoin',
        statusCode: 301,
      },
      {
        source: '/cursos/bitcoin-como-sistema-monetario/limites-y-criticas-a-bitcoin/',
        destination: '/cursos/fundamentos-de-bitcoin/limites-y-criticas-a-bitcoin',
        statusCode: 301,
      },

      // ========================================
      // Cursos "Custodia y proteccion de tus fondos" y "Custodia y
      // proteccion practica de criptomonedas", fusionados dentro de
      // "Seguridad basica en Bitcoin y criptomonedas" (migracion 048)
      // ========================================
      // Los dos cursos cubrian lo mismo con distinto nombre. Sus 12 lecciones
      // y sus 2 fichas quedan sin destino al archivarlos. Cada una apunta a la
      // leccion que trata ese mismo tema, no a la ficha del curso.
      //
      // Tres van fuera del curso fusionado a proposito: las copias de seguridad
      // se tratan a fondo en Cold Storage, que ahora esta en la misma ruta, y
      // los tipos de cartera, en Uso practico.
      //
      // Con statusCode: 301 y no permanent: true, que emite 308.

      // las dos fichas de curso pasan a la de Seguridad basica
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos/',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas/',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas',
        statusCode: 301,
      },

      // que es custodiar: mismo tema, leccion 3.1 del curso fusionado
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos/que-es-la-custodia-de-criptomonedas',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/que-es-la-custodia-de-criptomonedas',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos/que-es-la-custodia-de-criptomonedas/',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/que-es-la-custodia-de-criptomonedas',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas/que-significa-realmente-custodiar-criptomonedas',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/que-es-la-custodia-de-criptomonedas',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas/que-significa-realmente-custodiar-criptomonedas/',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/que-es-la-custodia-de-criptomonedas',
        statusCode: 301,
      },

      // custodia propia o delegada: leccion 3.2
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos/custodia-propia-vs-custodios-terceros',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/custodia-propia-vs-custodios-terceros',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos/custodia-propia-vs-custodios-terceros/',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/custodia-propia-vs-custodios-terceros',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas/custodia-propia-y-custodia-en-terceros',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/custodia-propia-vs-custodios-terceros',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas/custodia-propia-y-custodia-en-terceros/',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/custodia-propia-vs-custodios-terceros',
        statusCode: 301,
      },

      // tipos de cartera: lo trata Uso practico al elegir con que empezar
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos/wallets-tipos-y-diferencias',
        destination: '/cursos/uso-practico-de-bitcoin/que-necesitas-para-usar-bitcoin',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos/wallets-tipos-y-diferencias/',
        destination: '/cursos/uso-practico-de-bitcoin/que-necesitas-para-usar-bitcoin',
        statusCode: 301,
      },

      // control del acceso: leccion 2.1, claves y contrasenas
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas/wallets-y-control-del-acceso',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/claves-privadas-y-contrasenas',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas/wallets-y-control-del-acceso/',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/claves-privadas-y-contrasenas',
        statusCode: 301,
      },

      // copias de seguridad: donde se tratan de verdad, en Cold Storage
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos/copias-de-seguridad-y-recuperacion',
        destination: '/cursos/cold-storage-protege-tus-bitcoin/backup-seguro-de-seeds',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos/copias-de-seguridad-y-recuperacion/',
        destination: '/cursos/cold-storage-protege-tus-bitcoin/backup-seguro-de-seeds',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas/copias-de-seguridad-y-recuperacion',
        destination: '/cursos/cold-storage-protege-tus-bitcoin/backup-seguro-de-seeds',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas/copias-de-seguridad-y-recuperacion/',
        destination: '/cursos/cold-storage-protege-tus-bitcoin/backup-seguro-de-seeds',
        statusCode: 301,
      },

      // habitos del dia a dia: leccion 2.3, el minimo ordenado
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos/que-hacer-y-que-no-hacer-en-el-dia-a-dia',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/buenas-practicas-minimas-de-seguridad',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos/que-hacer-y-que-no-hacer-en-el-dia-a-dia/',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/buenas-practicas-minimas-de-seguridad',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos/checklist-de-proteccion-basica',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/buenas-practicas-minimas-de-seguridad',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-de-tus-fondos/checklist-de-proteccion-basica/',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/buenas-practicas-minimas-de-seguridad',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas/uso-diario-seguro-y-habitos-basicos',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/buenas-practicas-minimas-de-seguridad',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas/uso-diario-seguro-y-habitos-basicos/',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/buenas-practicas-minimas-de-seguridad',
        statusCode: 301,
      },

      // errores de custodia: leccion 1.3, por que se cometen
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas/errores-comunes-en-la-custodia',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/errores-comunes-de-los-principiantes',
        statusCode: 301,
      },
      {
        source: '/cursos/custodia-y-proteccion-practica-de-criptomonedas/errores-comunes-en-la-custodia/',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/errores-comunes-de-los-principiantes',
        statusCode: 301,
      },

      // La ruta "Seguridad Avanzada" desaparece: su unico curso, Cold Storage,
      // pasa a "Seguridad en Criptomonedas", que ahora la incluye entera.
      {
        source: '/rutas/seguridad-avanzada',
        destination: '/rutas/seguridad-cripto',
        statusCode: 301,
      },
      {
        source: '/rutas/seguridad-avanzada/',
        destination: '/rutas/seguridad-cripto',
        statusCode: 301,
      },
      // ========================================
      // Rutas Web3 Basica y Trading Basico, fusionadas (migracion 052)
      // ========================================
      // Cada ruta pasa de dos cursos a uno. "Ecosistema Web3 explicado" y
      // "Gestion del riesgo y mentalidad en trading" quedan archivados y sus
      // 12 lecciones sin destino.
      //
      // Ademas, los dos cursos que se quedan cambian nueve slugs entre ellos,
      // asi que sus URLs antiguas tambien necesitan destino. Es lo que la
      // regla 21 del prompt maestro obliga a no olvidar.
      //
      // Dos van fuera de su curso a proposito: los riesgos de Web3 los trata
      // Seguridad basica, que es donde estan de verdad.
      //
      // Con statusCode: 301 y no permanent: true, que emite 308.

      // Web3: la ficha del curso absorbido
      {
        source: '/cursos/ecosistema-web3-explicado',
        destination: '/cursos/introduccion-a-web3',
        statusCode: 301,
      },
      {
        source: '/cursos/ecosistema-web3-explicado/',
        destination: '/cursos/introduccion-a-web3',
        statusCode: 301,
      },

      // componentes de Web3: la clave y el contrato tienen leccion propia ahora
      {
        source: '/cursos/ecosistema-web3-explicado/wallets-en-web3',
        destination: '/cursos/introduccion-a-web3/claves-identidad-y-acceso',
        statusCode: 301,
      },
      {
        source: '/cursos/ecosistema-web3-explicado/wallets-en-web3/',
        destination: '/cursos/introduccion-a-web3/claves-identidad-y-acceso',
        statusCode: 301,
      },
      {
        source: '/cursos/ecosistema-web3-explicado/dapps-y-contratos-inteligentes',
        destination: '/cursos/introduccion-a-web3/contratos-inteligentes-y-dapps',
        statusCode: 301,
      },
      {
        source: '/cursos/ecosistema-web3-explicado/dapps-y-contratos-inteligentes/',
        destination: '/cursos/introduccion-a-web3/contratos-inteligentes-y-dapps',
        statusCode: 301,
      },
      {
        source: '/cursos/ecosistema-web3-explicado/tokens-y-nfts',
        destination: '/cursos/introduccion-a-web3/tokens-y-nfts',
        statusCode: 301,
      },
      {
        source: '/cursos/ecosistema-web3-explicado/tokens-y-nfts/',
        destination: '/cursos/introduccion-a-web3/tokens-y-nfts',
        statusCode: 301,
      },

      // que probar y riesgos: lo cubren el metodo y los cursos de uso y seguridad
      {
        source: '/cursos/ecosistema-web3-explicado/que-puedes-probar-hoy-en-web3',
        destination: '/cursos/introduccion-a-web3/como-mirar-un-proyecto',
        statusCode: 301,
      },
      {
        source: '/cursos/ecosistema-web3-explicado/que-puedes-probar-hoy-en-web3/',
        destination: '/cursos/introduccion-a-web3/como-mirar-un-proyecto',
        statusCode: 301,
      },
      {
        source: '/cursos/ecosistema-web3-explicado/riesgos-y-expectativas-realistas',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/errores-comunes-de-los-principiantes',
        statusCode: 301,
      },
      {
        source: '/cursos/ecosistema-web3-explicado/riesgos-y-expectativas-realistas/',
        destination: '/cursos/seguridad-basica-en-bitcoin-y-criptomonedas/errores-comunes-de-los-principiantes',
        statusCode: 301,
      },
      {
        source: '/cursos/ecosistema-web3-explicado/proximos-pasos-de-aprendizaje-en-web3',
        destination: '/cursos/introduccion-a-web3/que-sigue-despues',
        statusCode: 301,
      },
      {
        source: '/cursos/ecosistema-web3-explicado/proximos-pasos-de-aprendizaje-en-web3/',
        destination: '/cursos/introduccion-a-web3/que-sigue-despues',
        statusCode: 301,
      },

      // Web3: slugs que cambian dentro del curso que se queda
      {
        source: '/cursos/introduccion-a-web3/que-es-web2-y-cuales-son-sus-limites',
        destination: '/cursos/introduccion-a-web3/que-es-web2-y-como-funciona',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-a-web3/que-es-web2-y-cuales-son-sus-limites/',
        destination: '/cursos/introduccion-a-web3/que-es-web2-y-como-funciona',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-a-web3/diferencias-clave-entre-web2-y-web3',
        destination: '/cursos/introduccion-a-web3/que-cambia-y-que-no-cambia',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-a-web3/diferencias-clave-entre-web2-y-web3/',
        destination: '/cursos/introduccion-a-web3/que-cambia-y-que-no-cambia',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-a-web3/identidad-digital-en-web3',
        destination: '/cursos/introduccion-a-web3/claves-identidad-y-acceso',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-a-web3/identidad-digital-en-web3/',
        destination: '/cursos/introduccion-a-web3/claves-identidad-y-acceso',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-a-web3/descentralizacion-y-propiedad-digital',
        destination: '/cursos/introduccion-a-web3/como-mirar-un-proyecto',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-a-web3/descentralizacion-y-propiedad-digital/',
        destination: '/cursos/introduccion-a-web3/como-mirar-un-proyecto',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-a-web3/casos-de-uso-reales-de-web3',
        destination: '/cursos/introduccion-a-web3/donde-aporta-y-donde-no',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-a-web3/casos-de-uso-reales-de-web3/',
        destination: '/cursos/introduccion-a-web3/donde-aporta-y-donde-no',
        statusCode: 301,
      },

      // Trading: la ficha del curso absorbido
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas',
        statusCode: 301,
      },
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading/',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas',
        statusCode: 301,
      },

      // riesgo y por que se pierde: ahora es el modulo 2 entero
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading/que-es-el-riesgo-en-trading',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/las-cuentas-que-no-se-hacen',
        statusCode: 301,
      },
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading/que-es-el-riesgo-en-trading/',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/las-cuentas-que-no-se-hacen',
        statusCode: 301,
      },
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading/por-que-la-mayoria-pierde-dinero',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/de-donde-sale-el-dinero',
        statusCode: 301,
      },
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading/por-que-la-mayoria-pierde-dinero/',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/de-donde-sale-el-dinero',
        statusCode: 301,
      },
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading/expectativas-realistas-en-trading',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/expectativas-realistas',
        statusCode: 301,
      },
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading/expectativas-realistas-en-trading/',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/expectativas-realistas',
        statusCode: 301,
      },

      // mentalidad: fusionada en una sola leccion
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading/psicologia-basica-del-trader',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/lo-que-hace-la-cabeza',
        statusCode: 301,
      },
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading/psicologia-basica-del-trader/',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/lo-que-hace-la-cabeza',
        statusCode: 301,
      },
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading/disciplina-y-reglas-personales',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/lo-que-hace-la-cabeza',
        statusCode: 301,
      },
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading/disciplina-y-reglas-personales/',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/lo-que-hace-la-cabeza',
        statusCode: 301,
      },
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading/checklist-del-trader-principiante',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/deberia-hacer-trading',
        statusCode: 301,
      },
      {
        source: '/cursos/gestion-del-riesgo-y-mentalidad-en-trading/checklist-del-trader-principiante/',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/deberia-hacer-trading',
        statusCode: 301,
      },

      // Trading: slugs que cambian dentro del curso que se queda
      {
        source: '/cursos/introduccion-al-trading-de-criptomonedas/trading-vs-inversion',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/trading-inversion-y-uso',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-al-trading-de-criptomonedas/trading-vs-inversion/',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/trading-inversion-y-uso',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-al-trading-de-criptomonedas/errores-comunes-en-trading',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/lo-que-hace-la-cabeza',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-al-trading-de-criptomonedas/errores-comunes-en-trading/',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/lo-que-hace-la-cabeza',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-al-trading-de-criptomonedas/que-es-un-mercado-y-la-liquidez',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/las-cuentas-que-no-se-hacen',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-al-trading-de-criptomonedas/que-es-un-mercado-y-la-liquidez/',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/las-cuentas-que-no-se-hacen',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-al-trading-de-criptomonedas/riesgos-reales-del-trading',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/expectativas-realistas',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-al-trading-de-criptomonedas/riesgos-reales-del-trading/',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/expectativas-realistas',
        statusCode: 301,
      },

      // la leccion de tipos de orden desaparece: el curso ya no ensena a operar
      {
        source: '/cursos/introduccion-al-trading-de-criptomonedas/tipos-de-ordenes-basicas',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/deberia-hacer-trading',
        statusCode: 301,
      },
      {
        source: '/cursos/introduccion-al-trading-de-criptomonedas/tipos-de-ordenes-basicas/',
        destination: '/cursos/introduccion-al-trading-de-criptomonedas/deberia-hacer-trading',
        statusCode: 301,
      },
      // ========================================
      // URLs de WordPress comunes
      // ========================================
      { source: '/wp-admin', destination: '/', permanent: true },
      { source: '/wp-admin/:path*', destination: '/', permanent: true },
      { source: '/wp-login.php', destination: '/login', permanent: true },
      { source: '/wp-content/:path*', destination: '/', permanent: true },
      { source: '/wp-includes/:path*', destination: '/', permanent: true },
      { source: '/xmlrpc.php', destination: '/', permanent: true },
      { source: '/feed', destination: '/blog', permanent: true },
      { source: '/feed/', destination: '/blog', permanent: true },
      { source: '/rss', destination: '/blog', permanent: true },
      { source: '/rss/', destination: '/blog', permanent: true },

      // ========================================
      // Páginas de autor de WordPress
      // ========================================
      { source: '/author/:slug', destination: '/blog', permanent: true },
      { source: '/author/:slug/', destination: '/blog', permanent: true },
      { source: '/autor/:slug', destination: '/blog', permanent: true },
      { source: '/autor/:slug/', destination: '/blog', permanent: true },

      // ========================================
      // Archivos por fecha de WordPress
      // ========================================
      { source: '/:year(\\d{4})/:month(\\d{2})', destination: '/blog', permanent: true },
      { source: '/:year(\\d{4})/:month(\\d{2})/', destination: '/blog', permanent: true },
      { source: '/:year(\\d{4})', destination: '/blog', permanent: true },
      { source: '/:year(\\d{4})/', destination: '/blog', permanent: true },

      // ========================================
      // Páginas comunes que podrían existir
      // ========================================
      { source: '/about', destination: '/sobre-nosotros', permanent: true },
      { source: '/about/', destination: '/sobre-nosotros', permanent: true },
      { source: '/about-us', destination: '/sobre-nosotros', permanent: true },
      { source: '/about-us/', destination: '/sobre-nosotros', permanent: true },
      { source: '/acerca', destination: '/sobre-nosotros', permanent: true },
      { source: '/acerca/', destination: '/sobre-nosotros', permanent: true },
      { source: '/acerca-de', destination: '/sobre-nosotros', permanent: true },
      { source: '/acerca-de/', destination: '/sobre-nosotros', permanent: true },
      { source: '/quienes-somos', destination: '/sobre-nosotros', permanent: true },
      { source: '/quienes-somos/', destination: '/sobre-nosotros', permanent: true },

      { source: '/blog-2', destination: '/blog', permanent: true },
      { source: '/blog-2/', destination: '/blog', permanent: true },
      { source: '/noticias', destination: '/blog', permanent: true },
      { source: '/noticias/', destination: '/blog', permanent: true },
      { source: '/news', destination: '/blog', permanent: true },
      { source: '/news/', destination: '/blog', permanent: true },
      { source: '/articulos', destination: '/blog', permanent: true },
      { source: '/articulos/', destination: '/blog', permanent: true },

      { source: '/products', destination: '/cursos', permanent: true },
      { source: '/products/', destination: '/cursos', permanent: true },
      { source: '/productos', destination: '/cursos', permanent: true },
      { source: '/productos/', destination: '/cursos', permanent: true },
      { source: '/shop', destination: '/cursos', permanent: true },
      { source: '/shop/', destination: '/cursos', permanent: true },
      { source: '/tienda', destination: '/cursos', permanent: true },
      { source: '/tienda/', destination: '/cursos', permanent: true },

      { source: '/terms', destination: '/terminos', permanent: true },
      { source: '/terms/', destination: '/terminos', permanent: true },
      { source: '/terms-of-service', destination: '/terminos', permanent: true },
      { source: '/terms-of-service/', destination: '/terminos', permanent: true },
      { source: '/tos', destination: '/terminos', permanent: true },
      { source: '/tos/', destination: '/terminos', permanent: true },

      { source: '/privacy', destination: '/privacidad', permanent: true },
      { source: '/privacy/', destination: '/privacidad', permanent: true },
      { source: '/privacy-policy', destination: '/privacidad', permanent: true },
      { source: '/privacy-policy/', destination: '/privacidad', permanent: true },
      { source: '/politica-privacidad', destination: '/privacidad', permanent: true },
      { source: '/politica-privacidad/', destination: '/privacidad', permanent: true },

      // ========================================
      // Paginación de WordPress
      // ========================================
      { source: '/page/:num(\\d+)', destination: '/blog', permanent: true },
      { source: '/page/:num(\\d+)/', destination: '/blog', permanent: true },
      { source: '/blog/page/:num(\\d+)', destination: '/blog', permanent: true },
      { source: '/blog/page/:num(\\d+)/', destination: '/blog', permanent: true },

      // ========================================
      // Búsqueda de WordPress
      // ========================================
      { source: '/search/:query*', destination: '/cursos', permanent: true },
      { source: '/buscar/:query*', destination: '/cursos', permanent: true },
    ]
  },

  // Configuración experimental para mejor performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

// Nota: Sentry se configura via instrumentation.ts y sentry.*.config.ts
// No usamos withSentryConfig debido a incompatibilidad con Turbopack en Windows
// Bundle analyzer: ANALYZE=true npm run build
export default withBundleAnalyzer(nextConfig);
