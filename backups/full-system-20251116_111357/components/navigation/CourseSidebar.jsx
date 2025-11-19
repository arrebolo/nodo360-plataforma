'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function CourseSidebar({ courseData, userProgress = {}, className = '' }) {
  const [expandedModules, setExpandedModules] = useState([0]) // Primer módulo expandido por defecto
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  if (!courseData || !courseData.modules) {
    return null
  }

  const toggleModule = (moduleIndex) => {
    setExpandedModules(prev => 
      prev.includes(moduleIndex)
        ? prev.filter(i => i !== moduleIndex)
        : [...prev, moduleIndex]
    )
  }

  const isLessonCompleted = (lessonId) => {
    return userProgress.completedLessons?.includes(lessonId) || false
  }

  const isLessonCurrent = (lessonPath) => {
    return pathname === lessonPath
  }

  const calculateProgress = () => {
    const totalLessons = courseData.modules.reduce(
      (acc, module) => acc + (module.lessons?.length || 0), 
      0
    )
    const completedLessons = userProgress.completedLessons?.length || 0
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Course Header */}
      <div className="p-6 border-b border-nodo-border">
        <Link 
          href={`/cursos/${courseData.slug}`}
          className="group"
        >
          <h2 className="text-lg font-bold text-white group-hover:text-red-600 transition-colors line-clamp-2">
            {courseData.title}
          </h2>
        </Link>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Progreso</span>
            <span className="text-red-600 font-semibold">{calculateProgress()}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-red-600 h-full transition-all duration-500"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="flex-1 overflow-y-auto">
        {courseData.modules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.includes(moduleIndex)
          const completedLessons = module.lessons?.filter(lesson => 
            isLessonCompleted(lesson.id)
          ).length || 0
          const totalLessons = module.lessons?.length || 0
          const moduleProgress = totalLessons > 0 
            ? Math.round((completedLessons / totalLessons) * 100) 
            : 0

          return (
            <div key={moduleIndex} className="border-b border-nodo-border">
              {/* Module Header */}
              <button
                onClick={() => toggleModule(moduleIndex)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-nodo-dark/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      Módulo {moduleIndex + 1}
                    </span>
                    {moduleProgress === 100 && (
                      <span className="text-green-500 text-xs">✓</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white truncate">
                    {module.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span>{completedLessons}/{totalLessons} lecciones</span>
                    {moduleProgress > 0 && (
                      <span className="text-red-600">· {moduleProgress}%</span>
                    )}
                  </div>
                </div>
                
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Lessons List */}
              {isExpanded && module.lessons && (
                <ul className="bg-nodo-dark/30">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const lessonPath = `/cursos/${courseData.slug}/${module.slug}/${lesson.slug}`
                    const isCurrent = isLessonCurrent(lessonPath)
                    const isCompleted = isLessonCompleted(lesson.id)

                    return (
                      <li key={lesson.id}>
                        <Link
                          href={lessonPath}
                          className={`block px-6 py-3 pl-12 hover:bg-nodo-dark transition-colors border-l-4 ${
                            isCurrent
                              ? 'border-red-600 bg-nodo-dark'
                              : 'border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Status Icon */}
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : isCurrent ? (
                                <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                              )}
                            </div>

                            {/* Lesson Info */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${
                                isCurrent ? 'text-white font-semibold' : 'text-gray-300'
                              }`}>
                                {lessonIndex + 1}. {lesson.title}
                              </p>
                              {lesson.duration && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {lesson.duration}
                                </p>
                              )}
                            </div>

                            {/* Current Indicator */}
                            {isCurrent && (
                              <div className="flex-shrink-0">
                                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        aria-label="Abrir menú de curso"
      >
        <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block w-80 bg-black border-r border-nodo-border ${className}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/80"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Drawer */}
          <aside className="absolute top-0 left-0 bottom-0 w-80 bg-black border-r border-nodo-border animate-slide-in">
            {/* Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar menú"
            >
              <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
