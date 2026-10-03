'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { translateError } from '@/lib/error-messages'
import {
  slugify,
  validateCourseData,
  type CourseFormData,
  type CourseLevel,
  type CourseStatus,
} from '@/lib/courses/course-utils'
import {
  TitleField,
  SlugField,
  DescriptionFields,
  LearningPathDropdown,
  LevelStatusSelects,
  PricingToggles,
} from './fields'
import ImageUpload from '@/components/ui/ImageUpload'
import { relanzarSiEsRedireccion } from '@/lib/navegacion/es-redireccion'

interface CourseFormCoreProps {
  /** Server action to handle form submission */
  action: (formData: FormData) => Promise<{ success: boolean; error?: string }>
  /** Initial data for edit mode */
  initialData?: Partial<CourseFormData & { id: string }>
  /** URL to navigate back to */
  backUrl: string
  /** Submit button label */
  submitLabel?: string
  /** Submitting button label */
  submittingLabel?: string
  /**
   * Las especialidades que puede elegir quien crea el curso.
   *
   * En modo instructor son SUS verificaciones vigentes y el campo es obligatorio: un
   * curso sin especialidad no se puede enviar a revision, y hasta ahora nacia sin
   * clasificar sin que nada lo dijera. En el panel de administracion se pasa la lista
   * completa y es opcional: un admin crea cursos sin estar verificado en nada.
   */
  especialidades?: {
    id: string
    nombre: string
    requiereJurisdiccion: boolean
    jurisdicciones: string[]
  }[]
  /** Si hay que elegir especialidad para poder crear. */
  especialidadObligatoria?: boolean
}

