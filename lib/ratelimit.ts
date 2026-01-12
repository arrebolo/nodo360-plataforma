import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Para desarrollo local sin Upstash, usar memoria
const isProduction = process.env.NODE_ENV === 'production'

// Rate limiter en memoria para desarrollo
class MemoryRateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map()

  async limit(identifier: string, maxRequests: number = 10, windowMs: number = 60000) {
    const now = Date.now()
    const record = this.requests.get(identifier)

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

// Singleton para desarrollo
const memoryLimiter = new MemoryRateLimiter()

// Rate limiter para producción (Upstash) o desarrollo (memoria)
export async function rateLimit(
  identifier: string,
  type: 'api' | 'auth' | 'strict' = 'api'
) {
  // Configuración por tipo
  const configs = {
    api: { requests: 30, window: '1m' as const },     // 30 req/min para APIs generales
    auth: { requests: 5, window: '1m' as const },     // 5 req/min para auth (más estricto)
    strict: { requests: 3, window: '1m' as const }    // 3 req/min para operaciones sensibles
  }

  const config = configs[type]

  // Desarrollo: usar memoria
  if (!isProduction || !process.env.UPSTASH_REDIS_REST_URL) {
    const windowMs = config.window === '1m' ? 60000 :
                     config.window === '1h' ? 3600000 : 60000
    return memoryLimiter.limit(identifier, config.requests, windowMs)
  }

  // Producción: usar Upstash Redis
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
  })

  return ratelimit.limit(identifier)
}

// Helper para obtener IP del request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}

// Helper para respuesta de rate limit excedido
export function rateLimitExceeded() {
  return new Response(
    JSON.stringify({
      error: 'Demasiadas solicitudes. Por favor, espera un momento.',
      code: 'RATE_LIMIT_EXCEEDED'
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60'
      }
    }
  )
}
