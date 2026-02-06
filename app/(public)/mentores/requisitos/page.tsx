import Link from 'next/link'
import {
  Shield,
  ArrowLeft,
  CheckCircle,
  Star,
  BookOpen,
  Users,
  Award,
  Clock,
  TrendingUp,
  Vote,
  MessageCircle,
} from 'lucide-react'

export const metadata = {
  title: 'Requisitos para ser Mentor | Nodo360',
  description: 'Conoce los requisitos y el proceso para convertirte en mentor de la comunidad Nodo360',
}

const REQUIREMENTS = [
  {
    icon: Star,
    title: '650 puntos de merito',
    description: 'Acumula puntos participando activamente en la plataforma',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  {
    icon: BookOpen,
    title: 'Completar cursos',
    description: 'Completa los cursos gratuitos de la plataforma para demostrar tu conocimiento',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  {
    icon: Clock,
    title: 'Cuenta activa +3 meses',
    description: 'Tu cuenta debe tener al menos 3 meses de antiguedad',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  {
    icon: CheckCircle,
    title: 'Sin sanciones activas',
    description: 'Mantener un historial limpio sin infracciones comunitarias',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
  },
]

const MERIT_POINTS = [
  { action: 'Completar un curso', points: '+10', icon: BookOpen },
  { action: 'Responder en la comunidad', points: '+5', icon: MessageCircle },
  { action: 'Ayudar a otro estudiante', points: '+5', icon: Users },
  { action: 'Propuesta de gobernanza aprobada', points: '+50', icon: Vote },
  { action: 'Referir un nuevo usuario', points: '+20', icon: TrendingUp },
]

const BENEFITS = [
  {
    icon: Vote,
    title: 'Poder de decision',
    description: 'Vota y decide el futuro de la plataforma',
  },
  {
    icon: Award,
    title: 'Badge exclusivo',
    description: 'Distintivo de mentor en tu perfil',
  },
  {
    icon: Shield,
    title: 'Revisar cursos',
    description: 'Aprueba cursos de nuevos instructores',
  },
  {
    icon: Users,
    title: 'Mentoria remunerada',
    description: 'Sesiones 1:1 con estudiantes (proximamente)',
  },
]

export default function MentorRequirementsPage() {
  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <div className="bg-gradient-to-b from-purple-500/10 via-transparent to-transparent py-16">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href="/mentores"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a mentores
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold text-white">Como convertirse en Mentor</h1>
          </div>
          <p className="text-xl text-white/70 max-w-2xl">
            Los mentores son miembros destacados que guian y apoyan a la comunidad Nodo360.
            Conoce los requisitos y beneficios.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Requisitos */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-purple-400" />
            Requisitos
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {REQUIREMENTS.map((req) => (
              <div
                key={req.title}
                className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${req.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <req.icon className={`w-5 h-5 ${req.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{req.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{req.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Como ganar puntos */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400" />
            Como ganar puntos de merito
          </h2>
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="divide-y divide-white/10">
              {MERIT_POINTS.map((item) => (
                <div
                  key={item.action}
                  className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="flex-1 text-white">{item.action}</span>
                  <span className="font-semibold text-yellow-400">{item.points}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Proceso de aplicacion */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            Proceso de aplicacion
          </h2>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <ol className="space-y-6">
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-purple-400">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Cumple los requisitos</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Acumula 650 puntos de merito y cumple todos los requisitos listados arriba.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-purple-400">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Envia tu aplicacion</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Completa el formulario explicando tu motivacion y experiencia en el ecosistema.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-purple-400">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Votacion del consejo</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Los mentores actuales revisan tu aplicacion y votan. Necesitas minimo 3 votos a favor.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Bienvenido al equipo</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Si eres aprobado, recibiras el rol de mentor y acceso a todas las herramientas.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Beneficios */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            Beneficios de ser mentor
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-2xl bg-white/5 border border-white/10 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{benefit.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">¿Listo para aplicar?</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-6">
            Si cumples con los requisitos, inicia sesion y envia tu aplicacion desde el panel de mentor.
          </p>
          <Link
            href="/dashboard/mentor"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Shield className="w-5 h-5" />
            Ir al panel de mentor
          </Link>
        </section>
      </div>
    </div>
  )
}
