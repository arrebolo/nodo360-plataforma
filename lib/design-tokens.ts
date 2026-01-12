// lib/design-tokens.ts
// ⚠️ DEPRECATED: Este archivo existe solo por compatibilidad.
// Usa `import { tokens, cx } from '@/lib/design/tokens'` en código nuevo.
// TODO: Migrar todos los imports y eliminar este archivo.

export * from './design/tokens'

// Re-export colors for legacy compatibility
export const colors = {
  // Brand - usar clases Tailwind: bg-brand, text-brand, etc.
  brandOrange: '#f7931a',
  brandOrangeLight: '#ff6b35',

  // Dark theme - usar clases Tailwind: bg-dark, bg-dark-secondary, etc.
  bgPrimary: '#0a0f1a',
  bgCard: 'rgba(255, 255, 255, 0.05)',

  // Deprecated - usar Tailwind directamente
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.70)',
  textMuted: 'rgba(255, 255, 255, 0.50)',
} as const

// Re-export tw classes for legacy compatibility
export const tw = {
  // Deprecated - usar tokens de lib/design/tokens.ts
  card: 'rounded-2xl border border-white/10 bg-white/5 backdrop-blur',
  btnPrimary: 'rounded-xl bg-gradient-to-r from-brand-light to-brand px-6 py-3 font-semibold text-white hover:opacity-90 transition-all',
  btnSecondary: 'rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white hover:bg-white/10 transition-all',
} as const


