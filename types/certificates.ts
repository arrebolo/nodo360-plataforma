export interface Certificate {
  id: string
  user_id: string
  course_id: string
  certificate_number: string
  issued_at: string
  verified_at: string | null
  pdf_url: string | null
  metadata: {
    user_name?: string
    course_title?: string
    instructor_name?: string
    total_lessons?: number
    completion_date?: string
  }
  created_at: string
}

export interface CertificateWithDetails extends Certificate {
  user_name: string
  user_email: string
  user_avatar: string | null
  course_title: string
  course_slug: string
  course_level: string
  course_thumbnail: string | null
  instructor_name: string | null
}
