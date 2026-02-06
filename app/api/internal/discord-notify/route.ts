/**
 * Internal API for Discord notifications
 * POST /api/internal/discord-notify
 *
 * Protected by INTERNAL_API_SECRET
 * Called after course publication to notify Discord
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyNewCourse } from '@/lib/discord/webhook'

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET

export async function POST(request: NextRequest) {
  console.log('🔍 [Discord Notify API] Recibiendo solicitud...')

  // Verify internal secret
  const authHeader = request.headers.get('Authorization')
  const providedSecret = authHeader?.replace('Bearer ', '')

  if (!INTERNAL_SECRET || providedSecret !== INTERNAL_SECRET) {
    console.error('❌ [Discord Notify API] Autorizacion fallida')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, course_id } = body

    if (type === 'new_course' && course_id) {
      console.log('🔍 [Discord Notify API] Procesando notificacion de nuevo curso:', course_id)

      // Fetch course data with instructor info
      const supabase = createAdminClient()
      const { data: course, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          slug,
          description,
          level,
          thumbnail_url,
          instructor_id,
          users!courses_instructor_id_fkey (
            full_name
          )
        `)
        .eq('id', course_id)
        .single()

      if (error || !course) {
        console.error('❌ [Discord Notify API] Curso no encontrado:', error)
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }

      const instructorName = (course.users as any)?.full_name || 'Instructor Nodo360'

      // Send Discord notification
      await notifyNewCourse({
        title: course.title,
        slug: course.slug,
        description: course.description,
        instructor_name: instructorName,
        level: course.level,
        thumbnail_url: course.thumbnail_url,
      })

      console.log('✅ [Discord Notify API] Notificacion enviada para curso:', course.title)
      return NextResponse.json({ success: true, message: 'Notification sent' })
    }

    return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
  } catch (error) {
    console.error('❌ [Discord Notify API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
