'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { X, Award, BookOpen, Users, Star, ExternalLink } from 'lucide-react'

interface InstructorPreviewModalProps {
  instructorId: string
  isOpen: boolean
  onClose: () => void
  position?: { x: number; y: number }
}

interface InstructorData {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  headline: string | null
  is_verified: boolean
  total_courses: number
  total_students: number
  average_rating: number | null
  total_reviews: number
}

export function InstructorPreviewModal({
  instructorId,
  isOpen,
  onClose,
  position,
}: InstructorPreviewModalProps) {
  const [instructor, setInstructor] = useState<InstructorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 })

  // Fetch instructor data
  useEffect(() => {
    if (!isOpen || !instructorId) return

    const fetchInstructor = async () => {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      // Get user data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, bio, role')
        .eq('id', instructorId)
        .single()

      if (userError || !user) {
        setError('No se pudo cargar el perfil')
        setLoading(false)
        return
      }

      // Get course count for this instructor
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)
        .eq('status', 'published')

      // Get total enrolled students across all courses
      const { data: enrollmentData } = await supabase
        .from('courses')
        .select('enrolled_count')
        .eq('instructor_id', instructorId)
        .eq('status', 'published')

      const totalStudents = enrollmentData?.reduce((acc, course) => acc + (course.enrolled_count || 0), 0) || 0

      setInstructor({
        id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        headline: user.role === 'instructor' ? 'Instructor' : user.role === 'mentor' ? 'Mentor' : null,
        is_verified: user.role === 'instructor' || user.role === 'mentor',
        total_courses: coursesCount || 0,
        total_students: totalStudents,
        average_rating: null,
        total_reviews: 0,
      })

      setLoading(false)
    }

    fetchInstructor()
  }, [isOpen, instructorId])

  // Calculate modal position
  useEffect(() => {
    if (!isOpen || !position || !modalRef.current) return

    const modalWidth = 320
    const modalHeight = 280
    const padding = 16
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = position.x
    let top = position.y + 10

    // Adjust if overflowing right
    if (left + modalWidth > viewportWidth - padding) {
      left = viewportWidth - modalWidth - padding
    }

    // Adjust if overflowing left
    if (left < padding) {
      left = padding
    }

    // Adjust if overflowing bottom
    if (top + modalHeight > viewportHeight - padding) {
      top = position.y - modalHeight - 10
    }

    // Adjust if overflowing top
    if (top < padding) {
      top = padding
    }

    setModalPosition({ top, left })
  }, [isOpen, position])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Delay adding listener to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      className="fixed z-50 w-80 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        top: modalPosition.top,
        left: modalPosition.left,
      }}
    >
      <div className="rounded-xl bg-[#0a0f1a]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors z-10"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {loading ? (
          <div className="p-6 flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : instructor ? (
          <>
            {/* Header with gradient */}
            <div className="relative h-16 bg-gradient-to-r from-orange-500/20 to-amber-500/10" />

            {/* Content */}
            <div className="px-5 pb-5 -mt-8 relative">
              {/* Avatar */}
              <div className="relative inline-block mb-3">
                {instructor.avatar_url ? (
                  <Image
                    src={instructor.avatar_url}
                    alt={instructor.full_name || 'Instructor'}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover border-4 border-[#0a0f1a]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center border-4 border-[#0a0f1a]">
                    <span className="text-2xl font-bold text-white">
                      {instructor.full_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                {instructor.is_verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#0a0f1a]">
                    <Award className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Name and headline */}
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  {instructor.full_name || 'Instructor'}
                </h3>
                {instructor.headline && (
                  <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                    {instructor.headline}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>{instructor.total_courses} cursos</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-green-400" />
                  <span>{instructor.total_students.toLocaleString()}</span>
                </div>
                {instructor.total_reviews > 0 && instructor.average_rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span>{instructor.average_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <Link
                href={`/instructores/${instructor.id}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                onClick={onClose}
              >
                Ver perfil completo
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

// Hook to manage the modal state
export function useInstructorPreview() {
  const [isOpen, setIsOpen] = useState(false)
  const [instructorId, setInstructorId] = useState<string | null>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | undefined>()

  const openPreview = (id: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setInstructorId(id)
    setPosition({ x: event.clientX, y: event.clientY })
    setIsOpen(true)
  }

  const closePreview = () => {
    setIsOpen(false)
    setInstructorId(null)
    setPosition(undefined)
  }

  return {
    isOpen,
    instructorId,
    position,
    openPreview,
    closePreview,
  }
}
