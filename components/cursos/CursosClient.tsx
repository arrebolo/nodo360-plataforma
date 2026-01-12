'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { CourseWithInstructor } from '@/types/database'
import { Footer } from '@/components/navigation/Footer'
import { CourseCard } from '@/components/course/CourseCard'
import { BookOpen } from 'lucide-react'

interface CursosClientProps {
  allCourses: CourseWithInstructor[]
}

export function CursosClient({ allCourses }: CursosClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'free' | 'premium'>('all')

  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter === 'premium') {
      setActiveTab('premium')
    } else if (filter === 'free') {
      setActiveTab('free')
    } else {
      setActiveTab('all')
    }
  }, [searchParams])

  const filteredCourses = allCourses.filter((course) => {
    if (activeTab === 'free') return course.is_free
    if (activeTab === 'premium') return !course.is_free
    return true
  })

  const freeCourses = allCourses.filter((c) => c.is_free)
  const premiumCourses = allCourses.filter((c) => !c.is_free)

  const handleTabChange = (tab: 'all' | 'free' | 'premium') => {
    setActiveTab(tab)
    if (tab === 'all') {
      router.push('/cursos')
    } else {
      router.push(`/cursos?filter=${tab}`)
    }
  }

  const tabClasses = (isActive: boolean) =>
    `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
      isActive
        ? 'bg-brand-light text-white shadow-sm'
        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* HERO COMPACTO - DARK THEME */}
        <div className="bg-dark-surface border border-white/10 rounded-2xl p-6 sm:p-8">
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Cursos <span className="text-brand-light">disponibles</span>
            </h1>
            <p className="text-white/70 max-w-2xl">
              Cursos prácticos para avanzar paso a paso.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3 py-1 bg-white/5 text-white/70 text-sm rounded-full border border-white/10">
                Progreso guiado
              </span>
              <span className="px-3 py-1 bg-white/5 text-white/70 text-sm rounded-full border border-white/10">
                Certificados al completar
              </span>
            </div>
          </div>
        </div>

        {/* Tabs de filtro - DARK THEME con tokens brand */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTabChange('all')}
            className={tabClasses(activeTab === 'all')}
          >
            Todos ({allCourses.length})
          </button>
          <button
            onClick={() => handleTabChange('free')}
            className={tabClasses(activeTab === 'free')}
          >
            Gratuitos ({freeCourses.length})
          </button>
          <button
            onClick={() => handleTabChange('premium')}
            className={tabClasses(activeTab === 'premium')}
          >
            Premium ({premiumCourses.length})
          </button>
        </div>

        {/* SECCIÓN CURSOS */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Todos los cursos</h2>
            <p className="text-sm text-white/60 mt-1">
              {filteredCourses.length} cursos disponibles
            </p>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="bg-dark-surface border border-white/10 rounded-xl p-8 text-center">
              <BookOpen className="w-10 h-10 text-white/30 mx-auto mb-3" />
              <p className="text-white/60">No hay cursos disponibles en esta categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  slug={course.slug}
                  description={course.description ?? undefined}
                  thumbnailUrl={course.thumbnail_url ?? undefined}
                  modulesCount={course.total_modules || 0}
                  lessonsCount={course.total_lessons || 0}
                  isEnrolled={false}
                  isCompleted={false}
                  progressPercent={0}
                  isComingSoon={course.status === 'coming_soon'}
                  onView={() => router.push(`/cursos/${course.slug}`)}
                  onStart={() => router.push(`/cursos/${course.slug}`)}
                  onContinue={() => router.push(`/cursos/${course.slug}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
