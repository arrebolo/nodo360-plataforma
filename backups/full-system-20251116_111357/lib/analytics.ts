/**
 * Google Analytics Integration
 * Funciones para tracking de eventos y pageviews
 */

// Obtener el ID de medición de GA desde variables de entorno
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID

// Declarar tipos para gtag en window
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

/**
 * Verifica si GA está disponible
 */
const isGAAvailable = (): boolean => {
  return typeof window !== 'undefined' &&
         typeof window.gtag !== 'undefined' &&
         !!GA_MEASUREMENT_ID
}

/**
 * Track page views
 * Llamar cuando cambia la ruta en el router
 */
export const pageview = (url: string) => {
  if (!isGAAvailable()) return

  window.gtag('config', GA_MEASUREMENT_ID!, {
    page_path: url,
  })
}

/**
 * Track eventos genéricos
 */
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (!isGAAvailable()) return

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}

// ============================================
// EVENTOS ESPECÍFICOS DE NODO360
// ============================================

/**
 * Track cuando un usuario ve un curso
 */
export const trackCourseView = (courseSlug: string, courseTitle: string) => {
  event({
    action: 'view_course',
    category: 'Course',
    label: `${courseSlug} - ${courseTitle}`,
  })
}

/**
 * Track cuando un usuario se inscribe en un curso
 */
export const trackCourseEnrollment = (courseSlug: string, courseTitle: string, isPremium: boolean) => {
  event({
    action: 'enroll_course',
    category: 'Course',
    label: `${courseSlug} - ${courseTitle}`,
    value: isPremium ? 1 : 0, // 1 for premium, 0 for free
  })
}

/**
 * Track cuando un usuario completa una lección
 */
export const trackLessonComplete = (lessonSlug: string, lessonTitle: string, courseSlug: string) => {
  event({
    action: 'complete_lesson',
    category: 'Lesson',
    label: `${courseSlug}/${lessonSlug} - ${lessonTitle}`,
  })
}

/**
 * Track cuando un usuario inicia una lección
 */
export const trackLessonStart = (lessonSlug: string, lessonTitle: string, courseSlug: string) => {
  event({
    action: 'start_lesson',
    category: 'Lesson',
    label: `${courseSlug}/${lessonSlug} - ${lessonTitle}`,
  })
}

/**
 * Track suscripciones al newsletter
 */
export const trackNewsletterSignup = (source?: string) => {
  event({
    action: 'signup',
    category: 'Newsletter',
    label: source || 'general',
  })
}

/**
 * Track solicitudes de mentoría
 */
export const trackMentorshipRequest = (goal: string) => {
  event({
    action: 'request_mentorship',
    category: 'Mentorship',
    label: goal,
  })
}

/**
 * Track descargas de certificados
 */
export const trackCertificateDownload = (courseSlug: string, courseTitle: string) => {
  event({
    action: 'download_certificate',
    category: 'Certificate',
    label: `${courseSlug} - ${courseTitle}`,
  })
}

/**
 * Track compartir en redes sociales
 */
export const trackSocialShare = (platform: 'linkedin' | 'twitter' | 'facebook', contentType: 'course' | 'certificate', contentId: string) => {
  event({
    action: 'share',
    category: 'Social',
    label: `${platform} - ${contentType} - ${contentId}`,
  })
}

/**
 * Track búsquedas
 */
export const trackSearch = (query: string, resultsCount: number) => {
  event({
    action: 'search',
    category: 'Search',
    label: query,
    value: resultsCount,
  })
}

/**
 * Track clicks en CTAs principales
 */
export const trackCTAClick = (ctaName: string, location: string) => {
  event({
    action: 'click_cta',
    category: 'CTA',
    label: `${ctaName} - ${location}`,
  })
}

/**
 * Track unirse a comunidad (Discord/Telegram)
 */
export const trackCommunityJoin = (platform: 'discord' | 'telegram') => {
  event({
    action: 'join_community',
    category: 'Community',
    label: platform,
  })
}

/**
 * Track contribuciones a proyectos
 */
export const trackProjectContribution = (projectName: string) => {
  event({
    action: 'contribute_project',
    category: 'Project',
    label: projectName,
  })
}

/**
 * Track logros desbloqueados (gamificación)
 */
export const trackAchievementUnlock = (achievementType: string) => {
  event({
    action: 'unlock_achievement',
    category: 'Achievement',
    label: achievementType,
  })
}

/**
 * Track tiempo en página (llamar al salir)
 */
export const trackTimeOnPage = (pagePath: string, seconds: number) => {
  event({
    action: 'time_on_page',
    category: 'Engagement',
    label: pagePath,
    value: seconds,
  })
}

/**
 * Track errores en formularios
 */
export const trackFormError = (formName: string, errorMessage: string) => {
  event({
    action: 'form_error',
    category: 'Form',
    label: `${formName} - ${errorMessage}`,
  })
}

/**
 * Track conversiones (compras premium, etc.)
 */
export const trackConversion = (conversionType: string, value: number) => {
  if (!isGAAvailable()) return

  window.gtag('event', 'conversion', {
    send_to: GA_MEASUREMENT_ID,
    value: value,
    currency: 'EUR',
    transaction_id: `${Date.now()}-${conversionType}`,
  })
}

/**
 * Hook de React para track pageviews automáticamente
 * Usar en layout o componentes principales
 */
export const useAnalytics = () => {
  if (typeof window === 'undefined') return

  // Track pageview inicial
  pageview(window.location.pathname + window.location.search)

  // Puedes agregar listeners para cambios de ruta si usas Next.js router
}

/**
 * Componente para incluir el script de GA en el layout
 * Comentado para MVP - requiere convertir archivo a .tsx
 */
/*
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics ID not found in environment variables')
    return null
  }

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <script
        id="google-analytics"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}
*/
