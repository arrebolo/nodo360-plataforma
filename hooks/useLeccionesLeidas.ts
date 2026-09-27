'use client'

import { useEffect, useSyncExternalStore } from 'react'

const CLAVE = 'nodo360_lecciones_leidas'

/**
 * Cuantas lecciones distintas lleva leidas esta persona EN ESTA VISITA.
 *
 * Vive en sessionStorage a proposito, no en localStorage: la cifra solo se usa
 * para una invitacion del tipo "llevas 3 lecciones leidas, con cuenta se te
 * guardaria el progreso". Contar desde hace tres semanas para decir eso seria
 * raro, y ademas obligaria a limpiar la clave al registrarse. Con
 * sessionStorage la cuenta empieza y acaba con la pestana, que es justo lo que
 * significa "en esta visita".
 *
 * No sustituye a nada ni pretende ser progreso: el progreso de verdad necesita
 * cuenta, y eso es precisamente lo que la invitacion explica.
 *
 * POR QUE useSyncExternalStore Y NO useState + useEffect
 *   sessionStorage es un almacen externo a React, y leerlo con un setState
 *   dentro de un efecto provoca un render en cascada en cada leccion (la regla
 *   react-hooks/set-state-in-effect lo avisa). Esta es la herramienta que React
 *   tiene para exactamente esto, y ademas resuelve sola la hidratacion: en el
 *   servidor no hay sessionStorage, asi que el primer valor es 0.
 */

let leidas: string[] | null = null
const oyentes = new Set<() => void>()

function cargar(): string[] {
  if (leidas) return leidas
  try {
    const crudo = window.sessionStorage.getItem(CLAVE)
    const previas = crudo ? JSON.parse(crudo) : []
    leidas = Array.isArray(previas) ? previas : []
  } catch {
    // Navegacion privada, almacenamiento bloqueado o JSON corrupto. Se sigue
    // contando en memoria: nada de esto puede impedir leer una leccion.
    leidas = []
  }
  return leidas
}

function registrar(lessonId: string): void {
  const lista = cargar()
  if (lista.includes(lessonId)) return

  lista.push(lessonId)
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify(lista))
  } catch {
    // Si no se puede guardar, la cuenta vive solo en memoria y se pierde al
    // recargar. Es una cifra para una invitacion, no un dato del alumno.
  }
  for (const avisar of oyentes) avisar()
}

function suscribir(avisar: () => void): () => void {
  oyentes.add(avisar)
  return () => {
    oyentes.delete(avisar)
  }
}

const enCliente = () => cargar().length
const enServidor = () => 0

export function useLeccionesLeidas(lessonId: string | null): number {
  useEffect(() => {
    if (lessonId) registrar(lessonId)
  }, [lessonId])

  return useSyncExternalStore(suscribir, enCliente, enServidor)
}
