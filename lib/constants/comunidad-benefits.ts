// Icon keys for community benefits
export type ComunidadIconKey =
  | 'messageSquare'
  | 'calendar'
  | 'trophy'
  | 'lightbulb'
  | 'users2'
  | 'zap'

export const COMUNIDAD_BENEFITS: Array<{
  iconKey: ComunidadIconKey
  title: string
  description: string
}> = [
  {
    iconKey: 'messageSquare',
    title: 'Discord Activo',
    description: 'Comunidad 24/7 con +2,500 estudiantes'
  },
  {
    iconKey: 'calendar',
    title: 'Eventos Semanales',
    description: 'Webinars, workshops y sesiones de código en vivo'
  },
  {
    iconKey: 'trophy',
    title: 'Desafíos y Proyectos',
    description: 'Retos prácticos con premios y reconocimientos'
  },
  {
    iconKey: 'lightbulb',
    title: 'Ayuda entre Pares',
    description: 'Resuelve dudas con otros estudiantes y mentores'
  },
  {
    iconKey: 'users2',
    title: 'Grupos de Estudio',
    description: 'Forma equipos para proyectos colaborativos'
  },
  {
    iconKey: 'zap',
    title: 'Networking',
    description: 'Conecta con profesionales del sector Bitcoin'
  }
]
