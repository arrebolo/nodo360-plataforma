'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { BookOpen } from 'lucide-react'
import { InstructorPreviewModal, useInstructorPreview } from '@/components/instructor/InstructorPreviewModal'

type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
type CourseStatus = 'draft' | 'published' | 'archived' | 'coming_soon'

export type CourseAuthor = {
  id: string
  full_name: string | null
  avatar_url?: string | null
  role?: string | null
}

export type CourseHeroCourse = {
  id: string
  slug: string
  title: string
  description?: string | null
  long_description?: string | null
  banner_url?: string | null
  thumbnail_url?: string | null
  level: CourseLevel
  status: CourseStatus
  is_free: boolean
  price?: number | null

  total_modules?: number | null
  total_lessons?: number | null
  total_duration_minutes?: number | null
  enrolled_count?: number | null

  // Author info
  instructor_id?: string | null
  instructor?: CourseAuthor | null
}

export type CourseHeroProps = {
  course: CourseHeroCourse
  /**
   * Si quien mira puede gestionar el curso: admin, su instructor, o un mentor
   * revisandolo. Solo con esto se muestran avisos de gestión, como el de que
   * falta la imagen. Un visitante nunca debe leer instrucciones de backoffice.
   */
  canManage?: boolean
  isEnrolled?: boolean
  progressPct?: number | null
  hasFreePreview?: boolean
  hrefContinue?: string
  hrefEnroll?: string
  hrefPreview?: string
  hrefDashboard?: string
  onEnrollClick?: () => void
  enrolling?: boolean
}

/**
 * Duración como estimacion, no como promesa.
 *
 * El valor sale de courses.total_duration_minutes, que desde la migracion 029
 * se calcula a partir del texto de las lecciones a 1.000 caracteres por minuto.
 * Es una estimacion de lectura, así que no se presenta con precision al minuto
 * cuando es larga: por debajo de 45 minutos se dan los minutos, y por encima se
 * redondea a media hora y se marca con "~" y "de lectura" para que se lea como
 * lo que es.
 */
function formatDuration(minutes?: number | null) {
  if (!minutes || minutes <= 0) return null

  if (minutes < 45) return `${minutes} min`

  // Redondeo al multiplo de media hora mas cercano
  const medias = Math.round(minutes / 30)
  const h = Math.floor(medias / 2)
  const media = medias % 2 === 1

  if (h === 0) return '~30 min de lectura'
  if (!media) return `~${h} h de lectura`
  return `~${h} h 30 min de lectura`
}

function levelLabel(level: CourseLevel) {
  switch (level) {
    case 'beginner':
      return 'Principiante'
    case 'intermediate':
      return 'Intermedio'
    case 'advanced':
      return 'Avanzado'
  }
}

function statusLabel(status: CourseStatus) {
  switch (status) {
    case 'published':
      return 'Publicado'
    case 'draft':
      return 'Borrador'
    case 'archived':
      return 'Archivado'
    case 'coming_soon':
      return 'Próximamente'
  }
}

function clampPct(pct?: number | null) {
  if (pct == null || Number.isNaN(pct)) return null
  return Math.max(0, Math.min(100, Math.round(pct)))
}

function statusBadgeVariant(status: CourseStatus) {
  switch (status) {
    case 'published':
      return 'success'
    case 'coming_soon':
      return 'info'
    case 'draft':
      return 'warning'
    case 'archived':
      return 'default'
  }
}

function accessBadgeVariant(isFree: boolean) {
  return isFree ? 'success' : 'premium'
}

