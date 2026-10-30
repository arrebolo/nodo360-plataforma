import { Metadata } from 'next'
import Link from 'next/link'

/**
 * Página principal de spv-respaldos, la herramienta interna de copias de
 * seguridad de SPV Trabajos (LUANLO SL).
 *
 * Existe porque Google la exige para verificar la aplicación OAuth: una página
 * principal y una política de privacidad en un dominio propio, públicas y sin
 * sesión. No forma parte de Nodo360 ni sale en el menú; por eso no lleva
 * enlaces desde el resto de la web ni entrada en el sitemap.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/spv-respaldos' },
  title: 'spv-respaldos',
  description:
    'spv-respaldos: herramienta interna que guarda copias de seguridad cifradas de SPV Trabajos en el Google Drive de su propietario.',
}

export default function SpvRespaldosPage() {
  return (
    <div className="min-h-screen bg-dark-base">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white mb-8">spv-respaldos</h1>

        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-gray-300">
            spv-respaldos es una herramienta interna de Alberto (LUANLO SL), de uso exclusivo
            de su propietario.
          </p>
          <p className="text-gray-300">
            Guarda copias de seguridad cifradas de los datos de SPV Trabajos, la aplicación de
            gestión de trabajos de LUANLO SL, en la cuenta de Google Drive del propietario.
          </p>
          <p className="text-gray-300">
            Las copias se cifran en el equipo del propietario antes de subirse, y la herramienta
            solo accede a los ficheros que ella misma crea en ese Drive.
          </p>
          <p className="text-gray-300">
            No es un servicio público: no admite registros ni la puede usar nadie más.
          </p>

          <p className="text-gray-300">
            Cómo trata los datos, qué permiso de Google usa y cómo retirarlo:{' '}
            <Link href="/spv-respaldos/privacidad" className="text-brand hover:underline">
              Política de privacidad de spv-respaldos
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
