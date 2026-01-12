import Link from 'next/link'
import { BookOpen, Layers, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type FeaturedCourse = {
  id: string
  title: string
  slug: string
  description: string | null
  total_modules: number | null
  total_lessons: number | null
}

async function getFeaturedCourses(): Promise<FeaturedCourse[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select('id, title, slug, description, total_modules, total_lessons')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    console.error('Error fetching featured courses:', error)
    return []
  }

  return data || []
}

export async function HomeFeaturedCourses() {
  const courses = await getFeaturedCourses()

  if (courses.length === 0) {
    return null
  }

  return (
    <section className="py-20 bg-dark-soft">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-wide text-brand-light font-medium mb-2">
            Cursos destacados
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Empieza tu formación hoy
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Cursos diseñados para llevarte de cero a experto en Bitcoin y Web3.
            Sin requisitos previos, solo ganas de aprender.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isComingSoon = (course.total_lessons ?? 0) === 0

            return (
              <Link
                key={course.id}
                href={`/cursos/${course.slug}`}
                className="group block"
              >
                <div className="relative overflow-hidden bg-dark-surface border border-white/10 rounded-2xl min-h-[280px] flex flex-col transition-all duration-150 hover:-translate-y-1 hover:border-white/20 hover:shadow-lg">
                  {/* Accent line */}
                  <div
                    className={`absolute inset-x-0 top-0 h-1 ${
                      isComingSoon ? 'bg-white/20' : 'bg-gradient-to-r from-brand-light to-brand'
                    }`}
                  />

                  {/* Coming soon badge */}
                  {isComingSoon && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60 z-10 border border-white/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                      Próximamente
                    </span>
                  )}

                  <div className="p-6 pt-8 flex-1 flex flex-col">
                    <h3 className="text-xl font-semibold text-white line-clamp-2 group-hover:text-brand-light transition-colors">
                      {course.title}
                    </h3>

                    {course.description && (
                      <p className="mt-3 text-sm text-white/60 line-clamp-3 flex-1">
                        {course.description}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="mt-4 flex items-center gap-4 text-xs text-white/50">
                      <span className="inline-flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        {course.total_modules ?? 0} módulos
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        {course.total_lessons ?? 0} lecciones
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <span className="inline-flex items-center text-sm font-medium text-brand-light group-hover:text-brand transition-colors">
                        Ver curso
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* View all CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/cursos"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-medium h-12 px-6 text-sm text-white bg-white/10 border border-white/20 hover:bg-white/15 transition-colors"
          >
            Ver todos los cursos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
