import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createClient } from "@/lib/supabase/server";
import { CertificatePreview } from "@/components/certificates/CertificatePreview";
import Link from "next/link";
import type { Metadata } from "next";

// Configuración de Next.js para rutas dinámicas
export const dynamic = "force-dynamic";
export const dynamicParams = true;

interface CertificatePageProps {
  params: { certificateId: string };
}

export async function generateMetadata({
  params,
}: CertificatePageProps): Promise<Metadata> {
  const resolvedParams = await params;

  return {
    title: `Certificado | Nodo360`,
    description: "Descarga tu certificado de completación",
  };
}

export default async function CertificatePage({
  params,
}: CertificatePageProps) {
  const resolvedParams = await params;

  // Require authentication
  const returnUrl = `/certificados/${resolvedParams.certificateId}`;
  const user = await requireAuth(returnUrl);

  const supabase = await createClient();

  // Get certificate
  const { data: certificate, error } = await supabase
    .from("certificates")
    .select(
      `
      *,
      course:courses(id, title, slug),
      module:modules(id, title, slug)
    `
    )
    .eq("id", resolvedParams.certificateId)
    .single();

  if (error || !certificate) {
    notFound();
  }

  // Verify that this certificate belongs to the current user
  if (certificate.user_id !== user.id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1a1f2e]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="text-white font-bold text-xl">NODO360</span>
            </Link>
            <Link
              href="/perfil/certificados"
              className="text-white/70 hover:text-white transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Mis certificados
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#4caf50]/20 mb-6">
            <svg
              className="w-10 h-10 text-[#4caf50]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            ¡Felicitaciones!
          </h1>
          <p className="text-xl text-white/70">
            Has completado exitosamente{" "}
            {certificate.type === "module"
              ? `el módulo "${certificate.module?.title}"`
              : `el curso "${certificate.course.title}"`}
          </p>
        </div>

        {/* Certificate Preview Component */}
        {certificate.certificate_url && (
          <CertificatePreview
            certificateUrl={certificate.certificate_url}
            certificateNumber={certificate.certificate_number}
            verificationUrl={certificate.verification_url || undefined}
            userName={user.full_name || user.email}
            courseTitle={certificate.course.title}
            moduleTitle={certificate.module?.title}
            issuedDate={new Date(certificate.issued_at)}
            type={certificate.type as "module" | "course"}
          />
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            href={`/cursos/${certificate.course.slug}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white font-medium rounded-lg hover:bg-white/10 transition-all border border-white/10"
          >
            Ver curso
          </Link>
          <Link
            href="/perfil/certificados"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#ff6b35]/20 transition-all"
          >
            Ver todos mis certificados
          </Link>
        </div>
      </div>
    </div>
  );
}
