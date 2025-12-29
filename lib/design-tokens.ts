// Design Tokens - Estilo Nodo360 (basado en Gobernanza)
export const colors = {
  // Fondos
  bgPrimary: '#070a10',
  bgCard: 'rgba(255, 255, 255, 0.05)',
  bgCardHover: 'rgba(255, 255, 255, 0.08)',

  // Bordes
  borderSoft: 'rgba(255, 255, 255, 0.10)',
  borderHover: 'rgba(255, 255, 255, 0.20)',

  // Accent colors para stats cards
  statBlue: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.30)', text: '#60a5fa' },
  statGreen: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.30)', text: '#4ade80' },
  statPurple: { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.30)', text: '#c084fc' },
  statOrange: { bg: 'rgba(247, 147, 26, 0.15)', border: 'rgba(247, 147, 26, 0.30)', text: '#f7931a' },
  statYellow: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.30)', text: '#facc15' },

  // Brand
  brandOrange: '#f7931a',
  brandOrangeLight: '#ff6b35',
  gradient: 'linear-gradient(to right, #ff6b35, #f7931a)',

  // Texto
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.70)',
  textMuted: 'rgba(255, 255, 255, 0.50)',
}

// Clases Tailwind reutilizables
export const tw = {
  // Cards base
  card: 'rounded-2xl border border-white/10 bg-white/5 backdrop-blur',
  cardHover: 'hover:border-white/20 hover:bg-white/[0.08] transition-all duration-300',

  // Stats cards con colores
  statCardBlue: 'rounded-xl border border-blue-500/30 bg-blue-500/15 p-5',
  statCardGreen: 'rounded-xl border border-green-500/30 bg-green-500/15 p-5',
  statCardPurple: 'rounded-xl border border-purple-500/30 bg-purple-500/15 p-5',
  statCardOrange: 'rounded-xl border border-[#f7931a]/30 bg-[#f7931a]/15 p-5',
  statCardYellow: 'rounded-xl border border-yellow-500/30 bg-yellow-500/15 p-5',

  // Botones
  btnPrimary: 'rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-6 py-3 font-semibold text-white hover:opacity-90 transition-all',
  btnSecondary: 'rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white hover:bg-white/10 transition-all',
  btnGhost: 'rounded-xl px-6 py-3 font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all',

  // Texto
  heading1: 'text-2xl font-semibold text-white',
  heading2: 'text-xl font-semibold text-white',
  heading3: 'text-lg font-semibold text-white',
  textBody: 'text-white/70',
  textMuted: 'text-white/50',

  // Iconos con fondo
  iconBox: 'w-12 h-12 rounded-xl flex items-center justify-center',
  iconBoxBlue: 'w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center',
  iconBoxGreen: 'w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center',
  iconBoxPurple: 'w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center',
  iconBoxOrange: 'w-12 h-12 rounded-xl bg-[#f7931a]/20 flex items-center justify-center',
}
