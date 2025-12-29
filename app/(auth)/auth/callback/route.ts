import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  // Leer redirect de cookie (guardada antes del OAuth)
  const cookieStore = await cookies()
  const redirectTo = cookieStore.get('auth_redirect')?.value

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Limpiar cookie de redirect
  const response = NextResponse.redirect(
    `${origin}${redirectTo || '/dashboard'}`
  )
  response.cookies.delete('auth_redirect')

  return response
}
