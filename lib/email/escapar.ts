/**
 * Texto de una persona metido dentro de HTML.
 *
 * Todo lo que escribe alguien y viaja en un correo pasa por aqui: el nombre de un
 * curso, el motivo de un rechazo, el comentario de una revision. Sin esto, un
 * comentario con un `<` rompe el correo, y uno con una etiqueta acaba
 * interpretandose en el cliente de quien lo recibe.
 *
 * Estaba en lib/email/verificacion.ts y lo usaba solo el aviso de verificacion.
 * Vive aqui porque el correo de cambios solicitados interpolaba el comentario del
 * revisor sin escapar nada.
 */
export function escapar(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
