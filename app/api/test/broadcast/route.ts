import { NextResponse } from 'next/server'
import { sendDiscordNotification } from '@/lib/notifications/discord'
import { sendTelegramNotification } from '@/lib/notifications/telegram'

// GET - Test de broadcast (solo desarrollo/admin)
export async function GET() {
  const timestamp = new Date().toLocaleString('es-ES')

  const results = {
    discord: false,
    telegram: false,
  }

  // Test Discord
  try {
    results.discord = await sendDiscordNotification(
      '🧪 Test de notificaciones',
      `Prueba desde Nodo360 - ${timestamp}`,
      'success'
    )
  } catch (error) {
    console.error('❌ Discord test failed:', error)
  }

  // Test Telegram
  try {
    results.telegram = await sendTelegramNotification(
      '🧪 Test de notificaciones',
      `Prueba desde Nodo360 - ${timestamp}`
    )
  } catch (error) {
    console.error('❌ Telegram test failed:', error)
  }

  return NextResponse.json({
    success: true,
    timestamp,
    results,
    env: {
      discord: !!process.env.DISCORD_WEBHOOK_URL,
      telegram: !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID,
    }
  })
}
