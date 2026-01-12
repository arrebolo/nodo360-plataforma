'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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
}

export function CourseFormCore({
  action,
  initialData,
  backUrl,
  submitLabel = 'Crear Curso',
  submittingLabel = 'Guardando...',
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
    if (thumbnailUrl) formData.set('thumbnail_url', thumbnailUrl)
    if (bannerUrl) formData.set('banner_url', bannerUrl)
    if (selectedPathIds.length > 0) {
      formData.set('learning_path_ids', JSON.stringify(selectedPathIds))
    }

    startTransition(async () => {
      try {
        const result = await action(formData)
        if (!result.success && result.error) {
          toast.error(result.error)
        } else {
          toast.success(initialData?.id ? 'Curso actualizado' : 'Curso creado')
        }
      } catch (error) {
        console.error('Error al guardar:', error)
        toast.error('Error al guardar el curso')
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
            Imagenes del curso
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
            hint="Imagen de cabecera en la pagina del curso. Recomendado: 1920x640px (3:1)"
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
