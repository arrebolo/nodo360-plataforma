/**
 * Imagen de Open Graph provisional, compartida por todo el sitio.
 *
 * El codigo referencia seis imagenes que NO existen en public/:
 * og-nodo360.png, og-cursos.png, og-rutas.png, og-mentoria.png,
 * og-glosario.png y og/faq.png. Una etiqueta og:image que apunta a un 404 es
 * peor que no ponerla: al compartir el enlace, X, WhatsApp y LinkedIn pintan la
 * tarjeta sin imagen, y Google registra el recurso como roto.
 *
 * La unica imagen con forma de tarjeta que existe hoy es og-blog.png (1200x630,
 * un render generico de bloques, sin texto ni marca de "Blog"), asi que sirve de
 * suplente para cualquier pagina.
 *
 * PARA CUANDO SE CREEN LAS IMAGENES DEFINITIVAS (tarea aparte): sustituir cada
 * uso de estas constantes por la imagen propia de su pagina y borrar el fichero.
 */
export const OG_IMAGEN_PROVISIONAL = '/imagenes/og-blog.png'
export const OG_ANCHO = 1200
export const OG_ALTO = 630

/** La imagen provisional en el formato que espera `openGraph.images`. */
export const OG_IMAGENES_PROVISIONALES = [
  { url: OG_IMAGEN_PROVISIONAL, width: OG_ANCHO, height: OG_ALTO, alt: 'Nodo360' },
]
