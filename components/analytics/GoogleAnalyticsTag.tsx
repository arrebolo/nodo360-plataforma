'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { GoogleAnalytics as GA } from '@next/third-parties/google'

const GA_MEASUREMENT_ID = 'G-4L1V170N61'

/**
 * Rutas que no se miden: el panel de administracion.
 *
 * No es una preferencia estetica. Las visitas del panel las hace el equipo, y
 * mezcladas con las de fuera falsean todo lo que se mire despues: usuarios
 * activos, paginas mas vistas, duracion de la sesion. En GA4 aparecian titulos
 * como «Usuarios - Admin Panel» compitiendo con las paginas publicas.
 *
 * /dashboard/admin no existe hoy; esta puesto porque el dia que exista no se va
 * a acordar nadie de volver aqui.
 */
const RUTAS_INTERNAS = ['/admin', '/dashboard/admin']

/**
 * Rutas cuya URL lleva un secreto: /auth/confirmar trae el token_hash del enlace
 * del correo, todavía sin usar, y el page_view de GA4 envía la URL entera.
 */
const RUTAS_CON_SECRETOS = ['/auth/confirmar']

function noSeMide(ruta: string | null): boolean {
  if (!ruta) return false
  return [...RUTAS_INTERNAS, ...RUTAS_CON_SECRETOS].some(
    (prefijo) => ruta === prefijo || ruta.startsWith(`${prefijo}/`)
  )
}

/** La bandera que gtag.js consulta antes de enviar cada hit. */
const BANDERA_APAGADO = `ga-disable-${GA_MEASUREMENT_ID}`

function apagarEtiqueta(apagada: boolean) {
  if (typeof window === 'undefined') return
  ;(window as unknown as Record<string, boolean>)[BANDERA_APAGADO] = apagada
}

type Props = {
  /**
   * El rol de la sesion es admin. Lo resuelve GoogleAnalyticsServer contra
   * Supabase; nunca llega del cliente.
   */
  esInterno?: boolean
}

/**
 * GA4, con tres interruptores.
 *
 * 1. Fuera de produccion no se carga. 2. NEXT_PUBLIC_GA_DISABLED === 'true'
 * tampoco, para poder apagarlo en una preview o en local sin tocar codigo.
 * 3. En las rutas internas no se carga y, si ya estaba cargado por una
 * navegacion anterior, se calla.
 *
 * Ese tercer punto necesita la bandera `ga-disable-<ID>` y no basta con dejar de
 * renderizar el componente: desmontarlo no descarga el script ya inyectado, y
 * gtag.js seguiria enviando por su cuenta los page_view de las navegaciones
 * («page changes based on browser history events» de la medicion mejorada).
 * La bandera es el unico freno que gtag.js mira antes de CADA envio.
 *
 * Queda un hueco honesto: si la medicion mejorada esta activada en la propiedad,
 * su page_view de la navegacion puede salir en el mismo tick en que React aun no
 * ha vuelto a renderizar. Se cierra desde GA4 con un filtro de trafico interno;
 * desde el codigo no hay forma de adelantarse a ese listener.
 */
export default function GoogleAnalytics({ esInterno = false }: Props) {
  const ruta = usePathname()

  const apagadoPorEntorno =
    process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_GA_DISABLED === 'true'
  const medir = !apagadoPorEntorno && !noSeMide(ruta)

  // En el render, para adelantarse todo lo posible al page_view automatico.
  apagarEtiqueta(!medir)

  // Y en un efecto, porque el render del servidor no toca window.
  useEffect(() => {
    apagarEtiqueta(!medir)
  }, [medir])

  if (!medir) return null

  return (
    <>
      {/*
        Antes que la etiqueta, para que el ajuste ya este en la cola cuando
        gtag procese su `config`. @next/third-parties no deja pasar opciones al
        config, asi que el ajuste va por su cuenta.
        traffic_type: 'internal' no oculta nada por si solo; es la marca que
        permite filtrar estas visitas en GA4 sin perderlas.
      */}
      {esInterno && (
        <Script
          id="ga-trafico-interno"
          dangerouslySetInnerHTML={{
            __html: `
          window['dataLayer'] = window['dataLayer'] || [];
          function gtag(){window['dataLayer'].push(arguments);}
          gtag('set', { 'traffic_type': 'internal' });`,
          }}
        />
      )}
      <GA gaId={GA_MEASUREMENT_ID} />
    </>
  )
}
