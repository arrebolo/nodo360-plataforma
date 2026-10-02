'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

/**
 * Si el formulario del curso tiene cambios que no se han guardado.
 *
 * POR QUE HACE FALTA COMPARTIRLO
 *   El formulario y el botón «Enviar a revisión» son dos componentes hermanos en la
 *   misma pantalla, y no se ven entre ellos. Sin esto, se podía elegir la especialidad,
 *   NO guardar, y pulsar enviar: el servidor leía la base —donde seguía sin
 *   especialidad— y rechazaba el envío por algo que en pantalla parecía resuelto.
 *
 *   Un contexto y no un `window.algo`: así TypeScript sabe de qué estamos hablando y
 *   el estado muere con la pantalla.
 *
 * Al guardar, la acción de servidor redirige y la pantalla se vuelve a montar, así que
 * el estado se queda en falso por sí solo: no hay que acordarse de limpiarlo.
 */
type Valor = {
  hayCambios: boolean
  marcarCambios: (hay: boolean) => void
}

const Contexto = createContext<Valor>({
  hayCambios: false,
  marcarCambios: () => {},
})

export function CambiosSinGuardar({ children }: { children: ReactNode }) {
  const [hayCambios, setHayCambios] = useState(false)
  const marcarCambios = useCallback((hay: boolean) => setHayCambios(hay), [])

  return (
    <Contexto.Provider value={{ hayCambios, marcarCambios }}>{children}</Contexto.Provider>
  )
}

export function useCambiosSinGuardar(): Valor {
  return useContext(Contexto)
}
