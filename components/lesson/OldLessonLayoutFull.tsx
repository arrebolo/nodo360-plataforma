'use client'

import Link from 'next/link'
import type { Lesson } from '@/types/database'

interface OldLessonLayoutFullProps {
  lesson: Lesson & {
    module: {
      id: string
      title: string
      course: {
        id: string
        title: string
        slug: string
      }
    }
  }
  courseSlug: string
  previousLesson?: {slug: string; title: string} | null
  nextLesson?: {slug: string; title: string} | null
}

export function OldLessonLayoutFull({
  lesson,
  courseSlug,
  previousLesson,
  nextLesson,
}: OldLessonLayoutFullProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1a1f2e]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-white font-bold text-xl">NODO360</span>
            </Link>
            <Link
              href={`/cursos/${courseSlug}`}
              className="text-white/70 hover:text-white transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al curso
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b border-white/10 bg-[#1a1f2e]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-white/50">
            <Link href="/cursos" className="hover:text-white transition">
              Cursos
            </Link>
            <span>/</span>
            <Link href={`/cursos/${courseSlug}`} className="hover:text-white transition">
              {lesson.modules.courses.title}
            </Link>
            <span>/</span>
            <span className="text-white/70 truncate">{lesson.modules.title}</span>
            <span>/</span>
            <span className="text-white truncate">{lesson.title}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Lesson Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b35]/20 text-[#ff6b35] text-sm font-medium mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {lesson.modules.title}
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="text-xl text-white/70">
                {lesson.description}
              </p>
            )}
          </div>

          {/* Video Player (if video_url exists) */}
          {lesson.video_url && (
            <div className="mb-12">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden">
                <iframe
                  src={lesson.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {lesson.video_duration_minutes > 0 && (
                <div className="flex items-center gap-2 mt-4 text-white/50 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Duración: {lesson.video_duration_minutes} minutos</span>
                </div>
              )}
            </div>
          )}

          {/* Lesson Content */}
          <div className="prose prose-invert prose-lg max-w-none mb-12">
            <div
              className="text-white/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: lesson.content || '' }}
            />
          </div>

          {/* Attachments */}
          {lesson.attachments && Array.isArray(lesson.attachments) && lesson.attachments.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">Recursos adicionales</h2>
              <div className="grid gap-3">
                {lesson.attachments.map((attachment: any, index: number) => (
                  <a
                    key={index}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:border-[#ff6b35]/50 hover:bg-white/10 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#ff6b35]/20 flex items-center justify-center group-hover:bg-[#ff6b35]/30 transition">
                      {attachment.type === 'pdf' && (
                        <svg className="w-5 h-5 text-[#ff6b35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                      {attachment.type === 'link' && (
                        <svg className="w-5 h-5 text-[#ff6b35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      )}
                      {!['pdf', 'link'].includes(attachment.type) && (
                        <svg className="w-5 h-5 text-[#ff6b35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium group-hover:text-[#ff6b35] transition">
                        {attachment.name}
                      </div>
                      {attachment.size && (
                        <div className="text-xs text-white/40 mt-1">
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-white/30 group-hover:text-[#ff6b35] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between py-8 border-t border-white/10">
            <div className="flex-1">
              {previousLesson && (
                <Link
                  href={`/cursos/${courseSlug}/${previousLesson.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-white group"
                >
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-white/50">Anterior</div>
                    <div className="font-medium truncate max-w-[200px]">{previousLesson.title}</div>
                  </div>
                </Link>
              )}
            </div>

            <div className="flex-1 flex justify-end">
              {nextLesson && (
                <Link
                  href={`/cursos/${courseSlug}/${nextLesson.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] hover:shadow-lg hover:shadow-[#ff6b35]/20 rounded-lg transition-all text-white group"
                >
                  <div className="text-right">
                    <div className="text-xs text-white/90">Siguiente</div>
                    <div className="font-medium truncate max-w-[200px]">{nextLesson.title}</div>
                  </div>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
