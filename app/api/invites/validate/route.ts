import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/ratelimit'

export async function GET(req: Request) {
  // Rate limiting (strict para validacion de invites)
  const rateLimitResponse = await checkRateLimit(req, 'strict')
  if (rateLimitResponse) return rateLimitResponse
  const { searchParams } = new URL(req.url)
  const code = (searchParams.get('code') ?? '').trim().toUpperCase()

  if (!code) {
    return NextResponse.json(
      { valid: false, reason: 'missing_code' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabase
    .from('invites')
    .select('code, expires_at, max_uses, used_count, is_active, role')
    .eq('code', code)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      { valid: false, reason: 'not_found' },
      { status: 200 }
    )
  }

  if (!data.is_active) {
    return NextResponse.json(
      { valid: false, reason: 'inactive' },
      { status: 200 }
    )
  }

  const now = new Date()
  if (data.expires_at && now >= new Date(data.expires_at)) {
    return NextResponse.json(
      { valid: false, reason: 'expired' },
      { status: 200 }
    )
  }

  if (data.used_count >= data.max_uses) {
    return NextResponse.json(
      { valid: false, reason: 'used_up' },
      { status: 200 }
    )
  }

  return NextResponse.json(
    { valid: true, role: data.role },
    { status: 200 }
  )
}
