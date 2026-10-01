import { notifyNewCourse } from '@/lib/discord/webhook'
import { broadcastNewCourse } from '@/lib/notifications/broadcast'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * EL ANUNCIO DE UN CURSO RECIEN PUBLICADO.
 *
 * Un solo sitio, porque publicar un curso se puede hacer por dos caminos y hacian
 * cosas distintas:
 *
 *   /admin/cursos/pendientes/[id]   aprobar  ->  anunciaba en Discord
 *   lib/admin/actions.ts            publicar ->  no anunciaba NADA
 *
 * Y en Telegram no se anunciaba por ninguno de los dos.
 *
 * DOS CANALES, DOS MENSAJES DISTINTOS, A PROPOSITO
 *   Discord lleva la tarjeta con portada, nivel y autor, por el webhook de anuncios.
 *   Telegram lleva el aviso corto al CANAL oficial (destino «oficial», que tras la
 *   #289 es TELEGRAM_CHANNEL_ID). No se mezclan ni se caen uno en el otro: si falta
 *   la variable de un destino, ese destino no publica y se registra.
 *
 * NO ES EL ANUNCIO DE UN LOGRO DE NADIE. Aqui no va el nombre de ningun alumno, asi
 * que no hay consentimiento que pedir: lo que se anuncia es que la plataforma tiene
 * un curso nuevo. El autor aparece porque firma el curso.
 *
 * NO BLOQUEA. Que falle un canal no puede dejar un curso sin publicar, y que falle
 * uno no impide el otro: van por separado y los dos resultados se registran.
 */
export async function anunciarCursoPublicado(courseId: string): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { data: curso, error } = await supabase
      .from('courses')
      .select(`
        id, title, slug, description, level, thumbnail_url,
        users!courses_instructor_id_fkey (
          full_name
        )
      `)
      .eq('id', courseId)
      .maybeSingle()

    if (error || !curso) {
      console.error('[anunciarCursoPublicado] No se pudo leer el curso:', courseId, error?.message)
      return
    }

    const autor = (curso.users as { full_name?: string | null } | null)?.full_name

    const resultados = await Promise.allSettled([
      // Discord: la tarjeta completa, por el webhook de anuncios.
      notifyNewCourse({
        title: curso.title,
        slug: curso.slug,
        description: curso.description,
        instructor_name: autor || 'Instructor Nodo360',
        level: curso.level,
        thumbnail_url: curso.thumbnail_url,
      }),
      // Telegram: el canal oficial. Sin in-app para todos y sin repetir Discord,
      // que ya ha ido arriba con su tarjeta.
      broadcastNewCourse(curso.title, curso.slug, {
        inApp: false,
        discord: false,
        telegram: true,
      }),
    ])

    console.log('📢 [anunciarCursoPublicado]', curso.slug, resultados.map((r) => r.status).join(', '))
  } catch (e) {
    console.error('[anunciarCursoPublicado] Error anunciando el curso:', e)
  }
}
