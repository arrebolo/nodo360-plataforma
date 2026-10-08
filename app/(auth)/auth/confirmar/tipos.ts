/**
 * Los `type` que pueden llegar en un enlace de correo a /auth/confirmar: los de
 * las tres plantillas de Supabase que apuntan aquí (Magic Link con `email`,
 * Reset Password con `recovery`, Confirm signup con `signup`) y `magiclink`, el
 * nombre antiguo del primero. Cualquier otro es un enlace que no hemos escrito
 * nosotros.
 *
 * `signup` y no `email` en el registro: metodoDeRegistro (lib/auth/tras-verificar.ts)
 * lo usa para no contar dos veces el sign_up del registro con contraseña, que ya
 * emite el formulario.
 */
export const TIPOS_DE_ENLACE = ['email', 'magiclink', 'signup', 'recovery'] as const
export type TipoDeEnlace = (typeof TIPOS_DE_ENLACE)[number]

export function esTipoDeEnlace(valor: string | null | undefined): valor is TipoDeEnlace {
  return (TIPOS_DE_ENLACE as readonly string[]).includes(valor ?? '')
}
