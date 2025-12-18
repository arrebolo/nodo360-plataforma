import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get('text')

  if (!text) {
    return NextResponse.json({ error: 'Falta parámetro text' }, { status: 400 })
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })

    // Convertir data URL a buffer
    const base64Data = qrDataUrl.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch (error) {
    console.error('Error generando QR:', error)
    return NextResponse.json({ error: 'Error generando QR' }, { status: 500 })
  }
}
