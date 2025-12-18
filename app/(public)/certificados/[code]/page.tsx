// app/(public)/certificados/[code]/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { getCertificateByCode } from '@/lib/db/certificates'
import CelebrationOverlay from '@/components/certificates/CelebrationOverlay'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const cert = await getCertificateByCode(resolvedParams.code)

  return {
    title: cert
      ? `Certificado ${cert.code} | ${cert.courseTitle} | Nodo360`
      : 'Certificado no encontrado | Nodo360',
    description: cert
      ? `Certificado de finalizacion de ${cert.courseTitle} emitido por Nodo360`
      : 'Verificacion de certificado de Nodo360',
  }
}

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function CertificatePage({ params }: PageProps) {
  const resolvedParams = await params
  const { code } = resolvedParams

  const cert = await getCertificateByCode(code)

  if (!cert) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-[#050608] px-4">
        <div className="max-w-md w-full bg-[rgba(38,36,33,0.96)] border border-[rgba(250,244,237,0.14)] rounded-[18px] p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-[20px] font-bold mb-3 text-[#FAF4ED]">
            Certificado no encontrado
          </h1>
          <p className="text-[14px] text-[#D7D3CE] mb-6">
            El codigo <span className="font-mono text-[#F7931A]">{code}</span> no corresponde a un certificado valido en Nodo360.
          </p>
          <Link
            href="/rutas"
            className="inline-block bg-gradient-to-r from-[#4CAF7A] to-[#F7931A] text-[#1F1E1B] px-5 py-2 rounded-full text-[14px] font-semibold"
          >
            Explorar cursos
          </Link>
        </div>
      </main>
    )
  }

  // Formatear fecha
  const issuedDate = new Date(cert.issuedAt)
  const formattedDate = issuedDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // URL publica del certificado para el QR
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nodo360.com'
  const verificationUrl = `${baseUrl}/certificados/${encodeURIComponent(cert.code)}`

  // QR usando API externa
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(verificationUrl)}`

  return (
    <main className="min-h-screen bg-[#050608]">
      {/* Celebracion con confeti */}
      <CelebrationOverlay />

      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-10 md:py-14">

        {/* CERTIFICADO */}
        <article className="relative w-full rounded-[32px] bg-[#fdf7ed] px-6 py-8 shadow-[0_40px_80px_rgba(0,0,0,0.55)] md:px-14 md:py-12">

          {/* Borde superior con colores Nodo360 */}
          <div className="absolute left-0 right-0 top-0 h-[6px] rounded-t-[32px] bg-gradient-to-r from-amber-500 via-emerald-400 to-sky-400" />

          {/* CABECERA */}
          <header className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7931a] text-lg font-bold text-white shadow-md">
                N
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold tracking-[0.2em] text-neutral-500">
                  NODO360 · WEB3 & BLOCKCHAIN
                </span>
                <span className="text-sm font-semibold text-neutral-800">
                  Certificado de finalizacion
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] leading-tight text-neutral-500">
              <div className="font-semibold text-neutral-600">Codigo</div>
              <div className="font-mono text-[11px] text-neutral-700">
                {cert.code}
              </div>
            </div>
          </header>

          {/* CUERPO CENTRAL */}
          <section className="mt-10 text-center">
            <p className="text-[11px] font-semibold tracking-[0.3em] text-neutral-400">
              ESTE CERTIFICADO SE OTORGA A
            </p>

            <h1 className="mt-3 text-2xl md:text-3xl font-semibold text-neutral-900">
              Alumno Nodo360
            </h1>

            <p className="mt-5 text-[13px] text-neutral-500">
              por haber completado satisfactoriamente el curso:
            </p>

            <p className="mt-3 text-lg md:text-xl font-semibold text-neutral-900">
              {cert.courseTitle}
            </p>

            <p className="mx-auto mt-4 max-w-xl text-[12px] leading-relaxed text-neutral-500">
              Dentro del itinerario formativo de Web3, Blockchain y Soberania Digital de Nodo360.
            </p>
          </section>

          {/* FECHA + FIRMA + QR */}
          <section className="mt-12 flex flex-col justify-between gap-8 text-[11px] text-neutral-500 md:flex-row md:items-end">
            <div className="flex flex-col gap-1">
              <span>Emitido el {formattedDate}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="h-[1px] w-40 bg-neutral-300" />
              <span className="text-[11px] font-semibold text-neutral-700">
                Equipo Nodo360
              </span>
              <span>Formacion Web3 & Blockchain</span>
            </div>

            {/* QR de verificacion */}
            <div className="flex flex-col items-center gap-1">
              <div className="rounded-xl border border-neutral-200 bg-white p-1.5 shadow-sm">
                <img
                  src={qrUrl}
                  alt="QR de verificacion"
                  className="h-20 w-20 md:h-24 md:w-24"
                />
              </div>
              <span className="text-[10px] text-neutral-500">Escanea para verificar</span>
            </div>
          </section>

          {/* Sello decorativo */}
          <div className="absolute bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-500/30 bg-amber-500/10">
            <span className="text-2xl">🏆</span>
          </div>
        </article>

        {/* Link para volver */}
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-sm text-neutral-400 hover:text-amber-400 transition-colors"
          >
            ← Volver a mi perfil
          </Link>
        </div>

      </div>
    </main>
  )
}
