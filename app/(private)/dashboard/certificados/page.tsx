import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Award, Download, ExternalLink, Calendar, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Mis Certificados | Nodo360',
  description: 'Todos tus certificados obtenidos'
}

export default async function MisCertificadosPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Obtener certificados del usuario
  const { data: certificates } = await supabase
    .from('certificates')
    .select(`
      id,
      certificate_number,
      type,
      issued_at,
      expires_at,
      certificate_url,
      verification_url,
      course:courses(title, slug),
      module:modules(title)
    `)
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  const certs = certificates || []
  const courseCerts = certs.filter((c: any) => c.type === 'course')
  const moduleCerts = certs.filter((c: any) => c.type === 'module')

  return (
    <div className="min-h-screen bg-[#070a10]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        {/* Header */}
        <PageHeader
          icon={Award}
          title="Mis Certificados"
          description={`${certs.length} certificado${certs.length !== 1 ? 's' : ''} obtenido${certs.length !== 1 ? 's' : ''}`}
        />

        {certs.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Aun no tienes certificados</h2>
            <p className="text-white/60 mb-6">Completa cursos o modulos para obtener certificados.</p>
            <Button href="/cursos">
              Explorar cursos
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Certificados de curso */}
            {courseCerts.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#f7931a]/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-[#f7931a]" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    Certificados de Curso ({courseCerts.length})
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {courseCerts.map((cert: any) => (
                    <div
                      key={cert.id}
                      className="rounded-2xl border border-[#f7931a]/30 bg-gradient-to-br from-[#f7931a]/10 to-transparent p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
                          <Award className="w-6 h-6 text-white" />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-[#f7931a]/20 text-[#f7931a] text-xs font-semibold">
                          Curso Completo
                        </span>
                      </div>
                      <h3 className="font-semibold text-white text-lg mb-2">
                        {cert.course?.title || 'Curso'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Emitido el {new Date(cert.issued_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <code className="block text-xs text-white/40 bg-black/20 rounded-lg px-3 py-2 mb-4 font-mono">
                        {cert.certificate_number}
                      </code>
                      <div className="flex gap-3">
                        <Button
                          href={`/certificados/${cert.id}`}
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver
                        </Button>
                        {cert.certificate_url && (
                          <a
                            href={cert.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white text-sm font-semibold hover:opacity-90 transition"
                          >
                            <Download className="w-4 h-4" />
                            Descargar
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certificados de modulo */}
            {moduleCerts.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    Certificados de Modulo ({moduleCerts.length})
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {moduleCerts.map((cert: any) => (
                    <div
                      key={cert.id}
                      className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <Award className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-medium">
                          Modulo
                        </span>
                      </div>
                      <h3 className="font-semibold text-white mb-1">
                        {cert.module?.title || 'Modulo'}
                      </h3>
                      <p className="text-sm text-white/50 mb-3">
                        {cert.course?.title}
                      </p>
                      <div className="text-xs text-white/40 mb-3">
                        {new Date(cert.issued_at).toLocaleDateString('es-ES')}
                      </div>
                      <Link
                        href={`/certificados/${cert.id}`}
                        className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition"
                      >
                        Ver certificado
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
