import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { full_name, bio, website, twitter, linkedin, github } = body

    // Validar datos
    if (full_name && full_name.length > 100) {
      return NextResponse.json(
        { error: 'El nombre no puede superar 100 caracteres' },
        { status: 400 }
      )
    }

    if (bio && bio.length > 500) {
      return NextResponse.json(
        { error: 'La biografía no puede superar 500 caracteres' },
        { status: 400 }
      )
    }

    // Validar URLs si se proporcionan
    const urlFields = { website, linkedin, github }
    for (const [field, value] of Object.entries(urlFields)) {
      if (value && value.trim()) {
        try {
          // Si no tiene protocolo, agregarlo para validar
          const urlToValidate = value.startsWith('http') ? value : `https://${value}`
          new URL(urlToValidate)
        } catch {
          return NextResponse.json(
            { error: `URL inválida en ${field}` },
            { status: 400 }
          )
        }
      }
    }

    // Actualizar perfil
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: full_name?.trim() || null,
        bio: bio?.trim() || null,
        website: website?.trim() || null,
        twitter: twitter?.trim() || null,
        linkedin: linkedin?.trim() || null,
        github: github?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json(
        { error: 'Error al actualizar el perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: data
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, bio, website, twitter, linkedin, github, created_at')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener el perfil' },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
