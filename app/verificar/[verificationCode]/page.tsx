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
    title: 'Verificar Certificado | Nodo360',
    description: 'Verifica la autenticidad de un certificado de Nodo360',
  }
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { verificationCode } = await params
  const supabase = await createClient()

  // Buscar certificado por certificate_number directamente
  const { data: certificate, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('certificate_number', verificationCode)
    .single()

  // Si no encontramos por certificate_number, intentar por verification_url
  let cert = certificate
  if (error || !certificate) {
    const { data: certByUrl } = await supabase
      .from('certificates')
      .select('*')
      .ilike('verification_url', `%${verificationCode}%`)
      .single()

    if (!certByUrl) {
      return <CertificateNotFound verificationCode={verificationCode} />
    }
    cert = certByUrl
  }

  // Obtener datos del curso
  const { data: course } = await supabase
    .from('courses')
    .select('title, slug, description')
    .eq('id', cert.course_id)
    .single()

  // Obtener datos del usuario
  const { data: userData } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', cert.user_id)
    .single()

  // Obtener datos del modulo si aplica
  let moduleTitle: string | null = null
  if (cert.module_id) {
    const { data: mod } = await supabase
      .from('modules')
      .select('title')
      .eq('id', cert.module_id)
      .single()
    moduleTitle = mod?.title || null
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://nodo360.com'
  const verificationUrl = `${siteUrl}/verificar/${cert.certificate_number}`

  const userName = userData?.full_name || userData?.email?.split('@')[0] || 'Estudiante'
  const courseTitle = course?.title || cert.title || 'Curso'
  const courseDescription = course?.description || ''
  const displayTitle = cert.type === 'module' && moduleTitle ? moduleTitle : courseTitle

  const issuedAt = cert.issued_at ? formatLongEs(cert.issued_at) : null
  const expiresAt = cert.expires_at ? formatLongEs(cert.expires_at) : null
  const isExpired = !!cert.expires_at && new Date(cert.expires_at).getTime() < Date.now()

  const status: 'valid' | 'expired' = isExpired ? 'expired' : 'valid'

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="border-b border-white/10 bg-dark-surface">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-white">Nodo360</span>
          </Link>
          <span className="text-sm text-white/50">Verificacion de Certificado</span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Badge de verificacion */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            status === 'valid'
              ? 'bg-success/20 border border-success/30'
              : 'bg-warning/20 border border-warning/30'
          }`}>
            <svg className={`w-5 h-5 ${status === 'valid' ? 'text-success' : 'text-warning'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className={`font-medium ${status === 'valid' ? 'text-success' : 'text-warning'}`}>
              {status === 'valid' ? 'Certificado Verificado' : 'Certificado Expirado'}
            </span>
          </div>
        </div>

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
                    Certificado de {cert.type === 'module' ? 'Modulo' : 'Finalizacion'}
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
                    {cert.type === 'module' ? 'Modulo del curso' : 'Curso completado'}
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
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Fecha de emision</p>
                      <p className="text-white/80">{issuedAt}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Validez</p>
                    <p className="text-white/80">{expiresAt || 'Permanente'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Tipo</p>
                    <p className="text-white/80">{cert.type === 'module' ? 'Modulo' : 'Curso'}</p>
                  </div>
                </div>

                {/* Acciones compartir */}
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Compartir este logro</p>
                  <ShareButtons
                    courseTitle={displayTitle}
                    verificationUrl={verificationUrl}
                  />
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Escanea para verificar</p>
                <CertificateQR verificationUrl={verificationUrl} size={140} />
                <p className="text-xs text-white/40 mt-4 text-center max-w-[160px]">
                  Este codigo QR enlaza a la verificacion oficial
                </p>
              </div>
            </div>
          </div>

          {/* Footer del card */}
          <div className="bg-white/[0.02] border-t border-white/10 p-4">
            <div className="flex items-center justify-between text-sm flex-wrap gap-3">
              <div className="flex items-center gap-2 text-white/40">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Verificado por Nodo360</span>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Verificacion segura</h3>
                <p className="text-sm text-white/50">
                  Este certificado ha sido verificado. El codigo QR y el numero unico garantizan su autenticidad.
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
                  Plataforma educativa especializada en Bitcoin, Blockchain y Web3. Formacion de calidad en espanol.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-white/30">
          {new Date().getFullYear()} Nodo360 - Verificacion publica de certificados
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
          No pudimos encontrar un certificado con el numero:
        </p>
        <p className="text-brand-light font-mono text-sm mb-6 break-all">{verificationCode}</p>
        <p className="text-white/40 text-sm mb-6">
          Verifica que el numero sea correcto o contacta con soporte si crees que es un error.
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
