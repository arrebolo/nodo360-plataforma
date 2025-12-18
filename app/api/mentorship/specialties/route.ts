import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET: Listar especialidades (público)
export async function GET() {
  const supabase = await createClient()

  console.log('🔍 [specialties] Listando especialidades')

  const { data, error } = await supabase
    .from('specialties')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('❌ [specialties] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ [specialties] Encontradas:', data?.length || 0)
  return NextResponse.json({ data })
}
