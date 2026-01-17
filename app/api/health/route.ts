import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Endpoint de salud para verificar estado de la aplicacion
 *
 * GET /api/health
 *
 * Respuestas:
 * - 200: Todo OK
 * - 503: Supabase no disponible
 * - 500: Error interno
 */
export async function GET() {
  const started = Date.now()

  try {
    // Crear cliente Supabase (sin auth)
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    )

    // Ping a Supabase: leer 1 fila de courses
    const { error: supabaseError } = await supabase
      .from('courses')
      .select('id')
      .limit(1)

    const isHealthy = !supabaseError

    return NextResponse.json(
      {
        ok: isHealthy,
        status: isHealthy ? 'healthy' : 'degraded',
        environment: env.NODE_ENV,
        checks: {
          supabase: {
            ok: !supabaseError,
            error: supabaseError?.message ?? null,
          },
        },
        meta: {
          responseTime: `${Date.now() - started}ms`,
          timestamp: new Date().toISOString(),
          version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
        },
      },
      {
        status: isHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        ok: false,
        status: 'error',
        environment: env.NODE_ENV,
        error: errorMessage,
        meta: {
          responseTime: `${Date.now() - started}ms`,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
