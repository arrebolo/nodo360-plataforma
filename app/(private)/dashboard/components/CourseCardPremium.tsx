'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import ProgressBar from './ProgressBar'

interface Course {
  id: string
  title: string
  slug: string
  thumbnail: string
  level: string
  progress: number
  totalLessons: number
  completedLessons: number
  lastLesson: string
}

interface CourseCardPremiumProps {
  course: Course
}

export default function CourseCardPremium({ course }: CourseCardPremiumProps) {
  const levelColors = {
    beginner: '🟢',
    intermediate: '🟡',
    advanced: '🔴'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-[#ff6b35]/50 transition-all"
    >
      <div className="flex flex-col md:flex-row">
        {/* Thumbnail */}
        <div className="relative w-full md:w-80 h-48 md:h-auto">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover"
          />
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
            {levelColors[course.level as keyof typeof levelColors] || '⚪'} {course.level}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 p-6">
          <h3 className="text-2xl font-bold mb-2">{course.title}</h3>

          {/* Progreso */}
          <div className="mb-4">
            <ProgressBar progress={course.progress} />
            <p className="text-sm text-white/60 mt-2">
              {course.completedLessons} de {course.totalLessons} lecciones completadas
            </p>
          </div>

          {/* Última lección */}
          <div className="mb-4">
            <p className="text-sm text-white/60 mb-1">🎬 Última lección:</p>
            <p className="text-white font-medium">{course.lastLesson}</p>
          </div>

          {/* Botón continuar */}
          <Link href={`/cursos/${course.slug}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full md:w-auto bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all"
            >
              ▶ Continuar Lección
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
