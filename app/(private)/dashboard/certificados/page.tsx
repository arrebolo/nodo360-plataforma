import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CertificateCard } from '@/components/certificates/CertificateCard'
import { Award, BookOpen, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Mis Certificados | Nodo360',
  description: 'Todos tus certificados obtenidos',
}

function formatShortEs(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

type PageProps = {
  searchParams: Promise<{ courseSlug?: string; curso?: string }>
}

export default async function DashboardCertificatesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) {
    redirect('/login?redirect=/dashboard/certificados')
  }

  const courseSlug = params.courseSlug || params.curso

  // Obtener certificados con datos del curso y usuario
  // NOTA: user_name y score no existen en la tabla certificates
  // Obtenemos el nombre del usuario por separado y score desde quiz_attempts si aplica
  const { data: certificates, error } = await supabase
    .from('certificates')
    .select(`
      id,
      type,
      certificate_number,
      title,
      issued_at,
      expires_at,
      certificate_url,
      verification_url,
      course_id,
      module_id,
      course:courses(id, slug, title, description),
      module:modules(id, title)
    `)
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })

  // Obtener stats
  const { count: totalCertificates } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (error) {
    console.error('Error cargando certificados:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-xl font-semibold text-white">Mis certificados</h1>
        <p className="mt-2 text-sm text-white/60">
          Error cargando certificados: {error.message || error.code || 'Error desconocido'}
        </p>
        {error.hint && (
          <p className="mt-1 text-xs text-white/40">Hint: {error.hint}</p>
        )}
      </div>
    )
  }

  // Obtener nombre del usuario para mostrar en certificados
  const { data: userData2 } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const userName = userData2?.full_name || user.email?.split('@')[0] || 'Usuario'

  let list = certificates ?? []
  if (courseSlug) {
    list = list.filter((c: any) => c.course?.slug === courseSlug)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mis Certificados</h1>
            <p className="text-white/50 text-sm">
              {totalCertificates === 0
                ? 'Completa cursos para obtener certificados verificables'
                : `Has obtenido ${totalCertificates} certificado${totalCertificates !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>

        {/* Filtro activo */}
        {courseSlug && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-white/50">Filtrando por curso:</span>
            <Link
              href="/dashboard/certificados"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-light/20 text-brand-light text-sm rounded-full hover:bg-brand-light/30 transition"
            >
              <span>{courseSlug}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Lista de certificados */}
      {list.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Award className="w-10 h-10 text-white/20" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {courseSlug ? 'No tienes certificados para este curso' : 'Aun no tienes certificados'}
          </h3>
          <p className="text-white/50 mb-6 max-w-md mx-auto">
            Completa cursos y aprueba los quizzes finales para obtener certificados verificables que puedes compartir en tu perfil profesional.
          </p>
          <Link
            href="/cursos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-medium rounded-xl hover:shadow-lg hover:shadow-brand-light/25 transition"
          >
            <BookOpen className="w-5 h-5" />
            <span>Explorar cursos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {list.map((c: any) => {
            const title =
              c.type === 'module' ? (c.module?.title ?? 'Modulo') : (c.course?.title ?? 'Curso')

            const subtitle = c.type === 'course' ? (c.course?.description ?? null) : null

            const verificationPath = (() => {
              if (typeof c.verification_url !== 'string') return `/verificar/${c.certificate_number}`
              try {
                const u = new URL(c.verification_url)
                return u.pathname
              } catch {
                if (c.verification_url.startsWith('/')) return c.verification_url
                return `/verificar/${c.certificate_number}`
              }
            })()

            return (
              <CertificateCard
                key={c.id}
                certificateNumber={c.certificate_number}
                title={title}
                subtitle={subtitle}
                issuedAt={c.issued_at ? formatShortEs(c.issued_at) : undefined}
                issuedAtISO={c.issued_at}
                type={c.type}
                verificationPath={verificationPath}
                pdfUrl={c.certificate_url}
                userName={userName}
              />
            )
          })}
        </div>
      )}

      {/* CTA para seguir aprendiendo */}
      {list.length > 0 && (
        <div className="mt-12 p-6 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Sigue aprendiendo
              </h3>
              <p className="text-white/60 text-sm">
                Explora mas cursos y consigue nuevos certificados para tu perfil profesional.
              </p>
            </div>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/15 transition whitespace-nowrap"
            >
              <span>Ver cursos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
