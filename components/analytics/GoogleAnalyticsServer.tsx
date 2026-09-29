import GoogleAnalytics from './GoogleAnalyticsTag'
import { isCurrentUserAdmin } from '@/lib/auth/isAdmin'

/**
 * Resuelve en el servidor si la sesion es de administracion y se lo pasa a la
 * etiqueta, que es un componente de cliente y no puede preguntarselo a Supabase
 * sin exponer la consulta.
 *
 * El rol sale de `public.users.role` por `isCurrentUserAdmin()`, con el cliente
 * de sesion: la 049 dejo `role` entre las seis columnas legibles y la RLS limita
 * la fila a la propia. No hay forma de que el navegador mienta sobre esto.
 *
 * Cuesta una consulta por render, de una fila por clave primaria. Si algun dia
 * molesta, lo que se cae es solo la marca `traffic_type`: la exclusion de /admin
 * no depende de esto.
 *
 * Cuando GA no se va a cargar, no se pregunta nada.
 */
export default async function GoogleAnalyticsServer() {
  const apagado =
    process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_GA_DISABLED === 'true'

  if (apagado) return <GoogleAnalytics />

  const esInterno = await isCurrentUserAdmin()
  return <GoogleAnalytics esInterno={esInterno} />
}
