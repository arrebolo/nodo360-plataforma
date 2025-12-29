'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Cliente de Supabase para Client Components
 * Usa createBrowserClient de @supabase/ssr para manejo correcto de cookies
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Helper para verificar la conexión
export async function testConnection() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('courses').select('count')
    if (error) throw error
    console.log('✅ [Supabase Client] Conexión exitosa')
    return { success: true, message: 'Conexión exitosa a Supabase' }
  } catch (error) {
    console.error('❌ [Supabase Client] Error al conectar:', error)
    return { success: false, message: 'Error de conexión', error }
  }
}