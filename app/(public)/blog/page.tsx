import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { Footer } from '@/components/navigation/Footer'
import { getAllPosts, blogCategories, type BlogPost } from '@/lib/blog-data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog Bitcoin y Blockchain | Nodo360',
  description: 'Artículos educativos sobre Bitcoin, Blockchain, DeFi y Web3. Guías completas en español para principiantes y avanzados.',
  openGraph: {
    title: 'Blog Bitcoin y Blockchain | Nodo360',
    description: 'Artículos educativos sobre Bitcoin, Blockchain, DeFi y Web3 en español.',
    type: 'website',
    url: 'https://nodo360.com/blog',
    images: [{ url: '/imagenes/og-blog.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog Bitcoin y Blockchain | Nodo360',
    description: 'Artículos educativos sobre Bitcoin, Blockchain, DeFi y Web3 en español.',
  },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const imageAltMap: Record<string, string> = {
  'que-es-bitcoin-guia-completa': 'Monedas de Bitcoin doradas representando qué es Bitcoin',
  'como-comprar-bitcoin-espana': 'Persona comprando Bitcoin en España con smartphone',
  'que-es-blockchain-explicado': 'Representación visual de la tecnología blockchain',
  'soberania-financiera-bitcoin': 'Llave dorada representando la soberanía financiera con Bitcoin',
  'defi-para-principiantes': 'Interfaz de finanzas descentralizadas DeFi',
}

function BlogCard({ post, priority = false }: { post: BlogPost; priority?: boolean }) {
  const category = blogCategories[post.category]
  const altText = imageAltMap[post.slug] || `Imagen del artículo: ${post.title}`

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-dark-surface border border-white/10 rounded-2xl overflow-hidden hover:border-brand-light/50 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-video bg-gradient-to-br from-brand-light/20 to-brand/10">
        <Image
          src={post.image}
          alt={altText}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          priority={priority}
        />
      </div>

      <div className="p-6">
        {/* Category */}
        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${category.color}`}>
          {category.name}
        </span>

        {/* Title */}
        <h2 className="mt-4 text-xl font-bold text-white group-hover:text-brand-light transition-colors line-clamp-2">
          {post.title}
        </h2>

        {/* Description */}
        <p className="mt-2 text-white/60 text-sm line-clamp-2">
          {post.description}
        </p>

        {/* Meta */}
        <div className="mt-4 flex items-center gap-4 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(post.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {post.readingTime} min
          </span>
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center gap-2 text-brand-light text-sm font-medium group-hover:gap-3 transition-all">
          Leer artículo
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  )
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <div className="bg-gradient-to-b from-brand/10 via-brand-light/5 to-transparent py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 bg-brand-light/10 border border-brand-light/30 text-brand-light text-sm font-medium rounded-full mb-6">
              Blog Educativo
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Aprende sobre{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-brand">
                Bitcoin y Blockchain
              </span>
            </h1>
            <p className="text-lg text-white/70">
              Guías completas, tutoriales y artículos educativos en español.
              Desde conceptos básicos hasta estrategias avanzadas.
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/blog"
            className="px-4 py-2 bg-brand-light/20 text-brand-light border border-brand-light/30 rounded-full text-sm font-medium hover:bg-brand-light/30 transition"
          >
            Todos
          </Link>
          {Object.entries(blogCategories).map(([key, category]) => (
            <button
              key={key}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition hover:opacity-80 ${category.color}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/60">No hay artículos disponibles.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <BlogCard key={post.slug} post={post} priority={index < 3} />
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-gradient-to-br from-brand/10 to-brand-light/5 border border-brand/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            ¿Quieres aprender más?
          </h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Nuestros cursos te llevan de principiante a experto con contenido estructurado,
            ejercicios prácticos y certificados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cursos"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition"
            >
              Explorar Cursos
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/rutas"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition"
            >
              Ver Rutas de Aprendizaje
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
