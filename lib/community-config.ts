export type CommunityPlatform = 'discord' | 'telegram' | 'slack' | 'forum'

export interface CommunityConfig {
  platform: CommunityPlatform
  urls: Record<CommunityPlatform, string>
  memberCount: string
  features: {
    free: string[]
    premium: string[]
  }
}

export const communityConfig: CommunityConfig = {
  platform: 'discord', // Plataforma por defecto
  urls: {
    discord: 'https://discord.gg/gKRFcPZD',
    telegram: 'https://t.me/nodo360',
    slack: 'https://nodo360.slack.com',
    forum: 'https://comunidad.nodo360.com',
  },
  memberCount: '2.3k',
  features: {
    free: [
      'Acceso al canal general',
      'Preguntas y respuestas',
      'Recursos compartidos',
      'Networking con estudiantes',
    ],
    premium: [
      'Todo lo de comunidad gratuita',
      'Canal premium exclusivo',
      'Soporte prioritario',
      'Sesiones en vivo mensuales',
      'Acceso a instructores',
      'Grupos de estudio privados',
    ],
  },
}

export const platformNames: Record<CommunityPlatform, string> = {
  discord: 'Discord',
  telegram: 'Telegram',
  slack: 'Slack',
  forum: 'Foro',
}


