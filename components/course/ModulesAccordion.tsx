'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Play, Lock, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Lesson {
  id: string
  slug: string
  title: string
  order_index: number
  video_duration_minutes?: number | null
  is_free_preview?: boolean
}

interface Module {
  id: string
  slug: string
  title: string
  description?: string | null
  order_index: number
  lessons: Lesson[]
}

interface ModulesAccordionProps {
  courseSlug: string
  modules: Module[]
  className?: string
}

export default function ModulesAccordion({ courseSlug, modules, className = '' }: ModulesAccordionProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set([modules[0]?.id]))

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  const formatDuration = (minutes: number | null | undefined): string => {
    if (!minutes) return '--'
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {modules.map((module, moduleIndex) => {
        const isExpanded = expandedModules.has(module.id)
        const totalDuration = module.lessons.reduce(
          (sum, lesson) => sum + (lesson.video_duration_minutes || 0),
          0
        )

        return (
          <div
            key={module.id}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
          >
            {/* Module Header */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {moduleIndex + 1}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white mb-1">{module.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <span>{module.lessons.length} lecciones</span>
                    {totalDuration > 0 && <span>• {formatDuration(totalDuration)}</span>}
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-white/60" />
              </motion.div>
            </button>

            {/* Module Description */}
            {module.description && isExpanded && (
              <div className="px-6 pb-2">
                <p className="text-sm text-white/60">{module.description}</p>
              </div>
            )}

            {/* Lessons List */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="border-t border-white/10">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isPreview = lesson.is_free_preview
                      const lessonUrl = `/cursos/${courseSlug}/${lesson.slug}`

                      return (
                        <Link
                          key={lesson.id}
                          href={lessonUrl}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors group border-b border-white/5 last:border-b-0"
                        >
                          {/* Lesson Number/Icon */}
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60 text-sm font-medium flex-shrink-0 group-hover:bg-white/10 transition-colors">
                            {lessonIndex + 1}
                          </div>

                          {/* Lesson Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-medium group-hover:text-[#ff6b35] transition-colors truncate">
                                {lesson.title}
                              </h4>
                              {isPreview && (
                                <span className="px-2 py-0.5 bg-[#4caf50]/20 text-[#4caf50] text-xs rounded-full font-medium flex-shrink-0">
                                  <Eye className="w-3 h-3 inline mr-1" />
                                  Vista previa
                                </span>
                              )}
                            </div>
                            {lesson.video_duration_minutes && (
                              <p className="text-sm text-white/50">
                                {formatDuration(lesson.video_duration_minutes)}
                              </p>
                            )}
                          </div>

                          {/* Play Icon */}
                          <div className="flex-shrink-0">
                            {isPreview ? (
                              <Play className="w-5 h-5 text-[#4caf50]" />
                            ) : (
                              <Play className="w-5 h-5 text-white/40 group-hover:text-[#ff6b35] transition-colors" />
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
