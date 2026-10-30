import { Metadata } from 'next'
import Link from 'next/link'

/**
 * Política de privacidad de spv-respaldos (ver ../page.tsx).
 *
 * La fecha va escrita, no calculada: una política dice cuándo se cambió su
 * texto, y `new Date()` la pondría al día en cada visita sin que nada cambie.
 * Al tocar el texto, se cambia la fecha.
 */
const ULTIMA_ACTUALIZACION = '30 de octubre de 2026'

// El correo de contacto del responsable. Si algún día se deja en null, la
// página muestra un marcador a la vista en vez de un hueco que pase desapercibido.
const CORREO_DE_CONTACTO: string | null = 'privacidad@nodo360.com'

const POLITICA_DE_DATOS_DE_GOOGLE =
  'https://developers.google.com/terms/api-services-user-data-policy'

export const metadata: Metadata = {
  alternates: { canonical: '/spv-respaldos/privacidad' },
  title: 'Política de privacidad de spv-respaldos',
  description:
    'Política de privacidad de spv-respaldos: qué datos de Google usa, para qué, dónde se guarda el acceso y cómo revocarlo.',
}

export default function SpvRespaldosPrivacidadPage() {
  return (
    <div className="min-h-screen bg-dark-base">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white mb-8">Política de privacidad de spv-respaldos</h1>

        <div className="prose prose-invert max-w-none space-y-8">
          <p className="text-gray-400">Última actualización: {ULTIMA_ACTUALIZACION}</p>

          <p className="text-gray-300">
            <Link href="/spv-respaldos" className="text-brand hover:underline">
              spv-respaldos
            </Link>{' '}
            es una herramienta interna, de uso exclusivo de su propietario, que guarda copias de
            seguridad cifradas de los datos de SPV Trabajos en su propia cuenta de Google Drive.
            No es un servicio público ni admite registros.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-white">1. Responsable</h2>
            <p className="text-gray-300">
              Alberto (LUANLO SL). Contacto:{' '}
              {CORREO_DE_CONTACTO ? (
                <a href={`mailto:${CORREO_DE_CONTACTO}`} className="text-brand hover:underline">
                  {CORREO_DE_CONTACTO}
                </a>
              ) : (
                <strong className="text-brand">[CORREO DE CONTACTO PENDIENTE]</strong>
              )}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">2. Qué datos de Google usa</h2>
            <p className="text-gray-300">
              Solo el permiso <code>https://www.googleapis.com/auth/drive.file</code>, que da
              acceso únicamente a los ficheros que la propia herramienta crea en el Google Drive
              del usuario. No lee, no modifica ni borra ningún otro fichero de ese Drive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">3. Para qué los usa</h2>
            <p className="text-gray-300">Para gestionar sus propias copias de seguridad:</p>
            <ul className="text-gray-300 list-disc pl-6 space-y-2">
              <li>Subirlas.</li>
              <li>Comprobar que están completas.</li>
              <li>Rotarlas, borrando las copias antiguas.</li>
              <li>Descargarlas para restaurarlas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">4. Cifrado y terceros</h2>
            <p className="text-gray-300">
              Las copias se cifran antes de subirse. La herramienta no comparte datos con
              terceros, no los vende, no los usa para publicidad ni para entrenar modelos de
              inteligencia artificial, y no transfiere a nadie los datos que recibe de Google.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">5. Dónde se guarda el acceso</h2>
            <p className="text-gray-300">
              El acceso a Google Drive se guarda como un token en el equipo del propietario. No se
              envía ni se almacena en ningún otro sitio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">6. Cómo revocar el acceso</h2>
            <p className="text-gray-300">
              En la cuenta de Google: <strong>Seguridad</strong> →{' '}
              <strong>Aplicaciones y servicios de terceros</strong> → <strong>spv-respaldos</strong>{' '}
              → <strong>Quitar acceso</strong>. A partir de ese momento la herramienta deja de
              poder acceder al Drive.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">7. Política de datos de usuario de Google</h2>
            <p className="text-gray-300">
              El uso que spv-respaldos hace de la información recibida de las APIs de Google, y su
              transferencia a cualquier otra aplicación, cumple la{' '}
              <a
                href={POLITICA_DE_DATOS_DE_GOOGLE}
                className="text-brand hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google API Services User Data Policy
              </a>
              , incluidos los requisitos de uso limitado (Limited Use).
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
