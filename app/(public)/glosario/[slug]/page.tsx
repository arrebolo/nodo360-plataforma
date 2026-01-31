import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { Footer } from '@/components/navigation/Footer'
import { JsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import {
  getTermBySlug,
  getAllTerms,
  getRelatedTerms,
  getAdjacentTerms,
  glossaryCategories,
} from '@/lib/glossary-data'
import type { Metadata } from 'next'

interface TermPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TermPageProps): Promise<Metadata> {
  const { slug } = await params
  const term = getTermBySlug(slug)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

  if (!term) {
    return {
      title: 'Término no encontrado | Glosario Nodo360',
    }
  }

  const title = `¿Qué es ${term.term}? Definición y Explicación | Glosario Nodo360`
  const description = term.definition

  return {
    title,
    description,
    keywords: [term.term.toLowerCase(), `qué es ${term.term.toLowerCase()}`, term.category, 'crypto', 'criptomonedas'],
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${baseUrl}/glosario/${term.slug}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/glosario/${term.slug}`,
    },
  }
}

export async function generateStaticParams() {
  const terms = getAllTerms()
  return terms.map((term) => ({
    slug: term.slug,
  }))
}

export default async function TermPage({ params }: TermPageProps) {
  const { slug } = await params
  const term = getTermBySlug(slug)

  if (!term) {
    notFound()
  }

  const category = glossaryCategories[term.category]
  const relatedTerms = getRelatedTerms(term.relatedTerms)
  const { prev, next } = getAdjacentTerms(slug)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

  // Schema.org DefinedTerm
  const definedTermSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    description: term.definition,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Glosario Crypto Nodo360',
      url: `${baseUrl}/glosario`,
    },
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Structured Data */}
      <JsonLd data={definedTermSchema} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', url: baseUrl },
          { name: 'Glosario', url: `${baseUrl}/glosario` },
          { name: term.term, url: `${baseUrl}/glosario/${term.slug}` },
        ]}
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-brand/10 via-brand-light/5 to-transparent py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link href="/" className="hover:text-white transition">Inicio</Link>
            <span>/</span>
            <Link href="/glosario" className="hover:text-white transition">Glosario</Link>
            <span>/</span>
            <span className="text-white/70">{term.term}</span>
          </nav>

          {/* Back link */}
          <Link
            href="/glosario"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al glosario
          </Link>

          {/* Category */}
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${category.color}`}>
            {category.name}
          </span>

          {/* Title */}
          <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            ¿Qué es {term.term}?
          </h1>

          {/* Definition */}
          <p className="mt-4 text-xl text-white/80 leading-relaxed">
            {term.definition}
          </p>
        </div>
      </div>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="prose prose-invert prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-white mb-6">Explicación detallada</h2>
          {term.explanation.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-white/80 leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Related Article */}
        {term.relatedArticle && (
          <div className="mt-8 p-6 bg-brand-light/10 border border-brand-light/30 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <BookOpen className="w-6 h-6 text-brand-light" />
              </div>
              <div>
                <p className="text-sm text-white/60 mb-1">Artículo relacionado</p>
                <Link
                  href={`/blog/${term.relatedArticle}`}
                  className="text-lg font-semibold text-white hover:text-brand-light transition"
                >
                  Leer artículo completo sobre {term.term} →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Related Terms */}
        {relatedTerms.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Términos relacionados</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedTerms.map((related) => {
                const relatedCategory = glossaryCategories[related.category]
                return (
                  <Link
                    key={related.slug}
                    href={`/glosario/${related.slug}`}
                    className="group p-4 bg-dark-surface border border-white/10 rounded-xl hover:border-brand-light/50 transition"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white group-hover:text-brand-light transition">
                        {related.term}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full border ${relatedCategory.color}`}>
                        {relatedCategory.name}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 line-clamp-2">
                      {related.definition}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
          {prev ? (
            <Link
              href={`/glosario/${prev.slug}`}
              className="flex items-center gap-2 text-white/60 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <div className="text-left">
                <p className="text-xs text-white/40">Anterior</p>
                <p className="font-medium">{prev.term}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {next ? (
            <Link
              href={`/glosario/${next.slug}`}
              className="flex items-center gap-2 text-white/60 hover:text-white transition"
            >
              <div className="text-right">
                <p className="text-xs text-white/40">Siguiente</p>
                <p className="font-medium">{next.term}</p>
              </div>
              <ChevronRight className="w-5 h-5" />
            </Link>
          ) : (
            <div />
          )}
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
                Aprende más sobre {category.name}
              </h3>
              <p className="text-white/70">
                Explora nuestros cursos y domina los conceptos de {category.name.toLowerCase()}.
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

      <Footer />
    </div>
  )
}