export default function CourseHero({
  course,
  isEnrolled = false,
  progressPct,
  hasFreePreview = false,
  hrefContinue,
  hrefEnroll,
  hrefPreview,
  hrefDashboard = '/dashboard',
  onEnrollClick,
  enrolling = false,
  canManage = false,
}: CourseHeroProps) {
  const pct = clampPct(progressPct)
  const published = course.status === 'published'
  const instructorPreview = useInstructorPreview()

  // Quien ya esta inscrito entra por /api/continue, que resuelve la lección
  // destino: la última visitada si hay progreso, y la primera si no lo hay.
  // Antes esto exigia además progreso > 0, de modo que un recien inscrito caia
  // en un boton que enlazaba a esta misma página y no hacia nada.
  const canContinue = isEnrolled && !!hrefContinue
  const continueLabel = (pct ?? 0) > 0 ? 'Continuar' : 'Empezar el curso'


  const duration = formatDuration(course.total_duration_minutes)

  const metrics: Array<{ label: string; value: string }> = []
  if (course.total_modules != null) metrics.push({ label: 'Módulos', value: String(course.total_modules) })
  if (course.total_lessons != null) metrics.push({ label: 'Lecciones', value: String(course.total_lessons) })
  if (duration) metrics.push({ label: 'Duración', value: duration })
  // 'Alumnos' se retiró: courses.enrolled_count está a 0 en todos los cursos
  // porque ningún trigger lo mantiene, mientras course_enrollments sí tiene
  // inscripciones reales. Mostraba "Alumnos: 0" de forma permanente. Para
  // recuperarlo hay que contar desde course_enrollments, no leer esta columna.

  return (
    <>
    <section className="relative overflow-hidden rounded-2xl border border-dark-border bg-white/5">
      {/* Fondo neutro + halos cálidos */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
        <div className="absolute -top-24 left-10 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute top-10 right-10 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          {/* Columna izquierda */}
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" size="md">
                {levelLabel(course.level)}
              </Badge>

              <Badge variant={accessBadgeVariant(course.is_free)} size="md">
                {course.is_free ? 'Gratis' : 'Premium'}
              </Badge>

              <Badge variant={statusBadgeVariant(course.status)} size="md">
                {statusLabel(course.status)}
              </Badge>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {course.title}
              </h1>
              {course.description && (
                <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
                  {course.description}
                </p>
              )}
            </div>

            {/* Autor */}
            {(() => {
              const isNodo360 = !course.instructor_id || course.instructor?.role === 'admin'

              if (isNodo360) {
                return (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Creado por</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded bg-gradient-to-br from-brand-light to-brand flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">N</span>
                      </div>
                      <span className="font-medium text-white">Nodo360</span>
                    </div>
                  </div>
                )
              }

              return (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Por</span>
                  <button
                    onClick={(e) => instructorPreview.openPreview(course.instructor_id!, e)}
                    className="flex items-center gap-2 hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    {course.instructor?.avatar_url && (
                      <img
                        src={course.instructor.avatar_url}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    <span className="font-medium text-white hover:text-orange-400 transition-colors">
                      {course.instructor?.full_name}
                    </span>
                  </button>
                </div>
              )
            })()}

            {/* Progreso */}
            {pct != null && isEnrolled && (
              <div className="max-w-xl space-y-2">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>Progreso</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-brand transition-all duration-300"
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progreso del curso: ${pct}%`}
                  />
                </div>
              </div>
            )}

            {/* Métricas */}
            {metrics.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-1">
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-dark-border bg-white/5 px-4 py-2"
                  >
                    <div className="text-xs text-muted">{m.label}</div>
                    <div className="text-base font-semibold text-white">{m.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {published ? (
                canContinue ? (
                  <Button href={hrefContinue!} size="lg" variant="primary">
                    {continueLabel}
                  </Button>
                ) : hrefEnroll ? (
                  <Button href={hrefEnroll} size="lg" variant="primary">
                    {course.is_free ? 'Empezar gratis' : 'Inscribirme'}
                  </Button>
                ) : onEnrollClick ? (
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={onEnrollClick}
                    loading={enrolling}
                  >
                    {course.is_free ? 'Empezar gratis' : 'Inscribirme'}
                  </Button>
                ) : (
                  /* Único caso sin via de entrada: curso premium y usuario sin
                     entitlement. La página lo explica debajo; aquí no se ofrece
                     un enlace que no lleva a ninguna parte. */
                  <Button size="lg" variant="secondary" disabled>
                    Acceso premium requerido
                  </Button>
                )
              ) : (
                <Button size="lg" variant="secondary" disabled>
                  {course.status === 'coming_soon' ? 'Próximamente' : 'No disponible'}
                </Button>
              )}

              {published && !isEnrolled && !course.is_free && hasFreePreview && hrefPreview && (
                <Button href={hrefPreview} size="lg" variant="outline">
                  Ver lección gratuita
                </Button>
              )}

{/* Link discreto al dashboard - no compite con CTA principal */}
              <a
                href={hrefDashboard}
                className="text-sm text-muted hover:text-white transition-colors sm:ml-auto"
              >
                ← Volver al dashboard
              </a>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="rounded-2xl border border-dark-border bg-white/5 p-4">
            <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border border-dark-border bg-white/5">
              {course.banner_url ? (
                <img
                  src={course.banner_url}
                  alt={`Banner del curso ${course.title}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={`Imagen del curso ${course.title}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                /* Sin imagen: marcador neutro para cualquiera. El aviso de que
                   falta subirla solo lo ve quien puede subirla. */
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center"
                  role="img"
                  aria-label={`${course.title} — sin imagen de portada`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-light/20 to-gold/20 border border-brand-light/20">
                    <BookOpen className="h-7 w-7 text-brand-light" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium text-white/50">
                    {levelLabel(course.level)}
                  </span>

                  {canManage && (
                    <p className="mt-1 text-xs text-amber-300/80">
                      Falta la imagen de portada de este curso.
                    </p>
                  )}
                </div>
              )}
            </div>

            {!course.is_free && published && (
              <div className="mt-4 rounded-xl border border-dark-border bg-white/5 p-4">
                <div className="text-xs text-muted">Acceso premium</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="text-2xl font-semibold text-white">
                    {course.price != null ? `${course.price} €` : 'Precio no definido'}
                  </div>
                  <div className="text-sm text-muted">pago único</div>
                </div>
                <p className="mt-2 text-sm text-muted">
                  Acceso completo al curso, recursos y progreso sincronizado.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>

    {/* Instructor Preview Modal */}
    {instructorPreview.instructorId && (
      <InstructorPreviewModal
        instructorId={instructorPreview.instructorId}
        isOpen={instructorPreview.isOpen}
        onClose={instructorPreview.closePreview}
        position={instructorPreview.position}
      />
    )}
    </>
  )
}
