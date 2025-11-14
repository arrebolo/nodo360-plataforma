'use client'

import Link from 'next/link'
import { BookOpen, Star, ArrowRight } from 'lucide-react'
import type { Course } from '@/types/database'

interface CourseGridProps {
  courses: Course[]
  isPremium?: boolean
}

export function CourseGrid({ courses, isPremium = false }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">No hay cursos disponibles en este momento.</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course, index) => (
        <Link
          key={course.id}
          href={`/cursos/${course.slug}`}
          className="group block"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="h-full bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-[#ff6b35]/70 transition-all duration-300 hover:shadow-2xl hover:shadow-[#ff6b35]/30 hover:-translate-y-2 hover:scale-[1.02]">
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#252b3d] to-[#1a1f2e]">
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={`https://placehold.co/600x400/1a1f2e/ffffff?text=${encodeURIComponent(course.title.substring(0, 20))}`}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Badge */}
              <div className="absolute top-4 right-4">
                {isPremium ? (
                  <div className="px-4 py-1.5 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full text-black text-sm font-bold uppercase shadow-lg animate-pulse">
                    Premium
                  </div>
                ) : (
                  <div className="px-4 py-1.5 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] rounded-full text-white text-sm font-bold uppercase shadow-lg">
                    GRATIS
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <h3 className="text-xl font-bold text-white group-hover:text-[#ff6b35] transition-all duration-300 line-clamp-2">
                {course.title}
              </h3>

              {/* Description */}
              <p className="text-white/60 text-sm line-clamp-3">
                {course.description || 'Aprende los fundamentos esenciales de este tema.'}
              </p>

              {/* Instructor */}
              <div className="flex items-center gap-2 text-sm text-white/50">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white text-xs font-bold">
                  N
                </div>
                <span>Nodo360</span>
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-4 text-sm text-white/50">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>Múltiples lecciones</span>
                </div>
                {isPremium && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                    <span>4.8</span>
                  </div>
                )}
              </div>

              {/* Premium features */}
              {isPremium && (
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <span className="text-[#FFD700]">✓</span>
                    <span>Certificado de finalización</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <span className="text-[#FFD700]">✓</span>
                    <span>Mentoría personalizada</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <span className="text-[#FFD700]">✓</span>
                    <span>Comunidad Premium exclusiva</span>
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="pt-2">
                {isPremium ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">€99</div>
                      <div className="text-xs text-white/50">o €49/mes</div>
                    </div>
                    <div className="flex items-center gap-2 text-[#FFD700] font-semibold group-hover:gap-3 transition-all">
                      Ver detalles
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[#ff6b35] font-semibold">
                    <span>Empezar ahora</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
