import { Eye } from 'lucide-react'

/**
 * Aviso para admins e instructores cuando ven un curso que no esta publicado.
 *
 * Se renderiza arriba del todo en la ficha del curso, en la leccion y en el
 * examen final. Quien lo ve es porque resolveCourseAccess() devolvio
 * isPreview = true; el resto de usuarios recibe un 404 y nunca llega aqui.
 */
export function CoursePreviewBanner() {
  return (
    <div
      role="status"
      className="border-b border-amber-400/30 bg-amber-400/10"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Eye
          className="h-5 w-5 flex-shrink-0 text-amber-300"
          aria-hidden="true"
        />
        <p className="text-sm text-amber-100">
          <span className="font-semibold">Vista previa</span>
          {' — '}
          este curso no está publicado.
        </p>
      </div>
    </div>
  )
}
