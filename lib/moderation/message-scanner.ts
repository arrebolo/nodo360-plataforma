/**
 * Message Scanner - Automatic moderation flag detection
 *
 * Scans message content for potentially harmful patterns:
 * - External links (low severity)
 * - Invite links (high severity)
 * - Trading/promo keywords (high severity)
 * - Spam patterns (medium severity)
 *
 * Privacy-first: Only stores hashes, not actual content
 */

import crypto from 'crypto'

export type MessageFlagType =
  | 'external_link'
  | 'invite_link'
  | 'spam_pattern'
  | 'trading_promo'
  | 'repeat_message'
  | 'mass_dm'

export interface MessageFlag {
  type: MessageFlagType
  severity: number // 1-5
  evidenceHash: string
  evidenceMeta: Record<string, unknown>
}

export interface ScanResult {
  hasFlags: boolean
  flags: MessageFlag[]
  maxSeverity: number
}

// Detection patterns
const PATTERNS = {
  // External links (basic URL detection)
  externalLinks: /https?:\/\/[^\s]+|www\.[^\s]+/gi,

  // Invite/redirect links (high severity - potential scam/spam)
  inviteLinks: /(t\.me\/|telegram\.me\/|discord\.gg\/|discord\.com\/invite\/|linktr\.ee\/|wa\.me\/|bit\.ly\/|tinyurl\.com\/|goo\.gl\/|ow\.ly\/|cutt\.ly\/|rebrand\.ly\/)/gi,

  // Trading/promo keywords (Spanish - high severity)
  tradingPromo: new RegExp(
    '(' +
    'se[ñn]ales?\\s*(de\\s*)?(trading|cripto|forex)' + '|' +
    'grupo\\s*(de\\s*)?vip' + '|' +
    'rentabilidad\\s*(garantizada|asegurada)' + '|' +
    'roi\\s*\\d+\\s*%' + '|' +
    'copy\\s*trading' + '|' +
    'pump\\s*(and\\s*)?dump' + '|' +
    'ganancias\\s*(aseguradas|garantizadas)' + '|' +
    'invierte\\s*ahora' + '|' +
    'duplica\\s*tu\\s*(dinero|capital)' + '|' +
    'forex\\s*signals?' + '|' +
    'mi\\s*c[oó]digo\\s*(de\\s*)?(referido|descuento)' + '|' +
    'usa\\s*mi\\s*(link|enlace)' + '|' +
    '\\d+%\\s*(de\\s*)?(ganancia|retorno|profit)\\s*(diario|semanal|mensual)' +
    ')',
    'gi'
  ),

  // Spam patterns (Spanish - medium severity)
  spamPatterns: new RegExp(
    '(' +
    'ganar\\s*dinero\\s*f[aá]cil' + '|' +
    'trabaja\\s*desde\\s*casa' + '|' +
    'ingresos\\s*pasivos\\s*(garantizados|sin\\s*esfuerzo)' + '|' +
    '[uú]nete\\s*a\\s*mi\\s*grupo' + '|' +
    'env[ií]ame\\s*(mensaje|dm)\\s*para\\s*(m[aá]s\\s*)?info' + '|' +
    'oportunidad\\s*[uú]nica' + '|' +
    'no\\s*te\\s*lo\\s*pierdas' + '|' +
    'plazas\\s*limitadas' +
    ')',
    'gi'
  ),

  // Cryptocurrency addresses (potential phishing)
  cryptoAddresses: /(bc1[a-zA-HJ-NP-Z0-9]{39,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-fA-F0-9]{40})/g,
}

/**
 * Scan a message for potentially harmful content
 */
