/**
 * Los tutoriales de /tutoriales: qué campos tiene cada uno y qué valores admite.
 *
 * El contenido vive en content/tutoriales/<slug>/tutorial.md (cabecera YAML +
 * Markdown), revisado por PR. Este archivo no lee nada: solo declara la forma.
 * La guía de estilo está en docs/TUTORIALES.md.
 */
import type { SlugCurso, SlugLeccion } from '@/lib/enlazado/cursos-publicados'

export const CATEGORIAS = {
  verificacion: 'Verificación y descargas',
  carteras: 'Carteras',
  transacciones: 'Transacciones',
  nodo: 'Nodo',
  privacidad: 'Privacidad',
} as const
export type Categoria = keyof typeof CATEGORIAS

/** Las mismas claves que `courses.level`, para poder filtrar igual. */
export const NIVELES = {
  beginner: 'Básico',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
} as const
export type Nivel = keyof typeof NIVELES

export const SISTEMAS = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
} as const
export type Sistema = keyof typeof SISTEMAS

/** La red en la que se hace. signet en todos mientras no se decida otra cosa. */
export const REDES = {
  ninguna: 'No mueve monedas',
  signet: 'Signet (monedas de prueba, sin valor)',
  mainnet: 'Red principal (dinero real)',
} as const
export type Red = keyof typeof REDES

/**
 * borrador: solo se ve en desarrollo y en las previsualizaciones de Vercel.
 * publicado: se ve en producción.
 * revisar: publicado, con el aviso de que puede estar desfasado. Lo pone una
 *          persona (docs/TUTORIALES.md, sección 9).
 */
export const ESTADOS = ['borrador', 'publicado', 'revisar'] as const
export type Estado = (typeof ESTADOS)[number]

export type Requisito = { texto: string } | { tutorial: string }

export interface Programa {
  nombre: string
  version: string
  /** Página oficial de descarga. Nunca un espejo. */
  descargaOficial: string
  /** Repositorio público, para vigilar las versiones nuevas. */
  repositorio?: string
  /** Fecha (AAAA-MM-DD) en que se hizo el tutorial entero con esta versión. */
  probadoEl?: string
  /** Sistemas y versiones en los que se probó, en texto. */
  probadoEn?: string
}

export interface CursoRelacionado {
  curso: SlugCurso
  leccion?: SlugLeccion
}

/** Una captura ya convertida, tal como la deja scripts/preparar-capturas.mts. */
export interface Captura {
  ancho: number
  alto: number
  bytes: number
}

export interface Tutorial {
  slug: string
  titulo: string
  /** 160 caracteres como máximo: es la descripción para buscadores. */
  resumen: string
  categoria: Categoria
  nivel: Nivel
  duracionMinutos: number
  sistemas: Sistema[]
  red: Red
  requisitos: Requisito[]
  programas: Programa[]
  cursos: CursoRelacionado[]
  /** Slugs del glosario. */
  terminos: string[]
  publicadoEl?: string
  revisadoEl?: string
  estado: Estado
  /** El cuerpo en Markdown, sin la cabecera. */
  cuerpo: string
  /** Las capturas que ya existen en public/tutoriales/<slug>/, por nombre. */
  capturas: Record<string, Captura>
}
