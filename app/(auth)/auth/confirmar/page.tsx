import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertCircle, KeyRound, Mail, UserCheck } from 'lucide-react'
import { confirmarEnlace } from './actions'
import { BotonConfirmar } from './BotonConfirmar'
import { esTipoDeEnlace, type TipoDeEnlace } from './tipos'

/**
 * A donde llevan los enlaces de los correos de Supabase (acceso, recuperación y
 * confirmación del registro), con token_hash en vez del `code` de PKCE.
 *
 * ABRIR ESTA PÁGINA NO GASTA EL ENLACE. Solo muestra un botón; la verificación
 * es un POST (confirmarEnlace, en actions.ts). Los escáneres de enlaces de algunos
 * correos y antivirus abren cada enlace al recibirlo: con un GET que verificara,
 * el enlace le llegaría gastado a la persona.
 *
 * La URL lleva un token sin usar, así que ni se indexa ni se envía como referer,
 * y GA4 no se carga aquí (components/analytics/GoogleAnalyticsTag.tsx).
 */
export const metadata: Metadata = {
  title: 'Confirmar',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

const TEXTOS: Record<TipoDeEnlace, { titulo: string; texto: string; boton: string; icono: typeof Mail }> = {
  email: { titulo: 'Entrar en Nodo360', texto: 'Pulsa el botón para entrar con tu cuenta.', boton: 'Entrar', icono: Mail },
  magiclink: { titulo: 'Entrar en Nodo360', texto: 'Pulsa el botón para entrar con tu cuenta.', boton: 'Entrar', icono: Mail },
  signup: { titulo: 'Confirma tu correo', texto: 'Pulsa el botón para confirmar tu correo y entrar.', boton: 'Confirmar mi correo', icono: UserCheck },
  recovery: { titulo: 'Recuperar tu contraseña', texto: 'Pulsa el botón para elegir una contraseña nueva.', boton: 'Elegir contraseña nueva', icono: KeyRound },
}

export default async function ConfirmarPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>
}) {
  const { token_hash: tokenHash, type } = await searchParams
  const valido = !!tokenHash && esTipoDeEnlace(type)

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          {valido ? (
            <Formulario tokenHash={tokenHash} tipo={type} />
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">El enlace no es válido</h1>
              <p className="text-white/60 mb-6">
                Puede que se haya copiado incompleto. Pide uno nuevo desde la página de acceso.
              </p>
              <Link href="/login" className="text-brand hover:text-brand-light font-medium">
                Ir a iniciar sesión
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Formulario({ tokenHash, tipo }: { tokenHash: string; tipo: TipoDeEnlace }) {
  const t = TEXTOS[tipo]
  const Icono = t.icono
  return (
    <>
      <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-6">
        <Icono className="w-8 h-8 text-brand" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">{t.titulo}</h1>
      <p className="text-white/60 mb-6">{t.texto}</p>
      <form action={confirmarEnlace}>
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="type" value={tipo} />
        <BotonConfirmar texto={t.boton} />
      </form>
      <p className="text-white/40 text-xs mt-6">
        Puedes abrir este enlace en cualquier navegador o dispositivo. Solo vale una vez.
      </p>
    </>
  )
}