export function CourseFormCore({
  action,
  initialData,
  backUrl,
  submitLabel = 'Crear Curso',
  submittingLabel = 'Guardando...',
  especialidades = [],
  especialidadObligatoria = false,
}: CourseFormCoreProps) {
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [longDescription, setLongDescription] = useState(initialData?.long_description || '')
  const [level, setLevel] = useState<CourseLevel>(initialData?.level || 'beginner')
  const [status, setStatus] = useState<CourseStatus>(initialData?.status || 'draft')
  const [specialtyId, setSpecialtyId] = useState(
    // Preseleccionada SOLO si hay una, y aqui si queda guardada: este formulario
    // crea el curso, asi que lo que se ve es lo que se graba.
    initialData?.specialty_id ?? (especialidades.length === 1 ? especialidades[0].id : '')
  )
  const [jurisdiccion, setJurisdiccion] = useState(initialData?.jurisdiccion ?? '')
  const especialidadElegida = especialidades.find((e) => e.id === specialtyId)
  const hacenFaltaPaises = Boolean(especialidadElegida?.requiereJurisdiccion)
  const [isFree, setIsFree] = useState(initialData?.is_free ?? true)
  const [isPremium, setIsPremium] = useState(initialData?.is_premium ?? false)
  const [price, setPrice] = useState<number | null>(initialData?.price ?? null)
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnail_url || '')
  const [bannerUrl, setBannerUrl] = useState(initialData?.banner_url || '')
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>([])

  // Auto-generate slug from title (only in create mode)
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (!initialData?.id) {
      setSlug(slugify(newTitle))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    // Build form data object for validation
    const formDataObj: CourseFormData = {
      title,
      slug,
      description,
      long_description: longDescription || null,
      level,
      status,
      is_free: isFree,
      is_premium: isPremium,
      price: isFree ? null : price,
      thumbnail_url: thumbnailUrl || null,
      banner_url: bannerUrl || null,
    }

    // Client-side validation
    const validation = validateCourseData(formDataObj)
    if (!validation.valid) {
      setErrors(validation.errors)
      toast.error('Por favor corrige los errores del formulario')
      return
    }

    // Build FormData for server action
    const formData = new FormData()
    formData.set('title', title)
    formData.set('slug', slug)
    formData.set('description', description)
    formData.set('long_description', longDescription)
    formData.set('level', level)
    formData.set('status', status)
    formData.set('is_free', isFree ? 'true' : 'false')
    formData.set('is_premium', isPremium ? 'true' : 'false')
    if (!isFree && price != null) {
      formData.set('price', price.toString())
    }
    if (specialtyId) formData.set('specialty_id', specialtyId)
    // En las especialidades que no van por pais la jurisdiccion TIENE que ir vacia:
    // el trigger de la 109 lo exige en los dos sentidos.
    if (hacenFaltaPaises && jurisdiccion) formData.set('jurisdiccion', jurisdiccion)
    if (thumbnailUrl) formData.set('thumbnail_url', thumbnailUrl)
    if (bannerUrl) formData.set('banner_url', bannerUrl)
    if (selectedPathIds.length > 0) {
      formData.set('learning_path_ids', JSON.stringify(selectedPathIds))
    }

    if (especialidadObligatoria && !specialtyId) {

      toast.error('Elige la especialidad del curso: sin ella no se podrá enviar a revisión.')

      return

    }

    if (hacenFaltaPaises && !jurisdiccion) {

      toast.error('Esta especialidad se verifica por país: elige la jurisdicción.')

      return

    }


    startTransition(async () => {
      try {
        const result = await action(formData)
        if (!result.success && result.error) {
          toast.error(translateError(result.error))
        } else {
          toast.success(initialData?.id ? 'Curso actualizado' : 'Curso creado')
        }
      } catch (error) {
        // UNA REDIRECCION NO ES UN ERROR.
        //
        // La accion de servidor termina con redirect(), que no devuelve: lanza. Al
        // atraparlo aqui, la navegacion no ocurria y encima translateError() no
        // reconocia «NEXT_REDIRECT», asi que devolvia el texto generico: el curso se
        // creaba bien y se le decia a la persona que habia fallado.
        relanzarSiEsRedireccion(error)

        console.error('Error al guardar:', error)
        const errorMessage = error instanceof Error ? translateError(error.message) : 'Error al guardar el curso'
        toast.error(errorMessage)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Form Card */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
        <TitleField
          value={title}
          onChange={handleTitleChange}
          error={errors.title}
        />

        <SlugField
          value={slug}
          onChange={setSlug}
          error={errors.slug}
        />

        <DescriptionFields
          shortDescription={description}
          longDescription={longDescription}
          onShortChange={setDescription}
          onLongChange={setLongDescription}
          errors={{ description: errors.description, long_description: errors.long_description }}
        />

        <LearningPathDropdown
          selectedPathIds={selectedPathIds}
          onChange={setSelectedPathIds}
          disabled={isPending}
        />

        {especialidades.length > 0 && (

          <div className="grid gap-4 sm:grid-cols-2">

            <div className="space-y-2">

              <label className="text-sm font-medium text-white/80" htmlFor="specialty_id">

                Especialidad {especialidadObligatoria ? '*' : '(opcional)'}

              </label>

              <select

                id="specialty_id"

                value={specialtyId}

                onChange={(e) => {

                  setSpecialtyId(e.target.value)

                  setJurisdiccion('')

                }}

                className="w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-white"

              >

                <option value="">Elige la especialidad…</option>

                {especialidades.map((e) => (

                  <option key={e.id} value={e.id}>{e.nombre}</option>

                ))}

              </select>

              {especialidadObligatoria && (

                <p className="text-xs text-white/50">

                  Solo las especialidades en las que estás verificado. Sin ella no podrás

                  enviar el curso a revisión.

                </p>

              )}

            </div>

            {hacenFaltaPaises && (

              <div className="space-y-2">

                <label className="text-sm font-medium text-white/80" htmlFor="jurisdiccion">

                  Jurisdicción *

                </label>

                <select

                  id="jurisdiccion"

                  value={jurisdiccion}

                  onChange={(e) => setJurisdiccion(e.target.value)}

                  className="w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-white"

                >

                  <option value="">Elige el país…</option>

                  {(especialidadElegida?.jurisdicciones ?? []).map((j) => (

                    <option key={j} value={j}>{j}</option>

                  ))}

                </select>

                <p className="text-xs text-white/50">

                  Esta especialidad se verifica por país: el curso dice a qué normativa aplica.

                </p>

              </div>

            )}

          </div>

        )}


        <LevelStatusSelects
          level={level}
          status={status}
          onLevelChange={setLevel}
          onStatusChange={setStatus}
          errors={{ level: errors.level, status: errors.status }}
        />

        <PricingToggles
          isFree={isFree}
          isPremium={isPremium}
          price={price}
          onIsFreeChange={setIsFree}
          onIsPremiumChange={setIsPremium}
          onPriceChange={setPrice}
          errors={{ price: errors.price }}
        />

        {/* Imagenes del curso */}
        <div className="space-y-6 pt-6 border-t border-white/10">
          <h3 className="text-lg font-semibold text-white">
            Imágenes del curso
          </h3>

          <ImageUpload
            bucket="course-images"
            folder={`courses/${slug || 'nuevo'}/thumbnails`}
            currentUrl={thumbnailUrl || null}
            onUpload={(url) => setThumbnailUrl(url)}
            aspectRatio="video"
            label="Thumbnail del Curso *"
            hint="Imagen principal que aparece en las cards. Recomendado: 1280x720px (16:9)"
            maxSizeMB={2}
          />

          <ImageUpload
            bucket="course-images"
            folder={`courses/${slug || 'nuevo'}/banners`}
            currentUrl={bannerUrl || null}
            onUpload={(url) => setBannerUrl(url)}
            aspectRatio="banner"
            label="Banner del Curso"
            hint="Imagen de cabecera en la página del curso. Recomendado: 1920x640px (3:1)"
            maxSizeMB={3}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Link
          href={backUrl}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          {initialData?.id ? 'Volver' : 'Cancelar'}
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-light to-brand text-white font-semibold rounded-lg hover:shadow-2xl hover:shadow-brand-light/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isPending ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  )
}
