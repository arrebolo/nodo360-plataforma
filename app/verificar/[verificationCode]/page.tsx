import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

// Configuración de Next.js para rutas dinámicas
export const dynamic = "force-dynamic";
export const dynamicParams = true;

interface VerificationPageProps {
  params: { verificationCode: string };
}

export async function generateMetadata({
  params,
}: VerificationPageProps): Promise<Metadata> {
  const resolvedParams = await params;

  return {
    title: `Verificar Certificado | Nodo360`,
    description: "Verifica la autenticidad de un certificado de Nodo360",
  };
}

export default async function VerificationPage({
  params,
}: VerificationPageProps) {
  const resolvedParams = await params;
  const supabase = await createClient();

  // Get current user for header
  const { data: { user } } = await supabase.auth.getUser();

  // Get certificate by verification URL
  const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/verificar/${resolvedParams.verificationCode}`;

  const { data: certificate, error } = await supabase
    .from("certificates")
    .select(
      `
      *,
      user:users!inner(full_name, email),
      course:courses!inner(title, description),
      module:modules(title)
    `
    )
    .eq("verification_url", verificationUrl)
    .single();

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]">
        {/* Not Found Content */}
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Certificado No Encontrado
            </h1>
            <p className="text-white/70 mb-8">
              No se pudo encontrar un certificado con este código de
              verificación. Verifica que el código sea correcto o que el enlace
              esté completo.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = certificate.expires_at
    ? new Date(certificate.expires_at) < new Date()
    : false;

  const isRevoked = false; // TODO: Add revoked field to database if needed

  const statusColor = isRevoked
    ? "red"
    : isExpired
      ? "yellow"
      : "green";

  const StatusIcon = isRevoked
    ? XCircle
    : isExpired
      ? AlertTriangle
      : CheckCircle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f2e] via-[#252b3d] to-[#1a1f2e]">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Status Banner */}
        <div
          className={`mb-8 rounded-xl border-2 p-6 ${
            statusColor === "green"
              ? "bg-green-500/10 border-green-500/30"
              : statusColor === "yellow"
                ? "bg-yellow-500/10 border-yellow-500/30"
                : "bg-red-500/10 border-red-500/30"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                statusColor === "green"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : statusColor === "yellow"
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                    : "bg-gradient-to-r from-red-500 to-rose-500"
              }`}
            >
              <StatusIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1
                className={`text-2xl font-bold mb-1 ${
                  statusColor === "green"
                    ? "text-green-400"
                    : statusColor === "yellow"
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {isRevoked
                  ? "Certificado Revocado"
                  : isExpired
                    ? "Certificado Expirado"
                    : "✓ Certificado Válido"}
              </h1>
              <p
                className={`text-sm ${
                  statusColor === "green"
                    ? "text-green-200/80"
                    : statusColor === "yellow"
                      ? "text-yellow-200/80"
                      : "text-red-200/80"
                }`}
              >
                {isRevoked
                  ? "Este certificado ha sido revocado y ya no es válido"
                  : isExpired
                    ? `Expiró el ${new Date(certificate.expires_at!).toLocaleDateString("es-ES")}`
                    : "Este certificado es auténtico y está verificado"}
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Detalles del Certificado
          </h2>

          <div className="space-y-6">
            {/* Certificate Number */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <span className="text-white/70">Número de Certificado</span>
              <code className="text-[#ff6b35] font-mono font-bold text-lg">
                {certificate.certificate_number}
              </code>
            </div>

            {/* Recipient */}
            <div>
              <label className="text-sm text-white/50 block mb-2">
                Otorgado a
              </label>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white font-semibold text-lg">
                  {certificate.user.full_name || "Estudiante de Nodo360"}
                </p>
              </div>
            </div>

            {/* Course */}
            <div>
              <label className="text-sm text-white/50 block mb-2">Curso</label>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white font-semibold">
                  {certificate.course.title}
                </p>
                {certificate.course.description && (
                  <p className="text-white/60 text-sm mt-1">
                    {certificate.course.description}
                  </p>
                )}
              </div>
            </div>

            {/* Module (if applicable) */}
            {certificate.type === "module" && certificate.module && (
              <div>
                <label className="text-sm text-white/50 block mb-2">
                  Módulo
                </label>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white font-semibold">
                    {certificate.module.title}
                  </p>
                </div>
              </div>
            )}

            {/* Type */}
            <div>
              <label className="text-sm text-white/50 block mb-2">Tipo</label>
              <div className="flex gap-2">
                <span
                  className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                    certificate.type === "module"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {certificate.type === "module"
                    ? "Certificado de Módulo"
                    : "Certificado de Curso Completo"}
                </span>
              </div>
            </div>

            {/* Issue Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/50 block mb-2">
                  Fecha de Emisión
                </label>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white font-medium">
                    {new Date(certificate.issued_at).toLocaleDateString(
                      "es-ES",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>

              {certificate.expires_at && (
                <div>
                  <label className="text-sm text-white/50 block mb-2">
                    Fecha de Expiración
                  </label>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white font-medium">
                      {new Date(certificate.expires_at).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Hash (for verification) */}
            {certificate.certificate_hash && (
              <div>
                <label className="text-sm text-white/50 block mb-2">
                  Hash de Verificación (SHA-256)
                </label>
                <div className="p-3 bg-black/30 rounded-lg border border-white/10 overflow-x-auto">
                  <code className="text-xs text-green-400 font-mono break-all">
                    {certificate.certificate_hash}
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {certificate.certificate_url && !isRevoked && (
            <a
              href={certificate.certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Ver Certificado PDF
            </a>
          )}

          <Link
            href="/cursos"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10 transition-all"
          >
            Explorar Cursos
          </Link>
        </div>

        {/* About Nodo360 */}
        <div className="mt-12 bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-3">Sobre Nodo360</h3>
          <p className="text-white/70 text-sm mb-4">
            Nodo360 es una plataforma educativa especializada en Bitcoin,
            Blockchain y tecnologías descentralizadas. Nuestros certificados
            verificables garantizan que los estudiantes han completado
            exitosamente los módulos y cursos, demostrando su conocimiento en
            estas tecnologías emergentes.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <a
              href="https://nodo360.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ff6b35] hover:underline"
            >
              Sitio web →
            </a>
            <a
              href="https://nodo360.com/cursos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ff6b35] hover:underline"
            >
              Ver cursos →
            </a>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-blue-200 font-semibold mb-1 text-sm">
                Verificación Segura
              </h4>
              <p className="text-xs text-blue-200/80">
                Esta página de verificación es pública y permite a cualquier
                persona confirmar la autenticidad de un certificado emitido por
                Nodo360. El hash SHA-256 garantiza que el certificado no ha
                sido alterado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
