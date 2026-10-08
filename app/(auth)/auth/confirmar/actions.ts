'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { codigoParaLaUrl } from '@/lib/auth/error-messages'
import { destinoTrasEntrar, metodoDeRegistro } from '@/lib/auth/tras-verificar'
import { destinoInterno } from '@/lib/navegacion/destino-interno'
import { esTipoDeEnlace } from './tipos'

/**
 * Verifica el enlace del correo: el botón de /auth/confirmar.
 *
 * Es un POST a propósito. El GET de la página no toca Supabase, así que un
 * escáner de correo que abra el enlace al recibirlo no lo gasta; el enlace se
 * gasta aquí, cuando una persona pulsa el botón.
 *
 * verifyOtp con token_hash no necesita nada del navegador que pidió el correo
 * (el `code` de PKCE sí: el code_verifier vive en una cookie de ese navegador), y
 * por eso el enlace funciona en otro navegador o en otro dispositivo.
 */
export async function confirmarEnlace(formData: FormData): Promise<void> {
  const tokenHash = String(formData.get('token_hash') ?? '')
  const tipo = String(formData.get('type') ?? '')

  if (!tokenHash || !esTipoDeEnlace(tipo)) {
    redirect('/login?error=enlace_invalido')
  }
  const type = tipo as EmailOtpType
  const errorEn = type === 'recovery' ? '/forgot-password' : '/login'

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

  if (error) {
    console.error('[Auth Confirmar] Error en verifyOtp:', { message: error.message, code: error.code, status: error.status })
    redirect(`${errorEn}?error=${codigoParaLaUrl(error, 'enlace_invalido')}`)
  }

  const cookieStore = await cookies()

  if (type === 'recovery') {
    cookieStore.delete('auth_redirect')
    redirect('/reset-password')
  }

  // El destino guardado al pedir el enlace solo existe si se abre en el mismo
  // navegador; en otro, se va al panel
  const redirectTo = destinoInterno(cookieStore.get('auth_redirect')?.value)

  const h = await headers()
  // El mismo origen al que ha llegado el POST, como hace el callback con
  // request.url: en Vercel, el dominio por el que se ha entrado
  const origin = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`

  const destino = await destinoTrasEntrar(
    supabase,
    data.user,
    origin,
    redirectTo,
    metodoDeRegistro(data.user, type)
  )
  cookieStore.delete('auth_redirect')
  redirect(destino)
}
