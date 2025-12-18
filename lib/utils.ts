// lib/utils.ts
// Helper para combinar clases de Tailwind de forma condicional

export function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(' ')
}
