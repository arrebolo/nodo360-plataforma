import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const isProduction = process.env.NODE_ENV === 'production'

// Rate limiter en memoria para desarrollo
class MemoryRateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map()

  async limit(identifier: string, maxRequests: number = 10, windowMs: number = 60000) {
    const now = Date.now()
    const record = this.requests.get(identifier)

    // Limpiar registros expirados periodicamente
    if (this.requests.size > 10000) {
      for (const [key, val] of this.requests) {
        if (now > val.resetAt) this.requests.delete(key)
      }
    }

    if (!record || now > record.resetAt) {
      this.requests.set(identifier, { count: 1, resetAt: now + windowMs })
      return { success: true, remaining: maxRequests - 1 }
    }

    if (record.count >= maxRequests) {
      return { success: false, remaining: 0 }
    }

    record.count++
    return { success: true, remaining: maxRequests - record.count }
  }
}

const memoryLimiter = new MemoryRateLimiter()

// Configuracion por tipo de endpoint
const RATE_CONFIGS = {
  api: { requests: 30, windowMs: 60000 },        // 30 req/min - APIs generales
  auth: { requests: 5, windowMs: 60000 },        // 5 req/min - autenticacion
  strict: { requests: 3, windowMs: 60000 },      // 3 req/min - operaciones sensibles
  governance: { requests: 20, windowMs: 60000 }, // 20 req/min - votaciones
}

export type RateLimitType = keyof typeof RATE_CONFIGS

export async function rateLimit(
  identifier: string,
  type: RateLimitType = 'api'
): Promise<{ success: boolean; remaining: number }> {
  const config = RATE_CONFIGS[type]

  // Desarrollo: usar memoria
  if (!isProduction || !process.env.UPSTASH_REDIS_REST_URL) {
    return memoryLimiter.limit(identifier, config.requests, config.windowMs)
  }

  // Produccion: usar Upstash Redis
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })

    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, '1m'),
      analytics: true,
    })

    const result = await ratelimit.limit(identifier)
    return { success: result.success, remaining: result.remaining }
  } catch (error) {
    console.error('[RateLimit] Error con Upstash, usando fallback:', error)
    return memoryLimiter.limit(identifier, config.requests, config.windowMs)
  }
}

// Helper para obtener IP del request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')

  if (cfIP) return cfIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()

  return 'unknown'
}

// Helper para respuesta de rate limit excedido
export function rateLimitExceeded(): Response {
  return new Response(
    JSON.stringify({
      error: 'Demasiadas solicitudes. Por favor, espera un momento.',
      code: 'RATE_LIMIT_EXCEEDED'
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': '0',
      }
    }
  )
}

// Helper combinado para usar en APIs
export async function checkRateLimit(
  request: Request,
  type: RateLimitType = 'api'
): Promise<Response | null> {
  const ip = getClientIP(request)
  const { success } = await rateLimit(`${ip}:${type}`, type)

  if (!success) {
    console.log(`[RateLimit] Excedido para IP: ${ip.substring(0, 8)}***`)
    return rateLimitExceeded()
  }

  return null // No hay rate limit, continuar
}
