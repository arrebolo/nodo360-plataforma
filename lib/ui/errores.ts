/**
 * El mensaje que de verdad trae una respuesta fallida.
 *
 * POR QUE
 *   Los botones de borrar y reordenar hacían esto:
 *
 *       if (!response.ok) throw new Error('Error al eliminar')
 *       ...
 *       alert('Error al eliminar módulo')
 *
 *   Dos problemas. El primero, que el cuerpo de la respuesta —donde el servidor
 *   explica qué pasa— se tiraba sin leerlo: un 403 «Esto solo lo hace la
 *   administración» se convertía en «Error al eliminar». El segundo, que un `alert()`
 *   lo cierra cualquier cosa y no deja rastro; en la auditoría del flujo de instructor
 *   estas acciones «fallaban sin avisar».
 *
 * Con el estado se da un texto útil incluso cuando el cuerpo no trae nada.
 */
export async function mensajeDeRespuesta(
  respuesta: Response,
  porDefecto: string
): Promise<string> {
  let delCuerpo: string | null = null
  try {
    const j = (await respuesta.clone().json()) as { error?: unknown; details?: unknown }
    if (typeof j?.error === 'string' && j.error.trim()) {
      delCuerpo = typeof j.details === 'string' && j.details.trim()
        ? `${j.error}: ${j.details}`
        : j.error
    }
  } catch {
    // Puede no ser JSON —un 500 de la plataforma, por ejemplo—. Se sigue.
  }

  if (delCuerpo) return delCuerpo

  switch (respuesta.status) {
    case 401:
      return 'Tu sesión ha caducado. Vuelve a entrar e inténtalo otra vez.'
    case 403:
      return 'No tienes permiso para hacer esto.'
    case 404:
      return 'Eso ya no existe. Recarga la página.'
    case 409:
      return 'Alguien lo ha cambiado mientras tanto. Recarga la página.'
    default:
      return `${porDefecto} (error ${respuesta.status})`
  }
}
