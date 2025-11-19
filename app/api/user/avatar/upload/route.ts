import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 })
    }

    // Generar nombre único
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    // Subir a Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true, // Sobrescribir si existe
        contentType: file.type
      })

    if (uploadError) {
      console.error('Error al subir archivo:', uploadError)
      return NextResponse.json({ error: 'Error al subir' }, { status: 500 })
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Actualizar en BD
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error al actualizar BD:', updateError)
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, avatar_url: publicUrl })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
