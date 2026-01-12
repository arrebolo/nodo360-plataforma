'use client'

import React from 'react'

type LessonShellProps = {
  course?: {
    id: string
    slug: string
    title?: string | null
  }
  lesson: {
    title: string
    description?: string | null
  }
  children: React.ReactNode
}

export default function LessonShell({ lesson, children }: LessonShellProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* ===== Header de la lección ===== */}
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold text-white">
          {lesson.title}
        </h1>

        {lesson.description && (
          <p className="text-white/60 max-w-3xl">
            {lesson.description}
          </p>
        )}
      </header>

      {/* ===== Contenido principal ===== */}
      <section className="w-full">
        {children}
      </section>
    </div>
  )
}


