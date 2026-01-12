// lib/design/tokens.ts
// Sistema de Diseño Nodo360 - Fuente Única de Verdad
// =====================================================

/**
 * COLORES DISPONIBLES EN TAILWIND (via @theme en globals.css):
 *
 * Brand:
 * - bg-brand, text-brand, border-brand
 * - bg-brand-light, text-brand-light
 * - bg-brand-dark, text-brand-dark
 * - bg-brand-gold, text-brand-gold
 * - bg-brand-muted (20% opacity)
 *
 * Dark Theme:
 * - bg-dark (fondo principal)
 * - bg-dark-secondary (cards, sidebars)
 * - bg-dark-tertiary (inputs, hover)
 * - border-dark-border
 * - text-dark-muted
 *
 * Semantic:
 * - bg-success, text-success, bg-success-muted
 * - bg-warning, text-warning, bg-warning-muted
 * - bg-error, text-error, bg-error-muted
 * - bg-info, text-info, bg-info-muted
 */

export const tokens = {
  layout: {
    container: 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8',
    sectionGap: 'py-10 sm:py-12',
  },

  radius: {
    card: 'rounded-2xl',
    button: 'rounded-xl',
    input: 'rounded-xl',
    pill: 'rounded-full',
  },

  shadow: {
    card: 'shadow-sm shadow-black/5',
    float: 'shadow-md shadow-black/10',
    brand: 'shadow-brand',
    brandLg: 'shadow-brand-lg',
  },

  border: {
    subtle: 'border border-black/10',
    strong: 'border border-black/15',
    dark: 'border border-dark-border',
  },

  color: {
    // Light theme backgrounds
    bg: 'bg-neutral-50',
    bgSoft: 'bg-neutral-100/60',
    bgWarm: "bg-[radial-gradient(900px_circle_at_20%_-10%,rgba(249,115,22,0.10),transparent_55%),radial-gradient(700px_circle_at_90%_0%,rgba(16,185,129,0.08),transparent_55%),linear-gradient(to_bottom,#fbfbfb,#f7f7f7)]",
    surface: 'bg-white',
    surfaceAlt: 'bg-white/70',

    // Dark theme backgrounds
    darkBg: 'bg-dark',
    darkSecondary: 'bg-dark-secondary',
    darkTertiary: 'bg-dark-tertiary',

    // Text colors (light theme)
    text: 'text-neutral-900',
    textMuted: 'text-neutral-600',
    textSoft: 'text-neutral-500',

    // Text colors (dark theme)
    textWhite: 'text-white',
    textWhiteMuted: 'text-white/70',
    textWhiteSoft: 'text-white/50',

    // Brand colors
    primary: 'text-brand',
    primaryBg: 'bg-brand',
    primaryBgHover: 'hover:bg-brand-dark',
    primaryRing: 'focus-visible:ring-brand-muted',

    // Gradient
    gradient: 'bg-gradient-to-r from-brand-light to-brand',
    gradientHover: 'hover:from-brand hover:to-brand-dark',

    // Semantic accents
    success: 'text-success',
    successBg: 'bg-success',
    successMuted: 'bg-success-muted',

    warning: 'text-warning',
    warningBg: 'bg-warning',
    warningMuted: 'bg-warning-muted',

    error: 'text-error',
    errorBg: 'bg-error',
    errorMuted: 'bg-error-muted',

    info: 'text-info',
    infoBg: 'bg-info',
    infoMuted: 'bg-info-muted',
  },

  typography: {
    h1: 'text-3xl sm:text-4xl font-semibold tracking-tight',
    h2: 'text-2xl sm:text-3xl font-semibold tracking-tight',
    h3: 'text-xl sm:text-2xl font-semibold tracking-tight',
    p: 'text-base leading-relaxed',
    small: 'text-sm leading-relaxed',
  },

  focus: {
    ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2',
    ringDark: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-dark',
  },

  transition: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-200',
    slow: 'transition-all duration-300',
  },

  // Componentes pre-definidos
  components: {
    // Card base
    card: 'bg-white rounded-2xl border border-black/10 shadow-sm shadow-black/5',
    cardDark: 'bg-dark-secondary rounded-2xl border border-dark-border',

    // Button variants
    btnPrimary: 'bg-gradient-to-r from-brand-light to-brand text-white hover:from-brand hover:to-brand-dark',
    btnSecondary: 'bg-neutral-900 text-white hover:bg-neutral-800',
    btnGhost: 'bg-transparent text-neutral-900 hover:bg-neutral-100',
    btnDanger: 'bg-error text-white hover:bg-error-dark',

    // Input
    input: 'rounded-xl border border-black/10 bg-white px-4 py-2 text-neutral-900 placeholder:text-neutral-400',
    inputDark: 'rounded-xl border border-dark-border bg-dark-tertiary px-4 py-2 text-white placeholder:text-white/40',
  },
} as const

// Helper para concatenar clases sin dependencias externas
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

// Tipos para autocompletado
export type Tokens = typeof tokens
export type ColorToken = keyof typeof tokens.color
export type RadiusToken = keyof typeof tokens.radius
export type TypographyToken = keyof typeof tokens.typography


