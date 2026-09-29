import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CertificateQR } from '@/components/certificates/CertificateQR'
import { ShareButtons } from '@/components/certificates/ShareButtons'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

function formatLongEs(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
}

type PageProps = {
  params: Promise<{ verificationCode: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: 'Verificar Certificado',
    description: 'Verifica la autenticidad de un certificado de Nodo360',
  }
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { verificationCode } = await params
  const supabase = await createClient()

  // Una sola llamada, a la puerta publica de la migracion 051.
  //
  // Antes eran cuatro consultas directas a certificates, courses, users y
  // modules. Ninguna de esas tablas se sirve ya entera con la clave anonima:
  // certificates esta cerrada (051), users solo expone columnas publicas (049)
  // y lessons/modules dependen del estado del curso (050). La funcion resuelve
  // las cuatro por dentro y devuelve solo lo que esta pagina pinta, sin
  // user_id, y sin permitir listar la tabla.
  const { data: filas } = await supabase.rpc('verificar_certificado', {
    p_codigo: verificationCode,
  })

  const cert = Array.isArray(filas) ? filas[0] : filas
  if (!cert) {
    return <CertificateNotFound verificationCode={verificationCode} />
  }

  const moduleTitle: string | null = cert.modulo_titulo || null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://nodo360.com'
  const verificationUrl = `${siteUrl}/verificar/${cert.certificate_number}`

  const userName = cert.titular || 'Estudiante'
  // Manda el titulo guardado en el certificado, que es lo que acredita: lo que
  // se completo entonces, no como se llame el curso hoy (migracion 053). La
  // funcion ya lo resuelve con COALESCE; esta precedencia es el respaldo si
  // alguna vez devolviera los dos campos sin resolver.
  const courseTitle = cert.titulo_certificado || cert.curso_titulo || 'Curso'
  const courseDescription = cert.curso_descripcion || ''
  const displayTitle = cert.tipo === 'module' && moduleTitle ? moduleTitle : courseTitle

  const issuedAt = cert.issued_at ? formatLongEs(cert.issued_at) : null
  // La fecha que ACREDITA el certificado es la de finalizacion del curso, no
  // la de emision: pueden separarse dias y son cosas distintas. completado_en
  // lo devuelve verificar_certificado desde la migracion 075; si el codigo se
  // despliega antes, llega undefined y se cae a la de emision, que es lo que
  // se mostraba hasta ahora.
  const fechaQueAcredita = cert.completado_en
    ? formatLongEs(cert.completado_en)
    : issuedAt

  const expiresAt = cert.expires_at ? formatLongEs(cert.expires_at) : null
  const isExpired = !!cert.expires_at && new Date(cert.expires_at).getTime() < Date.now()

  // revocado lo devuelve verificar_certificado desde la migracion 074. Si el
  // codigo se despliega antes que la migracion, el campo llega undefined y
  // cae en false: el certificado se ve como estaba. Esa es la caida buena.
  const revocado = cert.revocado === true

  // El escudo con el tick significa "verificado". En un certificado retirado
  // dice lo contrario de lo que pone a su lado, asi que se cambia por un
  // icono de informacion, que no afirma nada. Son los tres del mismo dibujo:
  // la insignia de estado, el pie de la tarjeta y el recuadro de comprobacion.
  const ESCUDO_VERIFICADO =
    'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
  const CIRCULO_INFORMACION =
    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  const iconoDeEstado = revocado ? CIRCULO_INFORMACION : ESCUDO_VERIFICADO
  const status: 'valid' | 'expired' | 'revoked' = revocado
    ? 'revoked'
    : isExpired
      ? 'expired'
      : 'valid'

  return (
    <div className="min-h-screen bg-dark">
      {/* Sin cabecera propia: app/layout.tsx ya pinta SiteHeaderServer, asi que
          esta pagina salia con DOS cabeceras, una encima de otra, y la segunda
          con un logo distinto. */}

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Badge de verificacion */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            status === 'valid'
              ? 'bg-success/20 border border-success/30'
              : status === 'revoked'
                ? 'bg-red-500/20 border border-red-500/30'
                : 'bg-warning/20 border border-warning/30'
          }`}>
            <svg className={`w-5 h-5 ${status === 'valid' ? 'text-success' : status === 'revoked' ? 'text-red-400' : 'text-warning'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconoDeEstado} />
            </svg>
            <span className={`font-medium ${status === 'valid' ? 'text-success' : status === 'revoked' ? 'text-red-300' : 'text-warning'}`}>
              {status === 'valid'
                ? 'Certificado Verificado'
                : status === 'revoked'
                  ? 'Certificado retirado'
                  : 'Certificado Expirado'}
            </span>
          </div>
        </div>

        {/* El motivo guardado en revoked_reason NO se pinta: este texto es el
            mismo para todos los casos. Quien verifica necesita saber que el
            certificado no vale y de quien fue el fallo; no necesita saber
            nada de la persona que lo tiene. */}
        {revocado && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="text-red-100">
              Este certificado se emitió por un error de la plataforma y ha sido
              retirado. No acredita la finalización del curso.
            </p>
          </div>
        )}

        {/* Card principal */}
        <div className="bg-dark-surface border border-white/10 rounded-2xl overflow-hidden">
          {/* Header del card */}
          <div className="bg-gradient-to-r from-brand-light/10 to-brand/10 border-b border-white/10 p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                    {revocado
                      ? 'Certificado retirado'
                      : `Certificado de ${cert.tipo === 'module' ? 'Modulo' : 'Finalizacion'}`}
                  </p>
                  <h1 className="text-xl font-bold text-white">{displayTitle}</h1>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50 mb-1">No de certificado</p>
                <p className="text-brand-light font-mono text-sm">{cert.certificate_number}</p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Info del certificado */}
              <div className="md:col-span-2 space-y-6">
                {/* Emitido para */}
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Emitido para</p>
                  <p className="text-2xl font-semibold text-white">{userName}</p>
                </div>

                {/* Curso */}
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                    {revocado
                      ? 'Curso'
                      : cert.tipo === 'module'
                        ? 'Módulo del curso'
                        : 'Curso completado'}
                  </p>
                  <p className="text-lg text-white font-medium">{courseTitle}</p>
                  {courseDescription && (
                    <p className="text-white/60 text-sm mt-1 line-clamp-2">{courseDescription}</p>
                  )}
                </div>

                {/* Detalles */}
                <div className="flex flex-wrap gap-6">
                  {issuedAt && (
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Fecha de emisión</p>
                      <p className="text-white/80">{issuedAt}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Validez</p>
                    <p className={revocado ? 'text-red-300' : 'text-white/80'}>
                      {revocado ? 'Retirado' : expiresAt || 'Permanente'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Tipo</p>
                    <p className="text-white/80">{cert.tipo === 'module' ? 'Modulo' : 'Curso'}</p>
                  </div>
                </div>

                {/* Que acredita exactamente este certificado.
                    Los cursos se amplian: uno que tenia 6 lecciones puede
                    tener 9 hoy. El certificado no caduca por eso, pero quien
                    lo verifica tiene derecho a saber sobre que se emitio, y
                    quien lo presenta, a que no parezca incompleto. */}
                {issuedAt && !revocado && (
                  <p className="mt-6 text-sm text-white/50 border-t border-white/10 pt-4">
                    Acredita el temario vigente el {fechaQueAcredita}, fecha en que se
                    completó el curso. El curso puede haberse ampliado después; eso no
                    afecta a la validez de este certificado.
                  </p>
                )}

                {/* Compartir. En uno retirado no: no hay ningun logro que
                    compartir, y ofrecer el boton al lado del aviso de que se
                    retiro es una contradiccion en la misma pantalla. */}
                {!revocado && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Compartir este logro</p>
                    <ShareButtons
                      courseTitle={displayTitle}
                      verificationUrl={verificationUrl}
                    />
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Escanea para verificar</p>
                <CertificateQR verificationUrl={verificationUrl} size={140} />
                <p className="text-xs text-white/40 mt-4 text-center max-w-[160px]">
                  Este código QR enlaza a la verificación oficial
                </p>
              </div>
            </div>
          </div>

          {/* Footer del card */}
          <div className="bg-white/[0.02] border-t border-white/10 p-4">
            <div className="flex items-center justify-between text-sm flex-wrap gap-3">
              <div className="flex items-center gap-2 text-white/40">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconoDeEstado} />
                </svg>
                <span>{revocado ? 'Estado comprobado por Nodo360' : 'Verificado por Nodo360'}</span>
              </div>
              <Link
                href="/cursos"
                className="text-brand-light hover:text-brand transition flex items-center gap-1"
              >
                <span>Explorar cursos</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="p-5 bg-dark-surface border border-white/10 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-light/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconoDeEstado} />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">
                  {revocado ? 'Comprobación' : 'Verificación segura'}
                </h3>
                <p className="text-sm text-white/50">
                  {revocado
                    ? 'El número de certificado existe y su estado es el que se muestra arriba: retirado. Esta página es la fuente oficial de ese estado.'
                    : 'Este certificado ha sido verificado. El código QR y el número único garantizan su autenticidad.'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-dark-surface border border-white/10 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-light/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Sobre Nodo360</h3>
                <p className="text-sm text-white/50">
                  Plataforma educativa especializada en Bitcoin, Blockchain y Web3. Formación de calidad en español.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-white/30">
          {new Date().getFullYear()} Nodo360 - Verificación pública de certificados
        </div>
      </div>
    </div>
  )
}

// Componente para certificado no encontrado
function CertificateNotFound({ verificationCode }: { verificationCode: string }) {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-error/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Certificado no encontrado</h1>
        <p className="text-white/60 mb-2">
          No pudimos encontrar un certificado con el número:
        </p>
        <p className="text-brand-light font-mono text-sm mb-6 break-all">{verificationCode}</p>
        <p className="text-white/40 text-sm mb-6">
          Verifica que el número sea correcto o contacta con soporte si crees que es un error.
        </p>
        <Link
          href="/cursos"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-medium rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition"
        >
          <span>Explorar cursos</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