export function scanMessage(content: string): ScanResult {
  const flags: MessageFlag[] = []
  const normalizedContent = content.toLowerCase()

  // 1. Detect invite/redirect links (severity 5 - critical)
  const inviteMatches = content.match(PATTERNS.inviteLinks)
  if (inviteMatches) {
    const domains = [...new Set(inviteMatches.map(m => {
      const match = m.match(/([a-z0-9-]+\.[a-z]{2,})/i)
      return match ? match[1] : 'unknown'
    }))]

    flags.push({
      type: 'invite_link',
      severity: 5,
      evidenceHash: hashEvidence(inviteMatches.join(',')),
      evidenceMeta: {
        domains,
        count: inviteMatches.length,
        detected_at: new Date().toISOString()
      }
    })
  }

  // 2. Detect trading/promo keywords (severity 4 - high)
  const tradingMatches = content.match(PATTERNS.tradingPromo)
  if (tradingMatches) {
    flags.push({
      type: 'trading_promo',
      severity: 4,
      evidenceHash: hashEvidence(tradingMatches.join(',')),
      evidenceMeta: {
        keyword_count: tradingMatches.length,
        detected_at: new Date().toISOString()
      }
    })
  }

  // 3. Detect spam patterns (severity 3 - medium)
  const spamMatches = content.match(PATTERNS.spamPatterns)
  if (spamMatches) {
    flags.push({
      type: 'spam_pattern',
      severity: 3,
      evidenceHash: hashEvidence(spamMatches.join(',')),
      evidenceMeta: {
        pattern_count: spamMatches.length,
        detected_at: new Date().toISOString()
      }
    })
  }

  // 4. Detect external links (severity 2 - low, only if no invite links)
  const linkMatches = content.match(PATTERNS.externalLinks)
  if (linkMatches && !inviteMatches) {
    // Filter out common safe domains
    const safeDomains = ['nodo360.com', 'youtube.com', 'youtu.be', 'github.com']
    const suspiciousLinks = linkMatches.filter(link => {
      return !safeDomains.some(safe => link.includes(safe))
    })

    if (suspiciousLinks.length > 0) {
      flags.push({
        type: 'external_link',
        severity: 2,
        evidenceHash: hashEvidence(suspiciousLinks.join(',')),
        evidenceMeta: {
          link_count: suspiciousLinks.length,
          total_links: linkMatches.length,
          detected_at: new Date().toISOString()
        }
      })
    }
  }

  // Calculate max severity
  const maxSeverity = flags.length > 0
    ? Math.max(...flags.map(f => f.severity))
    : 0

  return {
    hasFlags: flags.length > 0,
    flags,
    maxSeverity
  }
}

/**
 * Hash evidence for privacy (store hash, not content)
 */
function hashEvidence(text: string): string {
  return crypto
    .createHash('sha256')
    .update(text.toLowerCase())
    .digest('hex')
    .substring(0, 16)
}

/**
 * Check if a user is potentially mass-DMing
 * Call this with conversation history to detect mass_dm pattern
 */
export function checkMassDM(
  recentConversations: { created_at: string; first_message_by_user: boolean }[],
  thresholdMinutes: number = 60,
  thresholdCount: number = 5
): { isMassDM: boolean; conversationCount: number } {
  const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000)

  const recentUserInitiated = recentConversations.filter(conv => {
    return conv.first_message_by_user && new Date(conv.created_at) > cutoff
  })

  return {
    isMassDM: recentUserInitiated.length >= thresholdCount,
    conversationCount: recentUserInitiated.length
  }
}

/**
 * Check for repeat message spam
 */
export function checkRepeatMessage(
  previousMessages: { content: string; created_at: string }[],
  currentContent: string,
  thresholdMinutes: number = 10,
  similarityThreshold: number = 0.8
): { isRepeat: boolean; repeatCount: number } {
  const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000)
  const normalizedCurrent = currentContent.toLowerCase().trim()

  let repeatCount = 0

  for (const msg of previousMessages) {
    if (new Date(msg.created_at) < cutoff) continue

    const normalizedPrev = msg.content.toLowerCase().trim()
    const similarity = calculateSimilarity(normalizedCurrent, normalizedPrev)

    if (similarity >= similarityThreshold) {
      repeatCount++
    }
  }

  return {
    isRepeat: repeatCount >= 2, // Same message sent 3+ times
    repeatCount
  }
}

/**
 * Simple similarity calculation (Jaccard for word sets)
 */
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 2))
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 2))

  if (wordsA.size === 0 && wordsB.size === 0) return 1
  if (wordsA.size === 0 || wordsB.size === 0) return 0

  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)))
  const union = new Set([...wordsA, ...wordsB])

  return intersection.size / union.size
}
