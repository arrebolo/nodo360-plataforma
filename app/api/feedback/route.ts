import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/ratelimit'

// Lazy initialization de Resend
let resendInstance: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Feedback API] RESEND_API_KEY no configurada, no se enviará email')
    return null
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

export async function POST(request: Request) {
  // Rate limiting (strict para feedback)
  const rateLimitResponse = await checkRateLimit(request, 'strict')
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { userId, userEmail, pageUrl, message } = await request.json()
    console.log('[Feedback API] Recibido:', { userId, userEmail, pageUrl, messageLength: message?.length })

    if (!message || !userEmail) {
      console.log('[Feedback API] Datos incompletos')
      return NextResponse.json(
        { error: 'Mensaje y email son requeridos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que el usuario esta autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('[Feedback API] Error de autenticación:', authError)
      return NextResponse.json(
        { error: 'Error de autenticación' },
        { status: 401 }
      )
    }

    if (!user) {
      console.log('[Feedback API] Usuario no autenticado')
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    console.log('[Feedback API] Usuario autenticado:', user.id)

    // Usar admin client para bypass RLS
    let supabaseAdmin
    try {
      supabaseAdmin = createAdminClient()
      console.log('[Feedback API] Admin client creado correctamente')
    } catch (adminError) {
      console.error('[Feedback API] ❌ Error creando admin client:', adminError)
      console.error('[Feedback API] ¿SUPABASE_SERVICE_ROLE_KEY está configurada?')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    // Datos a insertar
    const feedbackData = {
      user_id: userId || user.id,
      user_email: userEmail,
      page_url: pageUrl || null,
      message: message,
      status: 'pending'
    }
    console.log('[Feedback API] Insertando:', feedbackData)

    // Insertar feedback en base de datos
    const { data, error } = await supabaseAdmin
      .from('beta_feedback')
      .insert(feedbackData)
      .select()
      .single()

    if (error) {
      console.error('[Feedback API] ❌ Error al insertar:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })

      // Errores comunes
      if (error.code === '42P01') {
        console.error('[Feedback API] ❌ La tabla beta_feedback NO EXISTE')
      } else if (error.code === '23503') {
        console.error('[Feedback API] ❌ Error de foreign key - user_id inválido')
      } else if (error.code === '42501') {
        console.error('[Feedback API] ❌ Error de permisos RLS')
      }

      return NextResponse.json(
        { error: 'Error al guardar feedback', details: error.message, code: error.code },
        { status: 500 }
      )
    }

    console.log('[Feedback API] ✅ Feedback guardado:', data.id)

    // Enviar notificación por email
    const resend = getResend()
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Nodo360 <hola@nodo360.com>',
          to: 'arrebolo@gmail.com',
          replyTo: userEmail,
          subject: '🔔 Nuevo Feedback - Nodo360',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h2 style="color: #f7931a; margin-top: 0; border-bottom: 2px solid #f7931a; padding-bottom: 12px;">
                  🔔 Nuevo Feedback - Nodo360
                </h2>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr>
                    <td style="padding: 12px; background: #f9f9f9; border-bottom: 1px solid #eee; width: 120px; font-weight: bold; color: #666;">De:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${userEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background: #f9f9f9; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Página:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">
                      <a href="https://www.nodo360.com${pageUrl}" style="color: #f7931a;">${pageUrl || 'No especificada'}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; background: #f9f9f9; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Fecha:</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</td>
                  </tr>
                </table>

                <div style="background: #f9f9f9; border-left: 4px solid #f7931a; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; color: #333;">Mensaje:</p>
                  <p style="margin: 0; color: #555; white-space: pre-wrap; line-height: 1.6;">${message}</p>
                </div>

                <div style="text-align: center; margin-top: 24px;">
                  <a href="https://www.nodo360.com/admin/feedback"
                     style="display: inline-block; background: linear-gradient(to right, #ff6b35, #f7931a); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Ver en Admin Panel
                  </a>
                </div>

                <p style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center;">
                  ID: ${data.id} | Puedes responder directamente a este email
                </p>
              </div>
            </body>
            </html>
          `
        })
        console.log('[Feedback API] ✅ Email enviado a arrebolo@gmail.com')
      } catch (emailError) {
        // No fallar si el email no se envía, el feedback ya está guardado
        console.error('[Feedback API] ⚠️ Error enviando email (no crítico):', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      id: data.id
    })

  } catch (error) {
    console.error('[Feedback API] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}
