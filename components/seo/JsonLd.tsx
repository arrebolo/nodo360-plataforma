interface JsonLdProps {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Organization schema for the site
export function OrganizationJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Nodo360',
        url: baseUrl,
        logo: `${baseUrl}/imagenes/logo-nodo360.png`,
        description: 'Plataforma educativa de Bitcoin, Blockchain y Web3 en español',
        sameAs: [
          'https://twitter.com/nodo360',
          'https://youtube.com/@nodo360',
        ],
      }}
    />
  )
}

// Course schema
interface CourseJsonLdProps {
  title: string
  description: string | null
  thumbnailUrl: string | null
  level: string
  isFree: boolean
  price?: number
  slug: string
}

export function CourseJsonLd({
  title,
  description,
  thumbnailUrl,
  level,
  isFree,
  price,
  slug,
}: CourseJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: title,
        description: description || `Curso de ${title}`,
        provider: {
          '@type': 'Organization',
          name: 'Nodo360',
          url: baseUrl,
        },
        url: `${baseUrl}/cursos/${slug}`,
        educationalLevel: level,
        isAccessibleForFree: isFree,
        image: thumbnailUrl || `${baseUrl}/imagenes/og-nodo360.png`,
        inLanguage: 'es',
        courseMode: 'online',
        offers: {
          '@type': 'Offer',
          price: isFree ? '0' : (price || 0).toString(),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
        },
      }}
    />
  )
}

// Breadcrumb schema
interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  )
}

// WebSite schema with search
export function WebSiteJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Nodo360',
        url: baseUrl,
        description: 'Plataforma educativa de Bitcoin, Blockchain y Web3 en español',
        inLanguage: 'es',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/cursos?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  )
}
