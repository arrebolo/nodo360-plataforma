import { DISCORD_INVITE_URL } from '@/lib/discord/invite'

export const brandConfig = {
  logo: {
    url: '/imagenes/logo-nodo360.png',
    alt: 'Nodo360 - Aprende Bitcoin y Blockchain',
    sizes: {
      xs: { width: 100, height: 100 },
      sm: { width: 40, height: 40 },
      md: { width: 250, height: 250 },
      lg: { width: 400, height: 400 },
      xl: { width: 600, height: 600 }
    }
  },
  name: 'Nodo360',
  // El mismo texto que el H1 de la home. Decia 'Domina Bitcoin y Blockchain'
  // cuando el H1 ya no lo decia: el titulo de la pestana y la tarjeta que se
  // comparte prometian una cosa y la pagina, otra.
  tagline: 'Aprende Bitcoin y Web3 en español',
  description: 'Cursos gratuitos de Bitcoin, Blockchain y Web3 en español',
  colors: {
    primary: '#ff6b35',
    primaryLight: '#f7931a',
    secondary: '#1a1f2e',
    premium: '#FFD700',
    premiumLight: '#FFA500'
  },
  social: {
    discord: DISCORD_INVITE_URL,
    telegram: 'https://t.me/nodo360',
    twitter: 'https://twitter.com/nodo360',
    youtube: 'https://youtube.com/@nodo360'
  }
} as const

/**
 * El titulo por defecto del sitio. Un solo sitio, para que no vuelvan a
 * divergir.
 *
 * Hacia de esto tres textos distintos a la vez: el `default` del layout raiz
 * decia «Formacion profesional en Bitcoin, Blockchain y Web3», la home decia
 * otra cosa y las tarjetas de openGraph una tercera. En GA4 se veian como
 * paginas distintas.
 *
 * Se queda el de la tagline porque es el que repite el H1 de la home, y porque
 * «formacion profesional» nombra en Espana una titulacion reglada que Nodo360
 * no da.
 *
 * Vale tambien como `default` del raiz: es el que sale en las paginas que no
 * declaran titulo propio (recuperar contrasena, onboarding).
 */
export const TITULO_POR_DEFECTO = `${brandConfig.tagline} | ${brandConfig.name}`

export type BrandConfig = typeof brandConfig
export type LogoSize = keyof typeof brandConfig.logo.sizes


