'use client'

import { Award, Download } from 'lucide-react'

export default function CertificadosPage() {
  // TODO: Cargar certificados del usuario desde la base de datos
  const certificados: any[] = []

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Mis Certificados</h1>
      <p className="text-white/60 mb-8">Descarga tus certificados de los cursos completados.</p>

      {certificados.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Award className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Aún no tienes certificados</h3>
          <p className="text-white/50 max-w-md mx-auto">
            Completa un curso para obtener tu certificado de finalización.
            Los certificados verifican tu aprendizaje y pueden compartirse en LinkedIn.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {certificados.map((cert) => (
            <div
              key={cert.id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-between hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{cert.courseName}</h3>
                  <p className="text-sm text-white/50">Completado el {cert.date}</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors">
                <Download className="w-4 h-4" />
                Descargar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
