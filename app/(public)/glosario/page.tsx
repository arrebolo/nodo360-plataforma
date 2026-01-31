'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { Footer } from '@/components/navigation/Footer'
import {
  getAllTerms,
  getTermsGroupedByLetter,
  getAvailableLetters,
  glossaryCategories,
  type GlossaryTerm,
  type GlossaryCategory,
} from '@/lib/glossary-data'

function TermCard({ term, isExpanded, onToggle }: {
  term: GlossaryTerm
  isExpanded: boolean
  onToggle: () => void
}) {
  const category = glossaryCategories[term.category]

  return (
    <div className="bg-dark-surface border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left flex items-start justify-between gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="text-lg font-semibold text-white">
              {term.term}
            </h3>
            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${category.color}`}>
              {category.name}
            </span>
          </div>
          <p className="text-sm text-white/60 line-clamp-2">
            {term.definition}
          </p>
        </div>
        <div className="flex-shrink-0 mt-1">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/40" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/5">
          <div className="prose prose-invert prose-sm max-w-none mt-4">
            {term.explanation.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-white/70 text-sm leading-relaxed mb-3">
                {paragraph}
              </p>
            ))}
          </div>

          {term.relatedTerms.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-white/50 mb-2">Términos relacionados:</p>
              <div className="flex flex-wrap gap-2">
                {term.relatedTerms.slice(0, 5).map((slug) => (
                  <Link
                    key={slug}
                    href={`/glosario/${slug}`}
                    className="px-2.5 py-1 text-xs bg-white/5 border border-white/10 rounded-full text-white/70 hover:text-white hover:border-white/30 transition"
                  >
                    {slug.replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Link
              href={`/glosario/${term.slug}`}
              className="inline-flex items-center gap-1.5 text-sm text-brand-light hover:text-brand-light/80 transition"
            >
              Ver definición completa
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GlosarioPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<GlossaryCategory | 'all'>('all')
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)

  const allTerms = useMemo(() => getAllTerms(), [])
  const groupedTerms = useMemo(() => getTermsGroupedByLetter(), [])
  const availableLetters = useMemo(() => getAvailableLetters(), [])

  // Filtrar términos
  const filteredTerms = useMemo(() => {
    let terms = allTerms

    // Filtro por categoría
    if (selectedCategory !== 'all') {
      terms = terms.filter(t => t.category === selectedCategory)
    }

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      terms = terms.filter(t =>
        t.term.toLowerCase().includes(query) ||
        t.definition.toLowerCase().includes(query)
      )
    }

    return terms
  }, [allTerms, selectedCategory, searchQuery])

  // Agrupar términos filtrados por letra
  const filteredGrouped = useMemo(() => {
    const grouped: Record<string, GlossaryTerm[]> = {}
    for (const term of filteredTerms) {
      const letter = term.term[0].toUpperCase()
      if (!grouped[letter]) {
        grouped[letter] = []
      }
      grouped[letter].push(term)
    }
    return grouped
  }, [filteredTerms])

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <div className="bg-gradient-to-b from-brand/10 via-brand-light/5 to-transparent py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1.5 bg-brand-light/10 border border-brand-light/30 text-brand-light text-sm font-medium rounded-full mb-6">
              +50 Términos
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Glosario{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-brand">
                Crypto Completo
              </span>
            </h1>
            <p className="text-lg text-white/70">
              Todos los términos de Bitcoin, Blockchain, DeFi y Web3 explicados de forma clara.
              Tu diccionario crypto en español.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="sticky top-16 z-40 bg-dark/95 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar términos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/20 transition"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                selectedCategory === 'all'
                  ? 'bg-brand-light/20 text-brand-light border-brand-light/30'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              Todos ({allTerms.length})
            </button>
            {Object.entries(glossaryCategories).map(([key, category]) => {
              const count = allTerms.filter(t => t.category === key).length
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as GlossaryCategory)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    selectedCategory === key
                      ? category.color
                      : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
                  }`}
                >
                  {category.name} ({count})
                </button>
              )
            })}
          </div>

          {/* Alphabet Navigation */}
          <div className="flex flex-wrap gap-1">
            {availableLetters.map((letter) => {
              const hasTerms = filteredGrouped[letter]?.length > 0
              return (
                <button
                  key={letter}
                  onClick={() => hasTerms && scrollToLetter(letter)}
                  disabled={!hasTerms}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${
                    hasTerms
                      ? 'bg-white/5 text-white hover:bg-white/10'
                      : 'text-white/20 cursor-not-allowed'
                  }`}
                >
                  {letter}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Terms List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {filteredTerms.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No se encontraron términos.</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="mt-4 text-brand-light hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(filteredGrouped)
              .sort(([a], [b]) => a.localeCompare(b, 'es'))
              .map(([letter, terms]) => (
                <div key={letter} id={`letter-${letter}`} className="scroll-mt-48">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-brand-light/20 text-brand-light flex items-center justify-center">
                      {letter}
                    </span>
                    <span className="text-white/40 text-sm font-normal">
                      {terms.length} {terms.length === 1 ? 'término' : 'términos'}
                    </span>
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {terms.map((term) => (
                      <TermCard
                        key={term.slug}
                        term={term}
                        isExpanded={expandedSlug === term.slug}
                        onToggle={() => setExpandedSlug(
                          expandedSlug === term.slug ? null : term.slug
                        )}
                      />
                    ))}
                  </div>
                </div>
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
              href="/blog"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition"
            >
              Leer el Blog
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
