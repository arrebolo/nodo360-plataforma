// Icon keys for mentorship benefits
export type MentoriaIconKey =
  | 'target'
  | 'video'
  | 'code2'
  | 'briefcase'
  | 'users'
  | 'messageCircle'

export const MENTORIA_BENEFITS: Array<{
  iconKey: MentoriaIconKey
  title: string
  description: string
}> = [
  {
    iconKey: 'target',
    title: 'Plan Personalizado',
    description: 'Diseñamos un plan de estudio adaptado a tus objetivos'
  },
  {
    iconKey: 'video',
    title: 'Sesiones 1-on-1',
    description: 'Videollamadas individuales con tu mentor'
  },
  {
    iconKey: 'code2',
    title: 'Revisión de Código',
    description: 'Feedback detallado en tus proyectos'
  },
  {
    iconKey: 'briefcase',
    title: 'Preparación Laboral',
    description: 'Simula entrevistas y optimiza tu CV'
  },
  {
    iconKey: 'users',
    title: 'Networking',
    description: 'Conexiones con profesionales de la industria'
  },
  {
    iconKey: 'messageCircle',
    title: 'Soporte Continuo',
    description: 'Chat directo con tu mentor entre sesiones'
  }
]


