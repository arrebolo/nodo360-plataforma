/**
 * Validacion fail-fast de variables de entorno
 * Si falta una ENV critica, la app falla en build/arranque
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

function optional(name: string, defaultValue: string = ''): string {
  return process.env[name] ?? defaultValue
}

export const env = {
  // Entorno
  NODE_ENV: optional('NODE_ENV', 'development'),

  // URLs publicas (requeridas)
  NEXT_PUBLIC_SITE_URL: required('NEXT_PUBLIC_SITE_URL'),
  NEXT_PUBLIC_SUPABASE_URL: required('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),

  // Server-side (opcionales con fallback)
  SUPABASE_SERVICE_ROLE_KEY: optional('SUPABASE_SERVICE_ROLE_KEY'),
  RESEND_API_KEY: optional('RESEND_API_KEY'),

  // Helpers
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
}

// Log en desarrollo para verificar que las variables estan cargadas
if (env.isDev) {
  console.log('[ENV] Variables cargadas correctamente')
}
