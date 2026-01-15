import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad de Nodo360 - Cómo recopilamos y usamos tu información.',
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-dark-base">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white mb-8">Política de Privacidad</h1>

        <div className="prose prose-invert max-w-none space-y-8">
          <p className="text-gray-400">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section>
            <h2 className="text-xl font-semibold text-white">1. Información que Recopilamos</h2>
            <p className="text-gray-300">
              En Nodo360 recopilamos información que nos proporcionas directamente cuando:
            </p>
            <ul className="text-gray-300 list-disc pl-6 space-y-2">
              <li>Creas una cuenta (nombre, email, contraseña)</li>
              <li>Completas tu perfil (foto, biografía, enlaces sociales)</li>
              <li>Participas en cursos (progreso, notas, respuestas de quiz)</li>
              <li>Te comunicas con nosotros (mensajes de soporte)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">2. Cómo Usamos tu Información</h2>
            <p className="text-gray-300">Utilizamos la información recopilada para:</p>
            <ul className="text-gray-300 list-disc pl-6 space-y-2">
              <li>Proporcionar y mantener nuestros servicios educativos</li>
              <li>Personalizar tu experiencia de aprendizaje</li>
              <li>Rastrear tu progreso en los cursos</li>
              <li>Emitir certificados de finalización</li>
              <li>Enviarte comunicaciones relacionadas con tu cuenta</li>
              <li>Mejorar nuestros servicios</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">3. Compartición de Datos</h2>
            <p className="text-gray-300">
              No vendemos ni compartimos tu información personal con terceros, excepto:
            </p>
            <ul className="text-gray-300 list-disc pl-6 space-y-2">
              <li>Proveedores de servicios que nos ayudan a operar la plataforma (hosting, email)</li>
              <li>Cuando sea requerido por ley</li>
              <li>Para proteger nuestros derechos y seguridad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">4. Seguridad de Datos</h2>
            <p className="text-gray-300">
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información,
              incluyendo encriptación de datos, acceso restringido y monitoreo de seguridad.
              Sin embargo, ningún método de transmisión por Internet es 100% seguro.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">5. Tus Derechos</h2>
            <p className="text-gray-300">Tienes derecho a:</p>
            <ul className="text-gray-300 list-disc pl-6 space-y-2">
              <li>Acceder a tu información personal</li>
              <li>Corregir datos inexactos</li>
              <li>Solicitar la eliminación de tu cuenta</li>
              <li>Exportar tus datos</li>
              <li>Oponerte al procesamiento de tus datos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">6. Cookies</h2>
            <p className="text-gray-300">
              Utilizamos cookies esenciales para el funcionamiento de la plataforma,
              incluyendo autenticación y preferencias de sesión. No utilizamos cookies
              de seguimiento publicitario.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">7. Retención de Datos</h2>
            <p className="text-gray-300">
              Conservamos tu información mientras mantengas una cuenta activa.
              Puedes solicitar la eliminación de tu cuenta en cualquier momento
              desde la configuración de tu perfil o contactándonos directamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">8. Cambios en esta Política</h2>
            <p className="text-gray-300">
              Podemos actualizar esta política ocasionalmente. Te notificaremos
              sobre cambios significativos por email o mediante un aviso en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">9. Contacto</h2>
            <p className="text-gray-300">
              Si tienes preguntas sobre esta política de privacidad, contáctanos en:{' '}
              <a href="mailto:privacidad@nodo360.com" className="text-brand hover:underline">
                privacidad@nodo360.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
