/**
 * Types for the Admin Moderation Panel (Phase 3)
 */

// Re-export from message-scanner
export type { MessageFlagType } from './message-scanner'

// === Review Actions ===
export type ReviewAction = 'dismissed' | 'warning_sent' | 'user_banned'

// === Report Enums (match DB enums) ===
export type ReportReason =
  | 'spam'
  | 'external_promo'
  | 'trading_promo'
  | 'harassment'
  | 'scam'
  | 'inappropriate'
  | 'other'

export type ReportStatus = 'open' | 'triaged' | 'closed' | 'actioned'

// === Database Row Types ===
export interface MessageFlagRow {
  id: string
  conversation_id: string
  message_id: string | null
  flag_type: string
  severity: number
  evidence_hash: string | null
  evidence_meta: Record<string, unknown>
  reviewed_at: string | null
  reviewed_by: string | null
  review_action: string | null
  created_at: string
  created_by: string | null
}

export interface MessageReportRow {
  id: string
  conversation_id: string
  message_id: string | null
  reporter_user_id: string
  reported_user_id: string
  reason: ReportReason
  details: string | null
  status: ReportStatus
  admin_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface MessageReportWithUsers extends MessageReportRow {
  reporter: { full_name: string | null; avatar_url: string | null } | null
  reported_user: { full_name: string | null; avatar_url: string | null } | null
}

// === Filter & Pagination ===
export interface FlagsFilters {
  type?: string
  severity?: string
  unreviewed?: boolean
  page?: number
}

export interface ReportsFilters {
  status?: ReportStatus
  reason?: ReportReason
  page?: number
}

export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// === API Response Types ===
export interface FlagsResponse {
  flags: MessageFlagRow[]
  stats: {
    total: number
    unreviewed: number
    highSeverity: number
  }
  pagination: PaginationInfo
}

export interface ReportsResponse {
  reports: MessageReportWithUsers[]
  stats: {
    total: number
    open: number
    actioned: number
  }
  pagination: PaginationInfo
}
