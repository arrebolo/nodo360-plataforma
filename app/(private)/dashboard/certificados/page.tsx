// app/(private)/dashboard/certificados/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, Calendar, Download, ExternalLink, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Mis Certificados | Nodo360',
  description: 'Consulta y descarga tus certificados de Nodo360',
}

export default async function DashboardCertificatesPage() {
  const supabase = await createClient()

  // 1) Usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login?redirect=/dashboard/certificados')
  }

  // 2) Traer certificados del usuario con thumbnail del curso + URL verificación
  const { data: certificates, error } = await supabase
    .from('certificates')
    .select(
      `
      id,
      certificate_number,
      title,
      description,
      issued_at,
      verification_url,
      course:course_id (
        id,
        title,
        slug,
        thumbnail_url,
        level
      )
    `
    )
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  if (error) {
    console.error('[DashboardCertificados] Error obteniendo certificados:', error)
  }

  const list = certificates || []

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#f7931a] to-[#ff6b35] rounded-xl shadow-lg shadow-[#f7931a]/20">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff6b35] to-[#f7931a] bg-clip-text text-transparent">
                Mis Certificados
              </h1>
              <p className="text-gray-400 mt-1">
                {list.length} certificado{list.length !== 1 ? 's' : ''} obtenido{list.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {list.length === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#f7931a]/20 to-[#ff6b35]/20 rounded-full flex items-center justify-center">
              <Award className="w-10 h-10 text-[#f7931a]" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Todavia no tienes certificados</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Completa tus primeros cursos para desbloquear certificados verificables que puedes compartir en LinkedIn y otras redes.
            </p>
            <Link
              href="/cursos"
              className="inline-block bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-[#f7931a]/20"
            >
              Explorar Cursos
            </Link>
          </div>
        )}

        {/* Certificates Grid */}
        {list.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((cert: any) => {
              const issuedDate = cert.issued_at
                ? new Date(cert.issued_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Fecha no disponible'

              const courseTitle = cert.course?.title || cert.title || 'Curso'
              const thumbnailUrl = cert.course?.thumbnail_url
              const courseLevel = cert.course?.level || 'beginner'
              const levelText =
                courseLevel === 'beginner'
                  ? 'Principiante'
                  : courseLevel === 'intermediate'
                  ? 'Intermedio'
                  : courseLevel === 'advanced'
                  ? 'Avanzado'
                  : courseLevel

              // 🔗 URL de verificación pública
              const verificationUrl: string =
                cert.verification_url ||
                `/certificados/${encodeURIComponent(cert.certificate_number)}`

              return (
                <div
                  key={cert.id}
                  className="group bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-[#f7931a]/50 transition-all hover:shadow-lg hover:shadow-[#f7931a]/10"
                >
                  {/* Thumbnail */}
                  <div className="relative h-36 bg-gradient-to-br from-[#1c1f3d] to-[#f7931a]/30">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={courseTitle}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Award className="w-16 h-16 text-[#f7931a]/50" />
                      </div>
                    )}
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] via-transparent to-transparent" />
                    {/* Badge */}
                    <div className="absolute top-3 right-3 p-2 bg-gradient-to-br from-[#f7931a] to-[#ff6b35] rounded-full shadow-lg">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    {/* Level badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xs px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white capitalize">
                        {levelText}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-lg mb-2 text-white group-hover:text-[#f7931a] transition-colors line-clamp-2">
                      {courseTitle}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>Emitido el {issuedDate}</span>
                    </div>

                    {/* Certificate Number */}
                    <div className="bg-white/5 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-500 mb-1">Numero de certificado</p>
                      <p className="text-[#f7931a] font-mono text-sm font-medium truncate">
                        {cert.certificate_number}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <a
                        href={`/api/certificates/${encodeURIComponent(cert.certificate_number)}/download`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#f7931a] to-[#ff6b35] hover:opacity-90 rounded-lg text-white text-sm font-medium transition-all"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </a>
                      <Link
                        href={verificationUrl}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info Section */}
        {list.length > 0 && (
          <div className="mt-12 p-6 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3">Sobre los Certificados</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#f7931a]">•</span>
                Los certificados se emiten automaticamente al completar todas las lecciones de un curso.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#f7931a]">•</span>
                Cada certificado incluye un enlace o código QR para verificación pública.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#f7931a]">•</span>
                Puedes compartir tu certificado en LinkedIn, Twitter y otras redes sociales.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#f7931a]">•</span>
                Los empleadores pueden verificar la autenticidad visitando la URL de verificación o escaneando el QR.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
