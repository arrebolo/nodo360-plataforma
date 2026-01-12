import Link from 'next/link'
import Image from 'next/image'
import { brandConfig } from '@/lib/brand-config'

export function HomeFooter() {
  return (
    <footer className="bg-dark border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Columna 1: Marca */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
                <Image
                  src={brandConfig.logo.url}
                  alt={brandConfig.logo.alt}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="text-white font-bold text-xl">
                {brandConfig.name}
              </span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed">
              {brandConfig.description}
            </p>
          </div>

          {/* Columna 2: Aprendizaje */}
          <div>
            <p className="font-semibold text-white mb-4">Aprendizaje</p>
            <ul className="space-y-3 text-sm text-white/60">
              <li>
                <Link
                  href="/cursos"
                  className="hover:text-white transition-colors"
                >
                  Cursos
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/rutas"
                  className="hover:text-white transition-colors"
                >
                  Rutas de aprendizaje
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/certificados"
                  className="hover:text-white transition-colors"
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
                  className="hover:text-white transition-colors"
                >
                  Únete
                </Link>
              </li>
              <li>
                <Link
                  href="/mentoria"
                  className="hover:text-white transition-colors"
                >
                  Mentoría
                </Link>
              </li>
              <li>
                <a
                  href={brandConfig.social.discord}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href={brandConfig.social.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Twitter
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 4: Filosofía */}
          <div>
            <p className="font-semibold text-white mb-4">Nuestra filosofía</p>
            <p className="text-sm text-white/60 leading-relaxed">
              Formación real en Bitcoin, Web3 y soberanía digital.
              <br />
              <br />
              Rutas de aprendizaje claras, sin humo. Aprende paso a paso.
              Decide con conocimiento.
            </p>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/50">
            <p>
              © {new Date().getFullYear()} {brandConfig.name}. Todos los
              derechos reservados.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacidad"
                className="hover:text-white/80 transition-colors"
              >
                Privacidad
              </Link>
              <Link
                href="/terminos"
                className="hover:text-white/80 transition-colors"
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
