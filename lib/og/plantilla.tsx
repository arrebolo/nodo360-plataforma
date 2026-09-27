/* eslint-disable @next/next/no-img-element -- Esto no es una pagina: es el
   arbol que Satori rasteriza dentro de ImageResponse, donde next/image no
   existe. El unico elemento de imagen posible es <img>. */
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  MAXIMO_SUBTITULO,
  MAXIMO_TITULAR,
  recortar,
  tamanoSubtitulo,
  tamanoTitular,
} from '@/lib/og/texto'

/**
 * La tarjeta Open Graph de Nodo360, en un solo sitio.
 *
 * Todas las imagenes del sitio salen de aqui: cambiar el color o el pie se hace
 * una vez. Los colores son los del sistema de diseno (app/globals.css):
 * --color-dark #0a0f1a de fondo y --color-brand #f7931a de acento, que es el
 * mismo naranja que usan las plantillas de correo.
 */

export const TAMANO_OG = { width: 1200, height: 630 }
export const TIPO_OG = 'image/png'

const COLOR = {
  fondo: '#0a0f1a',
  superficie: '#1a1f2e',
  marca: '#f7931a',
  marcaClara: '#ff6b35',
  texto: '#ffffff',
  apagado: '#C5C7D3',
  borde: 'rgba(255,255,255,0.10)',
}

// Se leen una vez por proceso, no en cada imagen. La fuente va en el repositorio
// (Inter, SIL OFL, ver lib/og/Inter-LICENSE.txt): generar una imagen no puede
// depender de que una fuente remota conteste.
const raiz = (...partes: string[]) => join(process.cwd(), 'lib', 'og', ...partes)

let cacheFuentes: Promise<{ regular: Buffer; negrita: Buffer }> | null = null
function fuentes() {
  if (!cacheFuentes) {
    cacheFuentes = Promise.all([
      readFile(raiz('Inter-Regular.woff')),
      readFile(raiz('Inter-Bold.woff')),
    ]).then(([regular, negrita]) => ({ regular, negrita }))
  }
  return cacheFuentes
}

let cacheLogo: Promise<string> | null = null
function logo() {
  if (!cacheLogo) {
    cacheLogo = readFile(join(process.cwd(), 'public', 'imagenes', 'logo-nodo360.png'))
      .then((b) => `data:image/png;base64,${b.toString('base64')}`)
  }
  return cacheLogo
}

export interface DatosTarjeta {
  /** Lo que se lee primero y mas grande. */
  titular: string
  /** Linea de apoyo bajo el titular. Opcional. */
  subtitulo?: string | null
  /** Etiqueta pequena sobre el titular: "Curso", "Glosario"… Opcional. */
  seccion?: string | null
  /** Pastillas de datos: nivel, numero de lecciones, "Gratis"… */
  etiquetas?: string[]
  /**
   * Portada del sitio: logo grande centrado con la marca debajo, sin la
   * cabecera pequena. Solo la usa app/opengraph-image.tsx.
   */
  portada?: boolean
  /**
   * Cuanto texto cabe en el subtitulo. Por defecto 120, que es el limite que
   * pide el glosario para las definiciones. Las descripciones del blog rondan
   * los 155 y con 120 se cortaban a media frase, asi que esa tarjeta pide mas.
   */
  maximoSubtitulo?: number
}

export async function crearImagenOg(datos: DatosTarjeta): Promise<ImageResponse> {
  const [{ regular, negrita }, logoDataUri] = await Promise.all([fuentes(), logo()])

  const titular = recortar(datos.titular, MAXIMO_TITULAR)
  const subtitulo = datos.subtitulo
    ? recortar(datos.subtitulo, datos.maximoSubtitulo ?? MAXIMO_SUBTITULO)
    : null
  const etiquetas = (datos.etiquetas ?? []).filter(Boolean)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: COLOR.fondo,
          // Un solo destello naranja arriba a la izquierda, sin estridencias.
          backgroundImage: `radial-gradient(900px circle at 0% 0%, rgba(247,147,26,0.16), transparent 60%)`,
          padding: '64px 72px',
          fontFamily: 'Inter',
        }}
      >
        {/* Filo de marca */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 8,
            display: 'flex',
            backgroundColor: COLOR.marca,
          }}
        />

        {/* Cabecera: marca. En la portada no va, porque el logo manda alli. */}
        {!datos.portada && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={logoDataUri}
              alt=""
              width={72}
              height={72}
              style={{ borderRadius: 18, border: `1px solid ${COLOR.borde}` }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20 }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: COLOR.texto, lineHeight: 1.1 }}>
                Nodo360
              </div>
              <div style={{ fontSize: 19, color: COLOR.apagado, marginTop: 2 }}>
                nodo360.com
              </div>
            </div>
          </div>
        )}

        {/* Cuerpo */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: datos.portada ? 'center' : 'flex-start',
            textAlign: datos.portada ? 'center' : 'left',
          }}
        >
          {datos.portada && (
            <img
              src={logoDataUri}
              alt=""
              width={150}
              height={150}
              style={{ borderRadius: 34, border: `1px solid ${COLOR.borde}`, marginBottom: 28 }}
            />
          )}

          {datos.seccion && (
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: COLOR.marca,
                marginBottom: 18,
              }}
            >
              {datos.seccion}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              fontSize: tamanoTitular(titular),
              fontWeight: 700,
              color: COLOR.texto,
              lineHeight: 1.12,
              letterSpacing: -1,
              maxWidth: datos.portada ? 900 : '100%',
            }}
          >
            {titular}
          </div>

          {subtitulo && (
            <div
              style={{
                display: 'flex',
                fontSize: tamanoSubtitulo(subtitulo),
                color: COLOR.apagado,
                lineHeight: 1.35,
                marginTop: 22,
                maxWidth: datos.portada ? 860 : 1000,
              }}
            >
              {subtitulo}
            </div>
          )}
        </div>

        {/* Pie: pastillas de datos */}
        {etiquetas.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {etiquetas.map((etiqueta, i) => (
              <div
                key={etiqueta}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 24,
                  fontWeight: 700,
                  color: i === 0 ? COLOR.fondo : COLOR.apagado,
                  backgroundColor: i === 0 ? COLOR.marca : COLOR.superficie,
                  border: `1px solid ${i === 0 ? COLOR.marca : COLOR.borde}`,
                  borderRadius: 999,
                  padding: '10px 24px',
                  marginRight: 14,
                }}
              >
                {etiqueta}
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    {
      ...TAMANO_OG,
      fonts: [
        { name: 'Inter', data: regular, weight: 400, style: 'normal' },
        { name: 'Inter', data: negrita, weight: 700, style: 'normal' },
      ],
    }
  )
}

/** Texto alternativo por defecto, para que og:image:alt nunca quede vacio. */
export function altPorDefecto(titular: string): string {
  return `${titular} — Nodo360`
}
