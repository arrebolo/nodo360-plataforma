import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos de Servicio',
  description: 'Términos y condiciones de uso de Nodo360.',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-dark-base">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-white mb-8">Términos de Servicio</h1>

        <div className="prose prose-invert max-w-none space-y-8">
          <p className="text-gray-400">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section>
            <h2 className="text-xl font-semibold text-white">1. Aceptación de los Términos</h2>
            <p className="text-gray-300">
              Al acceder y utilizar Nodo360, aceptas estar sujeto a estos términos de servicio.
              Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">2. Descripción del Servicio</h2>
            <p className="text-gray-300">
              Nodo360 es una plataforma educativa que ofrece cursos sobre Bitcoin, blockchain y
              criptomonedas. Proporcionamos contenido educativo, seguimiento de progreso,
              certificados de finalización y herramientas de aprendizaje.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">3. Cuentas de Usuario</h2>
            <p className="text-gray-300">Para usar nuestros servicios, debes:</p>
            <ul className="text-gray-300 list-disc pl-6 space-y-2">
              <li>Ser mayor de 16 años</li>
              <li>Proporcionar información precisa y completa al registrarte</li>
              <li>Mantener la seguridad de tu cuenta y contraseña</li>
              <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
              <li>Ser responsable de toda actividad bajo tu cuenta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">4. Contenido Educativo</h2>
            <p className="text-gray-300">
              El contenido de Nodo360 es solo para fines educativos e informativos.
              No constituye asesoramiento financiero, legal o de inversión.
              Las decisiones financieras son tu responsabilidad.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">5. Propiedad Intelectual</h2>
            <p className="text-gray-300">
              Todo el contenido de la plataforma (cursos, textos, imágenes, videos, código)
              es propiedad de Nodo360 o sus creadores de contenido. No puedes:
            </p>
            <ul className="text-gray-300 list-disc pl-6 space-y-2">
              <li>Copiar o redistribuir el contenido sin autorización</li>
              <li>Usar el contenido con fines comerciales</li>
              <li>Modificar o crear obras derivadas</li>
              <li>Compartir tu cuenta con terceros</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">6. Certificados</h2>
            <p className="text-gray-300">
              Los certificados emitidos por Nodo360 acreditan la finalización de cursos
              en nuestra plataforma. No constituyen títulos académicos oficiales ni
              certificaciones profesionales reguladas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">7. Conducta del Usuario</h2>
            <p className="text-gray-300">Te comprometes a no:</p>
            <ul className="text-gray-300 list-disc pl-6 space-y-2">
              <li>Violar leyes o regulaciones aplicables</li>
              <li>Publicar contenido ofensivo, difamatorio o ilegal</li>
              <li>Intentar acceder a cuentas de otros usuarios</li>
              <li>Interferir con el funcionamiento de la plataforma</li>
              <li>Usar la plataforma para spam o phishing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">8. Limitación de Responsabilidad</h2>
            <p className="text-gray-300">
              Nodo360 se proporciona "tal cual" sin garantías de ningún tipo.
              No seremos responsables por daños indirectos, incidentales o consecuentes
              derivados del uso de la plataforma. Nuestra responsabilidad máxima
              se limita al monto pagado por los servicios, si aplica.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">9. Modificaciones</h2>
            <p className="text-gray-300">
              Nos reservamos el derecho de modificar estos términos en cualquier momento.
              Los cambios entrarán en vigor al publicarse. El uso continuado de la plataforma
              después de los cambios constituye aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">10. Terminación</h2>
            <p className="text-gray-300">
              Podemos suspender o terminar tu acceso a la plataforma si violas estos términos
              o por cualquier otra razón a nuestra discreción. Puedes cancelar tu cuenta
              en cualquier momento desde la configuración de tu perfil.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">11. Ley Aplicable</h2>
            <p className="text-gray-300">
              Estos términos se rigen por las leyes de España. Cualquier disputa se
              resolverá en los tribunales de Barcelona.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">12. Contacto</h2>
            <p className="text-gray-300">
              Para preguntas sobre estos términos, contáctanos en:{' '}
              <a href="mailto:legal@nodo360.com" className="text-brand hover:underline">
                legal@nodo360.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
