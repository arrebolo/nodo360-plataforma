import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/auth'

export async function POST(_req: NextRequest, { params }: { params: any }) {
  const id = params?.id as string

  await requireAdmin(`/admin/cursos/${id}`)

  const supabase = await createClient()

  const { data: course, error: getErr } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (getErr || !course) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  const { id: _oldId, created_at, updated_at, ...rest } = course as any

  const copyPayload = {
    ...rest,
    title: `${course.title} (Copia)`,
    slug: `${course.slug}-copia-${Math.random().toString(36).slice(2, 7)}`,
    status: 'draft',
  }

  const { data: inserted, error: insErr } = await supabase
    .from('courses')
    .insert(copyPayload)
    .select('id')
    .single()

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: inserted?.id })
}
