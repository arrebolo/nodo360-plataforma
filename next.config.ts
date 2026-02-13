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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com https://*.sentry.io",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src 'self' https://www.youtube.com https://youtube.com https://docs.google.com https://*.canva.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://www.youtube.com",
      "media-src 'self' https://www.youtube.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; ')
  }
];

const nextConfig: NextConfig = {
  // SEO: Sin trailing slash para URLs canónicas consistentes
  trailingSlash: false,

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
      // Canonical: www → sin www (dominio oficial: nodo360.com)
      // ========================================
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.nodo360.com' }],
        destination: 'https://nodo360.com/:path*',
        permanent: true,
      },

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
      { source: '/courses/:slug', destination: '/cursos', permanent: true },
      { source: '/courses/:slug/', destination: '/cursos', permanent: true },

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
