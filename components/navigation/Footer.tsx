'use client'

import Link from 'next/link'
import { brandConfig } from '@/lib/brand-config'
import { LogoLink } from '@/components/navigation/LogoLink'

export function Footer() {
  return (
    <footer className="mt-24 bg-dark border-t border-dark-border">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Columna 1: Marca */}
          <div className="md:col-span-1">
            <LogoLink className="flex items-center gap-3 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded-md">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-white font-bold text-xl">Nodo360</span>
            </LogoLink>
            <p className="text-sm text-white/60 leading-relaxed">
              Formación real en Bitcoin, Web3 y soberanía digital.
            </p>
          </div>

          {/* Columna 2: Aprendizaje */}
          <div>
            <p className="font-semibold text-white mb-4">Aprendizaje</p>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <Link
                  href="/dashboard/rutas"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded"
                >
                  Rutas de aprendizaje
                </Link>
              </li>
              <li>
                <Link
                  href="/cursos"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded"
                >
                  Cursos
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/certificados"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded"
                >
                  Certificados
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Comunidad */}
          <div>
            <p className="font-semibold text-white mb-4">Comunidad</p>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <Link
                  href="/comunidad"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded"
                >
                  Únete
                </Link>
              </li>
              <li>
                <Link
                  href="/mentoria"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded"
                >
                  Mentoría
                </Link>
              </li>
              <li>
                <a
                  href={brandConfig.social.discord}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 4: Filosofía */}
          <div>
            <p className="font-semibold text-white mb-4">Filosofía</p>
            <p className="text-sm text-white/60 leading-relaxed">
              Rutas de aprendizaje claras, sin humo.
              <br />
              Aprende paso a paso. Decide con conocimiento.
            </p>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-dark-border pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/50">
            <p>© {new Date().getFullYear()} Nodo360. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <Link
                href="/privacidad"
                className="hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded"
              >
                Privacidad
              </Link>
              <Link
                href="/terminos"
                className="hover:text-white/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded"
              >
                Términos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}


