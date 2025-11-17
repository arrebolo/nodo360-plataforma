/**
 * Filter Utilities
 *
 * Helper functions for filtering courses
 */

import type { Course, CourseFilters } from '@/types/database'

/**
 * Filter courses based on selected filters
 */
export function filterCourses(courses: Course[], filters: CourseFilters): Course[] {
  return courses.filter(course => {
    // Filtro de nivel
    if (filters.level !== 'all' && course.level !== filters.level) {
      return false
    }

    // Filtro de categoría
    if (filters.category !== 'all' && course.category !== filters.category) {
      return false
    }

    // Filtro de duración
    if (filters.duration !== 'all') {
      const hours = course.duration_hours
      const matchesDuration =
        (filters.duration === 'short' && hours < 5) ||
        (filters.duration === 'medium' && hours >= 5 && hours < 10) ||
        (filters.duration === 'long' && hours >= 10 && hours < 20) ||
        (filters.duration === 'very-long' && hours >= 20)

      if (!matchesDuration) return false
    }

    // Filtro de tipo (gratis/premium)
    if (filters.type !== 'all') {
      const isPremium = course.is_premium
      const matchesType =
        (filters.type === 'free' && !isPremium) ||
        (filters.type === 'premium' && isPremium)

      if (!matchesType) return false
    }

    return true
  })
}

/**
 * Get count of courses by filter categories
 */
export function getFilterCounts(courses: Course[]) {
  return {
    byLevel: {
      beginner: courses.filter(c => c.level === 'beginner').length,
      intermediate: courses.filter(c => c.level === 'intermediate').length,
      advanced: courses.filter(c => c.level === 'advanced').length,
    },
    byCategory: {
      bitcoin: courses.filter(c => c.category === 'bitcoin').length,
      blockchain: courses.filter(c => c.category === 'blockchain').length,
      defi: courses.filter(c => c.category === 'defi').length,
      nfts: courses.filter(c => c.category === 'nfts').length,
      development: courses.filter(c => c.category === 'development').length,
      trading: courses.filter(c => c.category === 'trading').length,
      other: courses.filter(c => c.category === 'other').length,
    },
    byDuration: {
      short: courses.filter(c => c.duration_hours < 5).length,
      medium: courses.filter(c => c.duration_hours >= 5 && c.duration_hours < 10).length,
      long: courses.filter(c => c.duration_hours >= 10 && c.duration_hours < 20).length,
      veryLong: courses.filter(c => c.duration_hours >= 20).length,
    },
    free: courses.filter(c => !c.is_premium).length,
    premium: courses.filter(c => c.is_premium).length,
  }
}

/**
 * Get label for filter value
 */
export function getFilterLabel(filterType: string, value: string): string {
  const labels: Record<string, Record<string, string>> = {
    level: {
      all: 'Todos',
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
    },
    category: {
      all: 'Todas',
      bitcoin: 'Bitcoin',
      blockchain: 'Blockchain',
      defi: 'DeFi',
      nfts: 'NFTs',
      development: 'Desarrollo',
      trading: 'Trading',
      other: 'Otros',
    },
    duration: {
      all: 'Todas',
      short: '<5h',
      medium: '5-10h',
      long: '10-20h',
      'very-long': '20h+',
    },
    type: {
      all: 'Todos',
      free: 'Gratis',
      premium: 'Premium',
    },
  }

  return labels[filterType]?.[value] || value
}

/**
 * Check if filters are active (not all set to 'all')
 */
export function hasActiveFilters(filters: CourseFilters): boolean {
  return (
    filters.level !== 'all' ||
    filters.category !== 'all' ||
    filters.duration !== 'all' ||
    filters.type !== 'all'
  )
}

/**
 * Reset all filters to default
 */
export function resetFilters(): CourseFilters {
  return {
    level: 'all',
    category: 'all',
    duration: 'all',
    type: 'all',
  }
}
