import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { UserProgressWidgetProps } from '@/types/course-system'

export function UserProgressWidget({
  courseId,
  percent,
  nextLesson,
}: UserProgressWidgetProps) {
  return (
    <div className="bg-nodo-card border border-nodo-icon rounded-xl p-6 sticky top-6">
      {/* Progress Circle */}
      <div className="text-center mb-6">
        <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
          {/* Background circle */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#4b5563"
              strokeWidth="8"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(percent / 100) * 352} 352`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F7931A" />
                <stop offset="100%" stopColor="#FDB931" />
              </linearGradient>
            </defs>
          </svg>
          {/* Percentage text */}
          <div className="relative z-10">
            <div className="text-4xl font-bold text-white">{percent}%</div>
            <div className="text-sm text-gray-400">Completo</div>
          </div>
        </div>

        {percent === 100 && (
          <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium border border-emerald-500/20">
            ✓ Curso Completado
          </div>
        )}
      </div>

      {/* Next Lesson */}
      {nextLesson && percent < 100 && (
        <div className="pt-6 border-t border-nodo-icon">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Siguiente pendiente:
          </h3>
          <Link
            href={`/cursos/${courseId}/modulos/${nextLesson.moduleSlug}/lecciones/${nextLesson.lessonSlug}`}
            className="flex items-center gap-3 p-3 rounded-lg border border-nodo-icon hover:border-[#F7931A] hover:bg-nodo-bg transition-all group"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white line-clamp-2 group-hover:text-[#F7931A] transition-colors">
                {nextLesson.title}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#F7931A] flex-shrink-0" />
          </Link>
        </div>
      )}
    </div>
  )
}
