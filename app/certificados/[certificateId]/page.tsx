import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createClient } from "@/lib/supabase/server";
import { CertificatePreview } from "@/components/certificates/CertificatePreview";
import Link from "next/link";
import type { Metadata } from "next";
import { DiscordIcon } from '@/components/lesson/CommunityIcons';
import { DISCORD_LINK_PROPS } from '@/lib/discord/invite';

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
    title: 'Certificado',
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
      revoked_at,
      module_id
    `
    )
    .eq("id", resolvedParams.certificateId)
    .single();

  if (error) {
    // Antes esto se mezclaba con «no existe» y un fallo de la consulta se veía como un
    // 404. La 117 repuntó `certificates.course_id` al espejo y el embed a `courses`
    // dejó de resolverse: la página contestaba «no existe» a un certificado que sí
    // existía. Ahora el curso se lee aparte y un error se dice.
    console.error('[certificado] no se pudo leer:', error.code, error.message);
  }

  if (!certificate) {
    notFound();
  }

  // El curso y el módulo, aparte: sus claves ajenas apuntan al espejo —la 117—, que
  // todavía no se puede leer con la sesión de nadie, y un embed sigue la clave ajena.
  // El id es el mismo en las dos tablas, así que se leen de las de trabajo por su id.
  const [{ data: cursoDelCertificado }, { data: moduloDelCertificado }] = await Promise.all([
    certificate.course_id
      ? supabase.from('courses').select('id, title, slug').eq('id', certificate.course_id).maybeSingle()
      : Promise.resolve({ data: null }),
    certificate.module_id
      ? supabase.from('modules').select('id, title').eq('id', certificate.module_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Verify that this certificate belongs to the current user
  if (certificate.user_id !== user.id) {
    notFound();
  }

  // revoked_at lo anade la migracion 074. Antes de aplicarla el campo llega
  // undefined y todo se ve como siempre.
  const revocado = !!(certificate as { revoked_at?: string | null }).revoked_at

  // QUE FECHA ACREDITA EL CERTIFICADO
  //
  // La de finalizacion del curso, no la de emision. Son distintas y pueden
  // separarse dias: la ficha del curso decia "lo terminaste el 27 de enero" y
  // el certificado, "acredita el temario vigente el 29". Dos fechas para el
  // mismo hecho, sin explicar cual es cual.
  //
  // El temario que se acredita es el que habia cuando se completo. La emision
  // es un tramite posterior -aprobar el examen, o un reproceso- y se muestra
  // aparte y etiquetada.
  const { data: matricula } = await supabase
    .from("course_enrollments")
    .select("completed_at")
    .eq("user_id", user.id)
    .eq("course_id", certificate.course_id)
    .maybeSingle()

  // Sin fecha de finalizacion queda la de emision, que es lo mas cercano.
  const fechaQueAcredita = matricula?.completed_at ?? certificate.issued_at

  const enEspanol = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-surface via-dark-soft to-dark-surface">
      {/* Sin cabecera propia: app/layout.tsx ya pinta SiteHeaderServer, asi
          que esta pagina salia con DOS cabeceras, una encima de otra. El
          enlace de vuelta si hacia falta, y se queda como enlace normal. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/dashboard/certificados"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Mis certificados
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/20 mb-6">
            <svg
              className="w-10 h-10 text-success"
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
            {revocado ? "Certificado retirado" : "¡Felicitaciones!"}
          </h1>
          {revocado ? (
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Este certificado se emitió por un error de la plataforma y ha sido
              retirado. No acredita la finalización del curso.
            </p>
          ) : (
          <p className="text-xl text-white/70">
            Has completado exitosamente{" "}
            {certificate.type === "module"
              ? `el módulo "${moduloDelCertificado?.title}"`
              : `el curso "${cursoDelCertificado?.title ?? certificate.title}"`}
          </p>
          )}
          {/* Mismo criterio que la pagina publica de verificacion: se dice
              sobre que temario se emitio, para que una ampliacion posterior
              del curso no haga dudar del certificado. En uno retirado no se
              pone: no acredita ningun temario. */}
          {!revocado && (
            <>
          <p className="mt-3 text-sm text-white/50">
            Acredita el temario vigente el {enEspanol(fechaQueAcredita)}, fecha en que
            completaste el curso. El curso puede haberse ampliado después; eso no
            afecta a su validez.
          </p>
          <p className="mt-1 text-sm text-white/40">
            Fecha de emisión del certificado: {enEspanol(certificate.issued_at)}.
          </p>
            </>
          )}
        </div>

        {/* La vista del certificado, con su descarga en PDF y su boton de
            LinkedIn. En uno retirado no se pinta: el PDF dice "CERTIFICADO DE
            FINALIZACION" y el boton invita a publicarlo, las dos cosas a un
            palmo del aviso que dice que no acredita nada. */}
        {!revocado && certificate.certificate_url && (
          <CertificatePreview
            certificateUrl={certificate.certificate_url}
            certificateNumber={certificate.certificate_number}
            verificationUrl={certificate.verification_url || undefined}
            userName={user.full_name || user.email}
            courseTitle={cursoDelCertificado?.title ?? certificate.title}
            moduleTitle={moduloDelCertificado?.title}
            issuedDate={new Date(certificate.issued_at)}
            type={certificate.type as "module" | "course"}
          />
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          {/* El curso puede haber dejado de ser visible: RLS oculta los que
              no estan publicados, y entonces el embed llega en null. Antes se
              accedia a certificate.course.title sin proteger y la pagina
              lanzaba una excepcion. El certificado sigue siendo valido, asi
              que se muestra igual; lo unico que desaparece es el enlace al
              curso, que ya no llevaria a ninguna parte. */}
          {cursoDelCertificado?.slug && (
            <Link
              href={`/cursos/${cursoDelCertificado.slug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white font-medium rounded-lg hover:bg-white/10 transition-all border border-white/10"
            >
              Ver curso
            </Link>
          )}
          <Link
            href="/dashboard/certificados"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-medium rounded-lg hover:shadow-lg hover:shadow-brand-light/20 transition-all"
          >
            Ver todos mis certificados
          </Link>
        </div>

        {/* Quien acaba de terminar un curso es quien mas tiene que preguntar y
            que contar. Va debajo de las acciones para no competir con el
            certificado, que es a lo que se viene a esta pagina. */}
        <div className="mt-10 rounded-xl border border-[#5865F2]/25 bg-[#5865F2]/10 p-5 text-center">
          <p className="text-white/80">
            Comenta el curso y resuelve dudas en la comunidad de Discord.
          </p>
          <a
            {...DISCORD_LINK_PROPS}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-5 py-2.5 font-medium text-white transition hover:bg-[#5865F2]/85"
          >
            <DiscordIcon className="h-5 w-5" />
            Entrar al Discord de Nodo360
          </a>
        </div>
      </div>
    </div>
  );
}
