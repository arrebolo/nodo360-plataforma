/**
 * Los cursos publicados y sus lecciones, GENERADO desde la base.
 *
 * NO EDITAR A MANO. Se regenera con:
 *     node scripts/generar-cursos-publicados.mjs
 *
 * POR QUE EXISTE
 *   El enlazado interno del blog y del glosario apunta a cursos y lecciones que
 *   viven en la BASE DE DATOS, no en el repositorio. Sin una lista aqui, un slug
 *   mal escrito no se nota hasta que alguien pincha y se encuentra un 404.
 *
 *   Con esta lista, los tipos SlugCurso y SlugLeccion convierten un slug
 *   inexistente en un error de tsc, y scripts/validar-enlazado.ts comprueba
 *   ademas que la leccion pertenezca a su curso. Las dos cosas corren en el
 *   build, asi que un enlace roto no llega a produccion.
 *
 * LO QUE ESTA LISTA NO GARANTIZA
 *   Que siga al dia. Si se publica, se archiva o se renombra un curso en la
 *   base, hay que regenerarla. El dia que el enlazado falle sin motivo
 *   aparente, empezar por aqui.
 *
 * Generado el 2026-09-28 desde 10 cursos publicados y 81 lecciones.
 */

export const CURSOS_PUBLICADOS = {
  'fundamentos-blockchain': {
    titulo: "Blockchain: lo que Bitcoin no es",
    nivel: 'intermediate',
    lecciones: [
      'de-bitcoin-a-las-demas',
      'el-problema-que-resuelve-un-consenso',
      'del-registro-al-estado-compartido',
      'otras-formas-de-consenso',
      'que-se-gana-y-que-se-cede',
      'cadenas-con-permisos',
      'por-que-existen-redes-distintas',
      'capas-y-puentes',
      'como-leer-una-cadena-nueva',
    ],
  },
  'cold-storage-protege-tus-bitcoin': {
    titulo: "Cold Storage — Protege tus Bitcoin",
    nivel: 'intermediate',
    lecciones: [
      'hot-vs-cold-tu-modelo-de-amenazas',
      'tipos-de-cold-storage',
      'seed-phrases-tu-llave-maestra',
      'configurar-un-hardware-wallet',
      'backup-seguro-de-seeds',
      'verificacion-y-simulacro-de-recuperacion',
    ],
  },
  'como-funciona-bitcoin-nivel-basico': {
    titulo: "Cómo funciona Bitcoin (nivel básico)",
    nivel: 'beginner',
    lecciones: [
      'la-red-bitcoin-explicada-de-forma-sencilla',
      'claves-direcciones-y-propiedad',
      'que-es-una-transaccion-en-bitcoin',
      'que-es-la-blockchain-de-bitcoin',
      'mineria-y-prueba-de-trabajo',
      'descentralizacion-que-significa-realmente',
    ],
  },
  'ethereum-y-contratos-inteligentes': {
    titulo: "Ethereum y contratos inteligentes",
    nivel: 'intermediate',
    lecciones: [
      'de-un-registro-a-un-ordenador-compartido',
      'quien-paga-la-ejecucion',
      'lo-que-un-contrato-no-puede-hacer',
      'de-donde-sale-el-codigo-que-se-ejecuta',
      'quien-puede-cambiar-las-reglas',
      'las-cuatro-formas-de-perder-los-fondos',
      'firmas-permisos-y-orden-de-las-operaciones',
      'unidades-que-prometen-valer-un-euro',
      'como-leer-un-contrato',
    ],
  },
  'fundamentos-de-bitcoin': {
    titulo: "Fundamentos de Bitcoin",
    nivel: 'beginner',
    lecciones: [
      'que-es-el-dinero-y-por-que-importa',
      'el-problema-del-dinero-tradicional',
      'el-contexto-previo-a-bitcoin',
      'que-es-bitcoin',
      'por-que-bitcoin-es-diferente',
      'que-problemas-resuelve-realmente',
      'es-bitcoin-dinero-las-tres-funciones',
      'bitcoin-frente-al-dinero-fiat',
      'limites-y-criticas-a-bitcoin',
    ],
  },
  'nodos-bitcoin-tu-soberania-tecnica': {
    titulo: "Nodos Bitcoin - Tu Soberanía Técnica",
    nivel: 'intermediate',
    lecciones: [
      'el-rol-de-los-nodos-en-bitcoin',
      'soberania-sin-intermediarios',
      'tipos-de-nodos-y-sus-funciones',
      'hardware-y-software-elige-tu-setup',
      'instalacion-paso-a-paso',
      'mantenimiento-y-buenas-practicas',
    ],
  },
  'introduccion-a-web3': {
    titulo: "Qué es Web3 y qué no",
    nivel: 'beginner',
    lecciones: [
      'que-es-web2-y-como-funciona',
      'que-propone-web3',
      'que-cambia-y-que-no-cambia',
      'claves-identidad-y-acceso',
      'contratos-inteligentes-y-dapps',
      'tokens-y-nfts',
      'donde-aporta-y-donde-no',
      'como-mirar-un-proyecto',
      'que-sigue-despues',
    ],
  },
  'seguridad-basica-en-bitcoin-y-criptomonedas': {
    titulo: "Seguridad básica en Bitcoin y criptomonedas",
    nivel: 'beginner',
    lecciones: [
      'que-significa-ser-tu-propio-banco',
      'estafas-mas-habituales',
      'errores-comunes-de-los-principiantes',
      'claves-privadas-y-contrasenas',
      'dispositivos-y-seguridad',
      'buenas-practicas-minimas-de-seguridad',
      'que-es-la-custodia-de-criptomonedas',
      'custodia-propia-vs-custodios-terceros',
      'mentalidad-de-seguridad',
    ],
  },
  'introduccion-al-trading-de-criptomonedas': {
    titulo: "Trading: qué es y por qué casi nadie gana",
    nivel: 'beginner',
    lecciones: [
      'que-es-el-trading',
      'trading-inversion-y-uso',
      'de-donde-sale-el-dinero',
      'las-cuentas-que-no-se-hacen',
      'el-apalancamiento',
      'lo-que-hace-la-cabeza',
      'expectativas-realistas',
      'impuestos-y-obligaciones',
      'deberia-hacer-trading',
    ],
  },
  'uso-practico-de-bitcoin': {
    titulo: "Uso práctico de Bitcoin",
    nivel: 'beginner',
    lecciones: [
      'que-necesitas-para-usar-bitcoin',
      'como-se-consiguen-bitcoins',
      'estafas-y-phishing',
      'como-enviar-y-recibir-bitcoin',
      'comisiones-tiempos-y-confirmaciones',
      'errores-practicos-al-usar-bitcoin',
      'custodia-en-el-uso-diario',
      'privacidad-en-la-practica',
      'expectativas-realistas-al-usar-bitcoin',
    ],
  },
} as const

/** Slug de un curso publicado. Un valor que no este aqui es un error de tsc. */
export type SlugCurso = keyof typeof CURSOS_PUBLICADOS

/** Slug de cualquier leccion de un curso publicado. */
export type SlugLeccion =
  (typeof CURSOS_PUBLICADOS)[SlugCurso]['lecciones'][number]

/** Los niveles tal como los guarda la base, y como se dicen en espanol. */
export const NIVEL_EN_ESPANOL: Record<string, string> = {
  beginner: 'nivel basico',
  intermediate: 'nivel intermedio',
  advanced: 'nivel avanzado',
}
