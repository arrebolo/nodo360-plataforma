import { MetadataRoute } from 'next'

/**
 * Zonas sin valor para un buscador, o directamente privadas. Se aplican igual a
 * todos los rastreadores: no hay ningun motivo para dejar entrar a uno y no a
 * otro en /api/ o en el area del alumno.
 *
 * /_next/ ya NO se bloquea, a proposito: ahi viven el CSS y el JS, y cerrarlo
 * impide a Google -y a los buscadores con IA- renderizar la pagina y ver lo que
 * ve una persona. Estaba en la regla general pero no en la de Googlebot, que es
 * justo la clase de descuadre que se arrastra sin que nadie lo note.
 *
 * Tampoco esta /private/: no existe. Venia de confundir el grupo de rutas
 * (private) de App Router con un segmento de URL. Los grupos entre parentesis
 * no aparecen en la direccion, de modo que esa linea no protegia nada.
 */
const ZONAS_CERRADAS = ['/api/', '/dashboard/', '/admin/']

/**
 * Rastreadores de IA, declarados uno a uno.
 *
 * Un bot bien educado ya tiene permiso con la regla '*', asi que esto no les
 * abre ninguna puerta nueva. Lo que hace es dejar constancia explicita, y en
 * tres casos cambia el comportamiento de verdad:
 *
 *   - Google-Extended y Applebot-Extended no rastrean nada. Son interruptores
 *     de uso: deciden si el contenido puede alimentar a Gemini o a Apple
 *     Intelligence. Sin una linea propia no hay respuesta que valga.
 *   - ChatGPT-User y Claude-User no indexan: son el navegador que abre la
 *     pagina en el momento en que alguien pregunta por nosotros.
 *
 * Para una plataforma educativa que vive de que la citen, la respuesta a las
 * tres cosas es que si.
 */
const RASTREADORES_IA = [
  'CCBot',              // Common Crawl, del que beben muchos otros modelos
  'GPTBot',             // OpenAI, entrenamiento
  'OAI-SearchBot',      // OpenAI, indice de busqueda de ChatGPT
  'ChatGPT-User',       // OpenAI, visita en directo al responder
  'PerplexityBot',      // Perplexity, indice
  'ClaudeBot',          // Anthropic, entrenamiento
  'Claude-SearchBot',   // Anthropic, indice de busqueda
  'Claude-User',        // Anthropic, visita en directo al responder
  'Google-Extended',    // Google, permiso de uso en Gemini y en las respuestas con IA
  'Applebot-Extended',  // Apple, permiso de uso en Apple Intelligence
]

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

  return {
    rules: [
      // Regla general. Antes habia ademas una regla propia para Googlebot,
      // identica salvo por /_next/ y /private/; se ha unificado, porque dos
      // reglas que dicen casi lo mismo solo sirven para desincronizarse.
      {
        userAgent: '*',
        allow: '/',
        disallow: ZONAS_CERRADAS,
      },
      ...RASTREADORES_IA.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ZONAS_CERRADAS,
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
