import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Calendar, Clock, ArrowLeft, ArrowRight, User, BookOpen } from 'lucide-react'
import { Footer } from '@/components/navigation/Footer'
import { getPostBySlug, getRelatedPosts, blogCategories, getAllPosts } from '@/lib/blog-data'
import { JsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

  if (!post) {
    return {
      title: 'Artículo no encontrado | Nodo360',
    }
  }

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: `${baseUrl}/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: [post.author],
      images: [{ url: post.image || '/imagenes/og-blog.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.image || '/imagenes/og-blog.png'],
    },
    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
    },
  }
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Simple markdown-like rendering (headers, bold, lists, links, tables)
function renderContent(content: string): React.ReactElement {
  const lines = content.trim().split('\n')
  const elements: React.ReactElement[] = []
  let currentList: string[] = []
  let inTable = false
  let tableRows: string[][] = []
  let tableHeader: string[] = []

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-2 text-white/80 my-4 ml-4">
          {currentList.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInlineText(item) }} />
          ))}
        </ul>
      )
      currentList = []
    }
  }

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-6">
          <table className="min-w-full border border-white/10 rounded-lg overflow-hidden">
            {tableHeader.length > 0 && (
              <thead className="bg-white/5">
                <tr>
                  {tableHeader.map((cell, i) => (
                    <th key={i} className="px-4 py-3 text-left text-sm font-semibold text-white border-b border-white/10">
                      {cell.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-sm text-white/70 border-b border-white/5">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      tableRows = []
      tableHeader = []
      inTable = false
    }
  }

  const formatInlineText = (text: string): string => {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // Links
    text = text.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-brand-light hover:underline">$1</a>')
    return text
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Empty line
    if (!trimmedLine) {
      flushList()
      continue
    }

    // Table row
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      flushList()
      const cells = trimmedLine.slice(1, -1).split('|')

      // Check if it's a separator row (|---|---|)
      if (cells.every(cell => cell.trim().match(/^-+$/))) {
        continue
      }

      if (!inTable) {
        inTable = true
        tableHeader = cells
      } else {
        tableRows.push(cells)
      }
      continue
    } else if (inTable) {
      flushTable()
    }

    // Headers
    if (trimmedLine.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold text-white mt-10 mb-4">
          {trimmedLine.slice(3)}
        </h2>
      )
      continue
    }

    if (trimmedLine.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={`h3-${i}`} className="text-xl font-semibold text-white mt-8 mb-3">
          {trimmedLine.slice(4)}
        </h3>
      )
      continue
    }

    if (trimmedLine.startsWith('#### ')) {
      flushList()
      elements.push(
        <h4 key={`h4-${i}`} className="text-lg font-semibold text-white mt-6 mb-2">
          {trimmedLine.slice(5)}
        </h4>
      )
      continue
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmedLine)) {
      flushList()
      const listItem = trimmedLine.replace(/^\d+\.\s/, '')
      elements.push(
        <div key={`num-${i}`} className="flex gap-3 text-white/80 my-2 ml-4">
          <span className="text-brand-light font-semibold">{trimmedLine.match(/^\d+/)?.[0]}.</span>
          <span dangerouslySetInnerHTML={{ __html: formatInlineText(listItem) }} />
        </div>
      )
      continue
    }

    // Bullet list
    if (trimmedLine.startsWith('- ')) {
      currentList.push(trimmedLine.slice(2))
      continue
    }

    // Regular paragraph
    flushList()
    elements.push(
      <p
        key={`p-${i}`}
        className="text-white/80 leading-relaxed my-4"
        dangerouslySetInnerHTML={{ __html: formatInlineText(trimmedLine) }}
      />
    )
  }

  flushList()
  flushTable()

  return <>{elements}</>
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = getRelatedPosts(slug, 3)
  const category = blogCategories[post.category]
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

  // Article structured data
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.image || '/imagenes/og-blog.png',
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Nodo360',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/imagenes/logo-nodo360.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${post.slug}`,
    },
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Structured Data */}
      <JsonLd data={articleSchema} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', url: baseUrl },
          { name: 'Blog', url: `${baseUrl}/blog` },
          { name: post.title, url: `${baseUrl}/blog/${post.slug}` },
        ]}
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-brand/10 via-brand-light/5 to-transparent py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link href="/" className="hover:text-white transition">Inicio</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition">Blog</Link>
            <span>/</span>
            <span className="text-white/70 truncate">{post.title}</span>
          </nav>

          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al blog
          </Link>

          {/* Category */}
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${category.color}`}>
            {category.name}
          </span>

          {/* Title */}
          <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            {post.title}
          </h1>

          {/* Description */}
          <p className="mt-4 text-lg text-white/70 max-w-3xl">
            {post.description}
          </p>

          {/* Meta */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/50">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {post.readingTime} min de lectura
            </span>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-4">
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
          <Image
            src={post.image}
            alt={`Imagen principal del artículo: ${post.title}`}
            fill
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="prose prose-invert prose-lg max-w-none">
          {renderContent(post.content)}
        </div>

        {/* Keywords/Tags */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <h3 className="text-sm font-medium text-white/50 mb-3">Temas relacionados</h3>
          <div className="flex flex-wrap gap-2">
            {post.keywords.map((keyword) => (
              <span
                key={keyword}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/70"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </article>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-gradient-to-br from-brand/10 to-brand-light/5 border border-brand/20 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-brand-light/20 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-brand-light" />
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-white mb-2">
                ¿Quieres profundizar más?
              </h3>
              <p className="text-white/70">
                Explora nuestros cursos completos con ejercicios prácticos y certificados.
              </p>
            </div>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition whitespace-nowrap"
            >
              Ver Cursos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-white mb-6">Artículos relacionados</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((relatedPost) => {
              const relatedCategory = blogCategories[relatedPost.category]
              return (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="group block bg-dark-surface border border-white/10 rounded-xl p-6 hover:border-brand-light/50 transition-all"
                >
                  <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full border ${relatedCategory.color}`}>
                    {relatedCategory.name}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-white group-hover:text-brand-light transition line-clamp-2">
                    {relatedPost.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/60 line-clamp-2">
                    {relatedPost.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-brand-light text-sm font-medium">
                    Leer más
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
