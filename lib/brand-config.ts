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
  tagline: 'Domina Bitcoin y Blockchain',
  description: 'La plataforma educativa más completa en español para aprender Bitcoin, Blockchain y Web3',
  colors: {
    primary: '#ff6b35',
    primaryLight: '#f7931a',
    secondary: '#1a1f2e',
    premium: '#FFD700',
    premiumLight: '#FFA500'
  },
  social: {
    discord: 'https://discord.gg/gKRFcPZD',
    telegram: 'https://t.me/nodo360',
    twitter: 'https://twitter.com/nodo360',
    youtube: 'https://youtube.com/@nodo360'
  }
} as const

export type BrandConfig = typeof brandConfig
export type LogoSize = keyof typeof brandConfig.logo.sizes
