/**
 * El destino al que se manda a alguien después de entrar, solo si es de este sitio.
 *
 * EL CASO QUE LO MOTIVA
 *   /auth/callback?next=https://otro-sitio redirigía fuera a quien ya tenía sesión:
 *   un enlace con nuestro dominio que acaba en otra parte, justo lo que hace falta
 *   para un aviso falso de «vuelve a iniciar sesión». El destino llega por cuatro
 *   sitios —?next= del callback, la cookie auth_redirect, el campo `redirect` del
 *   formulario de acceso y el `redirectTo` de Google— y cada uno lo trataba a su
 *   manera: uno miraba `startsWith('/')`, que deja pasar `//otro-sitio.com`; los
 *   demás, nada.
 *
 * NO BASTA CON MIRAR EL PRINCIPIO DE LA CADENA. El navegador interpreta `//x`,
 * `/\x` y `/<tab>/x` como «otro dominio». Así que se resuelve contra un origen
 * ficticio con el mismo analizador de URL que usa el navegador, y se acepta solo
 * si el origen no ha cambiado. Lo que se devuelve es la ruta normalizada, nunca la
 * cadena de entrada.
 */
const ORIGEN_FICTICIO = 'https://nodo360.invalid'

export function destinoInterno(valor: string | null | undefined, porDefecto = '/dashboard'): string {
  if (!valor || !valor.startsWith('/')) return porDefecto
  try {
    const url = new URL(valor, ORIGEN_FICTICIO)
    if (url.origin !== ORIGEN_FICTICIO) return porDefecto
    return url.pathname + url.search + url.hash
  } catch {
    return porDefecto
  }
}
