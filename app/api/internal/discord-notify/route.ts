/**
 * Internal API for Discord notifications
 * POST /api/internal/discord-notify
 *
 * Protected by INTERNAL_API_SECRET
 *
 * Tipos admitidos en el cuerpo:
 *   { type: 'new_course',    course_id }  anuncia un curso
 *   { type: 'new_blog_post', slug }       anuncia un articulo del blog
 *   { type: 'test' }                      prueba de humo del webhook
 *   { type: 'test', channel: 'news' }     prueba sobre el canal de noticias
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyNewCourse, notifyNewBlogPost, sendDiscordNotification } from '@/lib/discord/webhook'
import { getPostBySlug } from '@/lib/blog-data'

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

    if (type === 'new_blog_post') {
      const { slug } = body

      if (!slug) {
        return NextResponse.json({ error: 'slug requerido' }, { status: 400 })
      }

      // El blog no vive en la base de datos: son articulos estaticos en
      // lib/blog-data.ts. Se lee de ahi y se exige que el slug exista, para
      // que un slug mal escrito no acabe anunciando un enlace roto.
      const post = getPostBySlug(slug)

      if (!post) {
        console.error('❌ [Discord Notify API] Articulo no encontrado:', slug)
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }

      await notifyNewBlogPost({
        title: post.title,
        slug: post.slug,
        excerpt: post.description,
        category: post.category,
        reading_time: post.readingTime,
        image_url: post.image,
      })

      console.log('✅ [Discord Notify API] Notificacion enviada para articulo:', post.title)
      return NextResponse.json({ success: true, message: 'Notification sent' })
    }

    // Prueba de humo: comprueba que el webhook configurado responde, sin
    // anunciar nada que parezca contenido real. Util despues de rotar el
    // webhook, que es cuando interesa saber si sigue vivo.
    if (type === 'test') {
      const webhookUrl =
        body.channel === 'news'
          ? process.env.DISCORD_WEBHOOK_NEWS || process.env.DISCORD_WEBHOOK_ANNOUNCEMENTS
          : process.env.DISCORD_WEBHOOK_ANNOUNCEMENTS

      if (!webhookUrl) {
        return NextResponse.json({ error: 'Webhook no configurado' }, { status: 503 })
      }

      await sendDiscordNotification(webhookUrl, {
        title: '🔧 Prueba de conexion',
        description:
          'Mensaje de prueba de Nodo360. Si lo ves, el webhook funciona.\n' +
          'No corresponde a ningun curso ni articulo.',
        color: 10070709,
        footer: { text: 'Nodo360 - prueba tecnica' },
        timestamp: new Date().toISOString(),
      })

      console.log('✅ [Discord Notify API] Prueba enviada')
      return NextResponse.json({ success: true, message: 'Test notification sent' })
    }

    return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
  } catch (error) {
    console.error('❌ [Discord Notify API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
