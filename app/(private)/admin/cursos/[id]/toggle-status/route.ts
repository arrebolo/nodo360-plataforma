import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/auth'

export async function POST(_req: NextRequest, { params }: { params: any }) {
  const id = params?.id as string

  await requireAdmin(`/admin/cursos/${id}`)

  const supabase = await createClient()

  const { data: course, error: getErr } = await supabase
    .from('courses')
    .select('id,status')
    .eq('id', id)
    .single()

  if (getErr || !course) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  const nextStatus = course.status === 'draft' ? 'published' : 'draft'

  const { error: updErr } = await supabase
    .from('courses')
    .update({ status: nextStatus })
    .eq('id', id)

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: nextStatus })
}
