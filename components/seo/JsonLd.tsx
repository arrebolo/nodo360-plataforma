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
        // La tarjeta Open Graph del propio curso, que lleva su titulo, su nivel
        // y su numero de lecciones. Antes apuntaba a og-nodo360.png, que no
        // existia: un Course con una image rota es peor que uno sin image,
        // porque Google la valida y la marca como error.
        image: `${baseUrl}/cursos/${slug}/opengraph-image`,
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

// Lista ordenada de cursos: los de una ruta de aprendizaje, en el orden en que
// se estudian. Es lo que convierte una ruta en algo entendible para un buscador:
// sin esto, una ruta es una pagina con enlaces sueltos y no se sabe que hay una
// secuencia ni cual es.
interface CursoDeLaLista {
  slug: string
  title: string
  description: string | null
  is_free: boolean
}

interface CourseListJsonLdProps {
  name: string
  description?: string | null
  courses: CursoDeLaLista[]
}

export function CourseListJsonLd({ name, description, courses }: CourseListJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nodo360.com'

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name,
        ...(description ? { description } : {}),
        numberOfItems: courses.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        // La posicion va 1..n y NO es learning_path_courses.position: la lista
        // llega ya ordenada por ese campo, pero sus valores pueden tener huecos
        // y schema.org espera un orden correlativo desde 1.
        itemListElement: courses.map((curso, indice) => ({
          '@type': 'ListItem',
          position: indice + 1,
          url: `${baseUrl}/cursos/${curso.slug}`,
          item: {
            '@type': 'Course',
            name: curso.title,
            description: curso.description || `Curso de ${curso.title}`,
            url: `${baseUrl}/cursos/${curso.slug}`,
            provider: {
              '@type': 'Organization',
              name: 'Nodo360',
              url: baseUrl,
            },
            inLanguage: 'es',
            isAccessibleForFree: curso.is_free,
          },
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
