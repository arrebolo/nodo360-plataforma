"use client";

import { useState } from "react";
import { Download, Share2, Eye, ExternalLink, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import { useEffect } from "react";

interface CertificatePreviewProps {
  certificateUrl: string;
  certificateNumber: string;
  verificationUrl?: string;
  userName: string;
  courseTitle: string;
  moduleTitle?: string;
  issuedDate: Date;
  type: "module" | "course";
}

/**
 * Certificate Preview Component
 *
 * Displays a certificate with preview, download, and sharing options
 *
 * Features:
 * - PDF preview (iframe)
 * - Download button
 * - Share to LinkedIn
 * - QR code for verification
 * - Responsive design
 *
 * @example
 * ```tsx
 * <CertificatePreview
 *   certificateUrl="https://..."
 *   certificateNumber="NODO360-2024-000123"
 *   verificationUrl="https://nodo360.com/verificar/abc123"
 *   userName="Juan Pérez"
 *   courseTitle="Fundamentos de Bitcoin"
 *   issuedDate={new Date()}
 *   type="course"
 * />
 * ```
 */
export function CertificatePreview({
  certificateUrl,
  certificateNumber,
  verificationUrl,
  userName,
  courseTitle,
  moduleTitle,
  issuedDate,
  type,
}: CertificatePreviewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generate QR code on mount
  useEffect(() => {
    if (verificationUrl) {
      QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: "#1a1f2e",
          light: "#ffffff",
        },
      })
        .then(setQrCodeUrl)
        .catch((err) => console.error("Error generating QR code:", err));
    }
  }, [verificationUrl]);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(certificateUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Nodo360_Certificado_${certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading certificate:", error);
      alert("Error al descargar el certificado. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareLinkedIn = () => {
    const title = moduleTitle
      ? `Certificado: ${moduleTitle}`
      : `Certificado: ${courseTitle}`;

    const description = `¡Acabo de completar ${moduleTitle ? "el módulo" : "el curso"} "${moduleTitle || courseTitle}" en Nodo360!`;

    // LinkedIn share URL
    // Note: LinkedIn doesn't support direct certificate uploads via URL params
    // Users need to manually upload the certificate image/PDF
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      verificationUrl || window.location.href
    )}`;

    window.open(linkedInUrl, "_blank", "width=600,height=600");

    // Show instructions
    alert(
      "Para compartir tu certificado en LinkedIn:\n\n" +
        "1. Descarga el certificado PDF\n" +
        "2. En LinkedIn, ve a tu perfil → Agregar sección → Licencias y certificaciones\n" +
        "3. Sube el PDF del certificado\n" +
        "4. Completa los detalles y publica"
    );
  };

  const handleOpenInNewTab = () => {
    window.open(certificateUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Preview Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        {/* Preview Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#ff6b35]" />
            <h3 className="text-white font-semibold">Vista Previa</h3>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-white/70 hover:text-white transition"
          >
            {showPreview ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        {/* PDF Preview */}
        {showPreview && (
          <div className="bg-gray-200">
            <iframe
              src={certificateUrl}
              className="w-full h-[600px]"
              title="Certificate Preview"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Descargando...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Descargar PDF
            </>
          )}
        </button>

        {/* Share to LinkedIn */}
        <button
          onClick={handleShareLinkedIn}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-[#0077B5] text-white font-semibold rounded-lg hover:bg-[#006399] transition-all"
        >
          <Share2 className="w-5 h-5" />
          Compartir en LinkedIn
        </button>

        {/* Open in New Tab */}
        <button
          onClick={handleOpenInNewTab}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10 transition-all"
        >
          <ExternalLink className="w-5 h-5" />
          Abrir en nueva pestaña
        </button>
      </div>

      {/* Certificate Details Card */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Detalles del Certificado
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Details */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/50 block mb-1">
                Número de Certificado
              </label>
              <div className="flex items-center gap-2">
                <code className="text-[#ff6b35] font-mono font-semibold text-lg">
                  {certificateNumber}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(certificateNumber);
                    alert("Número copiado al portapapeles");
                  }}
                  className="text-white/50 hover:text-white transition"
                  title="Copiar número"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-white/50 block mb-1">
                Otorgado a
              </label>
              <p className="text-white font-medium">{userName}</p>
            </div>

            <div>
              <label className="text-sm text-white/50 block mb-1">Curso</label>
              <p className="text-white font-medium">{courseTitle}</p>
            </div>

            {moduleTitle && (
              <div>
                <label className="text-sm text-white/50 block mb-1">
                  Módulo
                </label>
                <p className="text-white font-medium">{moduleTitle}</p>
              </div>
            )}

            <div>
              <label className="text-sm text-white/50 block mb-1">
                Fecha de Emisión
              </label>
              <p className="text-white font-medium">
                {issuedDate.toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div>
              <label className="text-sm text-white/50 block mb-1">Tipo</label>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  type === "module"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-green-500/20 text-green-400"
                }`}
              >
                {type === "module"
                  ? "Certificado de Módulo"
                  : "Certificado de Curso Completo"}
              </span>
            </div>
          </div>

          {/* Right Column - QR Code */}
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl">
            {qrCodeUrl ? (
              <div className="text-center">
                <img
                  src={qrCodeUrl}
                  alt="QR Code de Verificación"
                  className="w-48 h-48 mx-auto mb-4"
                />
                <p className="text-sm text-gray-600 mb-2">
                  Escanea para verificar
                </p>
                {verificationUrl && (
                  <a
                    href={verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#ff6b35] hover:underline break-all"
                  >
                    {verificationUrl}
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <p className="text-sm">Generando QR...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Notice */}
      {verificationUrl && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-blue-200 font-semibold mb-1">
                Certificado Verificable
              </h4>
              <p className="text-sm text-blue-200/80">
                Este certificado puede ser verificado públicamente usando el
                código QR o visitando la URL de verificación. Cualquier persona
                puede confirmar su autenticidad.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Share Instructions */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h4 className="text-white font-semibold mb-3">
          💡 Cómo compartir tu certificado
        </h4>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="flex items-start gap-2">
            <span className="text-[#ff6b35]">•</span>
            <span>
              <strong className="text-white">LinkedIn:</strong> Agrega el
              certificado a tu sección de "Licencias y certificaciones"
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#ff6b35]">•</span>
            <span>
              <strong className="text-white">Portafolio:</strong> Descarga el
              PDF y súbelo a tu portafolio personal
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#ff6b35]">•</span>
            <span>
              <strong className="text-white">Redes sociales:</strong> Comparte
              la URL de verificación para que otros puedan confirmar tu logro
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#ff6b35]">•</span>
            <span>
              <strong className="text-white">CV/Currículum:</strong> Incluye el
              número de certificado y la URL de verificación
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
