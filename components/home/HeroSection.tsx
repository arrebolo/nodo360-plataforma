'use client'

import Link from 'next/link'
import { ArrowRight, Users, BookOpen, Sparkles } from 'lucide-react'
import { Logo } from '@/components/common'

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff6b35]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column: Content */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-[#ff6b35]/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-[#FFD700]" />
              <span className="text-sm text-white/90">La plataforma educativa #1 en español</span>
            </div>

            {/* Logo mobile */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="relative">
                <Logo
                  size="md"
                  priority
                  imageClassName="animate-fade-in drop-shadow-[0_0_25px_rgba(255,107,53,0.3)]"
                />
                {/* Glow effect mobile */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b35]/20 to-[#FFD700]/20 blur-xl -z-10" />
              </div>
            </div>

            {/* Main heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
                Domina{' '}
                <span className="bg-gradient-to-r from-[#ff6b35] to-[#f7931a] bg-clip-text text-transparent">
                  Bitcoin
                </span>
                {' '}y{' '}
                <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                  Blockchain
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-white/70 max-w-2xl">
                La plataforma educativa más completa en español. Aprende desde cero o especialízate en Web3.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/cursos?filter=gratis"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-xl text-white font-semibold text-lg hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all duration-300 hover:scale-105"
              >
                Explorar Cursos Gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/cursos?filter=premium"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-xl text-black font-semibold text-lg hover:shadow-lg hover:shadow-[#FFD700]/50 transition-all duration-300 hover:scale-105"
              >
                Ver Cursos Premium
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Users className="w-5 h-5 text-[#ff6b35]" />
                  <div className="text-3xl font-bold text-white">5K+</div>
                </div>
                <div className="text-sm text-white/60">Estudiantes</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <BookOpen className="w-5 h-5 text-[#FFD700]" />
                  <div className="text-3xl font-bold text-white">25+</div>
                </div>
                <div className="text-sm text-white/60">Cursos</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-[#f7931a]" />
                  <div className="text-3xl font-bold text-white">50+</div>
                </div>
                <div className="text-sm text-white/60">Horas</div>
              </div>
            </div>
          </div>

          {/* Right column: Visual */}
          <div className="relative hidden lg:block animate-fade-in-delayed">
            <div className="relative">
              {/* Logo real de Nodo360 */}
              <div className="relative z-10 rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm p-12 flex items-center justify-center min-h-[400px]">
                <div className="relative">
                  <Logo
                    size="xl"
                    priority
                    imageClassName="animate-fade-in drop-shadow-[0_0_30px_rgba(255,107,53,0.3)]"
                  />
                  {/* Glow effect adicional */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b35]/20 to-[#FFD700]/20 blur-2xl -z-10" />
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-[#ff6b35] to-[#f7931a] rounded-2xl rotate-12 blur-xl opacity-50 animate-pulse" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-2xl -rotate-12 blur-xl opacity-50 animate-pulse delay-500" />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
