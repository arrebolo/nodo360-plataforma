'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface CourseHeroProps {
  course: {
    id: string
    slug: string
    title: string
    description: string | null
    level: string
    is_free: boolean
    banner_url?: string | null
    thumbnail_url?: string | null
    total_duration_minutes?: number | null
  }
  stats: {
    modules: number
    lessons: number
    duration: number
  }
  isEnrolled?: boolean
  firstLessonUrl?: string
}

export default function CourseHero({ course, stats, isEnrolled, firstLessonUrl }: CourseHeroProps) {
  const levelConfig = {
    beginner: { emoji: '🟢', label: 'Principiante', color: 'bg-[#4caf50]/20 text-[#4caf50]' },
    intermediate: { emoji: '🟡', label: 'Intermedio', color: 'bg-[#ff6b35]/20 text-[#ff6b35]' },
    advanced: { emoji: '🔴', label: 'Avanzado', color: 'bg-red-500/20 text-red-400' },
  }

  const level = levelConfig[course.level as keyof typeof levelConfig] || levelConfig.beginner

  return (
    <section className="bg-gradient-to-r from-[#1a1f2e] to-[#252b3d] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Course Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
              <Link href="/cursos" className="hover:text-white transition">
                Cursos
              </Link>
              <span>/</span>
              <span className="text-white/70">{course.title}</span>
            </nav>

            {/* Level & Free Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${level.color}`}>
                {level.emoji} {level.label}
              </span>
              {course.is_free && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#4caf50]/20 text-[#4caf50]">
                  100% GRATIS
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              {course.title}
            </h1>

            {/* Description */}
            {course.description && (
              <p className="text-xl text-white/70 mb-8">
                {course.description}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.modules}
                </div>
                <div className="text-sm text-white/50">Módulos</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.lessons}
                </div>
                <div className="text-sm text-white/50">Lecciones</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.duration > 0 ? `${stats.duration}h` : '--'}
                </div>
                <div className="text-sm text-white/50">Duración</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                href={firstLessonUrl || '#'}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#ff6b35]/20 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isEnrolled ? 'Continuar curso' : 'Comenzar curso'}
              </Link>
            </div>
          </motion.div>

          {/* Right: Thumbnail */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-[#ff6b35]/20 to-[#f7931a]/20 border border-white/10">
              {course.banner_url || course.thumbnail_url ? (
                <img
                  src={course.banner_url || course.thumbnail_url!}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center p-12">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center mb-6">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
