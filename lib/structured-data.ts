import type { Course } from '@/types/database'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

/**
 * Genera structured data para un curso
 * Para mejorar SEO y mostrar rich snippets en Google
 */
export function generateCourseStructuredData(course: Course) {
  const levelMap = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description || course.long_description,
    provider: {
      '@type': 'Organization',
      name: 'Nodo360',
      sameAs: baseUrl,
    },
    educationalLevel: levelMap[course.level],
    inLanguage: 'es',
    availableLanguage: 'es',
    isAccessibleForFree: !course.is_premium,
    ...(course.is_premium && {
      offers: {
        '@type': 'Offer',
        price: course.price?.toString() || '0',
        priceCurrency: 'EUR',
      }
    }),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: `PT${Math.ceil((course.total_duration_minutes || 0) / 60)}H`,
    },
    ...(course.thumbnail_url && {
      image: course.thumbnail_url
    }),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: course.enrolled_count || 0,
    },
    numberOfLessons: course.total_lessons,
  }
}

/**
 * Genera structured data para la organización
 */
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Nodo360',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'Plataforma educativa líder en español para Bitcoin, Blockchain y Web3. Cursos gratuitos y premium con certificación.',
    sameAs: [
      'https://twitter.com/nodo360',
      'https://linkedin.com/company/nodo360',
      'https://github.com/nodo360',
      'https://discord.gg/nodo360',
      'https://t.me/nodo360',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'hola@nodo360.com',
      availableLanguage: ['es', 'en'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ES',
    },
  }
}

/**
 * Genera structured data para una lección (VideoObject)
 */
export function generateLessonStructuredData(lesson: any, course: Course) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: lesson.title,
    description: lesson.description,
    thumbnailUrl: course.thumbnail_url,
    uploadDate: lesson.created_at,
    duration: `PT${lesson.video_duration_minutes}M`,
    contentUrl: lesson.video_url,
    embedUrl: lesson.video_url,
    isPartOf: {
      '@type': 'Course',
      name: course.title,
      provider: {
        '@type': 'Organization',
        name: 'Nodo360',
      },
    },
  }
}

/**
 * Genera structured data para el breadcrumb
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Genera structured data para FAQ
 */
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Genera structured data para la búsqueda del sitio
 */
export function generateSiteSearchStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/buscar?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Componente helper para inyectar structured data en páginas
 * Comentado para MVP - requiere convertir archivo a .tsx
 */
/*
export function StructuredData({ data }: { data: any }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
      }}
    />
  )
}
*/
