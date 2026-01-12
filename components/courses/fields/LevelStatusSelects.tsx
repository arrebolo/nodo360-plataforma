'use client'

import { COURSE_LEVELS, COURSE_STATUSES, type CourseLevel, type CourseStatus } from '@/lib/courses/course-utils'

interface LevelStatusSelectsProps {
  level: CourseLevel
  status: CourseStatus
  onLevelChange: (value: CourseLevel) => void
  onStatusChange: (value: CourseStatus) => void
  errors?: {
    level?: string
    status?: string
  }
}

export function LevelStatusSelects({
  level,
  status,
  onLevelChange,
  onStatusChange,
  errors,
}: LevelStatusSelectsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      {/* Level */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Nivel *
        </label>
        <select
          name="level"
          required
          value={level}
          onChange={(e) => onLevelChange(e.target.value as CourseLevel)}
          className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-lg text-white focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/20 transition cursor-pointer"
          style={{ colorScheme: 'dark' }}
        >
          {COURSE_LEVELS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0d1117] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {errors?.level && <p className="mt-2 text-sm text-red-400">{errors.level}</p>}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Estado *
        </label>
        <select
          name="status"
          required
          value={status}
          onChange={(e) => onStatusChange(e.target.value as CourseStatus)}
          className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-lg text-white focus:border-brand-light/50 focus:ring-2 focus:ring-brand-light/20 transition cursor-pointer"
          style={{ colorScheme: 'dark' }}
        >
          {COURSE_STATUSES.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#0d1117] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {errors?.status && <p className="mt-2 text-sm text-red-400">{errors.status}</p>}
      </div>
    </div>
  )
}
