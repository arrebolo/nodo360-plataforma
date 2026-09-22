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

/**
 * Cliente y limitadores a ambito de modulo.
 *
 * Antes se construian `new Redis()` y `new Ratelimit()` dentro de cada
 * peticion. Ademas de rehacer el trabajo cada vez, impedia que
 * @upstash/ratelimit reutilizase su cache interna entre llamadas.
 *
 * Y sobre todo: @upstash/redis reintenta 5 veces por defecto con espera
 * exponencial (50, 136, 369, 1004, 2730 ms). Cuando la instancia de Upstash
 * dejo de existir, cada peticion a cualquiera de las 81 rutas que llaman a
 * checkRateLimit se quedaba ~4,3 s esperando a un DNS que ya no resolvia,
 * antes de caer al contador en memoria. Aqui se acota a 1 reintento sin
 * espera y con un corte a 500 ms: un rate limiter que tarda mas de medio
 * segundo ya no protege, estorba.
 */
const UPSTASH_TIMEOUT_MS = 500

let redisClient: Redis | null = null
let redisUnavailable = false

function getRedis(): Redis | null {
  if (redisUnavailable) return null
  if (redisClient) return redisClient

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    redisUnavailable = true
    return null
  }

  redisClient = new Redis({
    url,
    token,
    retry: { retries: 1, backoff: () => 0 },
    signal: () => AbortSignal.timeout(UPSTASH_TIMEOUT_MS),
  })
  return redisClient
}

const limiters = new Map<RateLimitType, Ratelimit>()

/**
 * Cortacircuitos. Con 1 reintento y corte a 500 ms, un Upstash caido todavia
 * costaria hasta ~1 s por peticion. Tras un fallo se deja de intentar durante
 * COOLDOWN_MS y se va directo al contador en memoria, asi que el coste real es
 * cero salvo un sondeo cada medio minuto. Se rearma solo: cuando crees la
 * instancia nueva, vuelve a usarla sin tocar nada ni redesplegar.
 */
const COOLDOWN_MS = 30_000
let cooldownUntil = 0

function getRatelimiter(type: RateLimitType): Ratelimit | null {
  if (Date.now() < cooldownUntil) return null

  const cached = limiters.get(type)
  if (cached) return cached

  const redis = getRedis()
  if (!redis) return null

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_CONFIGS[type].requests, '1m'),
    analytics: true,
  })
  limiters.set(type, limiter)
  return limiter
}

// Un fallo de Upstash no debe llenar los logs con una linea por peticion.
let lastUpstashLog = 0
function logUpstashError(error: unknown) {
  const now = Date.now()
  if (now - lastUpstashLog < 60_000) return
  lastUpstashLog = now
  console.error('[RateLimit] Upstash no responde, usando el contador en memoria:', error)
}

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
  const ratelimit = getRatelimiter(type)
  if (!ratelimit) {
    return memoryLimiter.limit(identifier, config.requests, config.windowMs)
  }

  try {
    const result = await ratelimit.limit(identifier)
    return { success: result.success, remaining: result.remaining }
  } catch (error) {
    cooldownUntil = Date.now() + COOLDOWN_MS
    logUpstashError(error)
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
