import Link from 'next/link'
import { GraduationCap, Shield, Users, BookOpen, Award, ArrowRight, Star, MessageCircle } from 'lucide-react'
import { Footer } from '@/components/navigation/Footer'

export const metadata = {
  title: 'Mentoría | Nodo360',
  description: 'Aprende de los mejores instructores y mentores de la comunidad Nodo360',
}

export default function MentoriaPage() {
  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <div className="bg-gradient-to-b from-brand/10 via-purple-500/5 to-transparent py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-6">
            <Star className="w-4 h-4 text-yellow-400" />
            Conecta con expertos de la comunidad
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Aprende de los mejores
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Acelera tu carrera en Bitcoin y Blockchain con instructores certificados y mentores que te guiarán paso a paso.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Dos secciones principales */}
        <div className="grid gap-8 md:grid-cols-2 mb-16">
          {/* Instructores */}
          <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 p-8">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-6">
              <GraduationCap className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Instructores</h2>
            <p className="text-gray-400 mb-6">
              Nuestros instructores son profesionales certificados que crean cursos de alta calidad.
              Aprende de su experiencia práctica y conocimientos profundos en Bitcoin, Blockchain y tecnologías Web3.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-gray-300">
                <BookOpen className="w-5 h-5 text-orange-400 flex-shrink-0" />
                Cursos estructurados y completos
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Award className="w-5 h-5 text-orange-400 flex-shrink-0" />
                Certificación oficial al completar
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Star className="w-5 h-5 text-orange-400 flex-shrink-0" />
                Instructores verificados y evaluados
              </li>
            </ul>
            <Link
              href="/instructores"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Ver Instructores
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Mentores */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/20 p-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Mentores</h2>
            <p className="text-gray-400 mb-6">
              Los mentores son miembros destacados de la comunidad que dedican su tiempo a guiar y apoyar a otros.
              Recibe orientación personalizada y resuelve tus dudas directamente.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-gray-300">
                <MessageCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                Sesiones personalizadas 1-on-1
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Users className="w-5 h-5 text-purple-400 flex-shrink-0" />
                Conexión directa con expertos
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Star className="w-5 h-5 text-purple-400 flex-shrink-0" />
                Miembros con trayectoria comprobada
              </li>
            </ul>
            <Link
              href="/mentores"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Ver Mentores
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* ¿Quieres contribuir? */}
        <section className="rounded-2xl bg-white/5 border border-white/10 p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            ¿Quieres contribuir a la comunidad?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Comparte tu conocimiento y ayuda a otros a crecer. Conviértete en instructor o mentor
            y forma parte del núcleo de Nodo360.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard/instructor"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 font-medium hover:bg-orange-500/30 transition-colors"
            >
              <GraduationCap className="w-5 h-5" />
              Ser Instructor
            </Link>
            <Link
              href="/dashboard/mentor"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 font-medium hover:bg-purple-500/30 transition-colors"
            >
              <Shield className="w-5 h-5" />
              Ser Mentor
            </Link>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <div className="rounded-xl bg-white/5 border border-white/10 p-5 text-center">
            <div className="text-3xl font-bold text-white mb-1">100+</div>
            <div className="text-sm text-gray-400">Cursos disponibles</div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-5 text-center">
            <div className="text-3xl font-bold text-white mb-1">50+</div>
            <div className="text-sm text-gray-400">Instructores certificados</div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-5 text-center">
            <div className="text-3xl font-bold text-white mb-1">20+</div>
            <div className="text-sm text-gray-400">Mentores activos</div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-5 text-center">
            <div className="text-3xl font-bold text-white mb-1">5000+</div>
            <div className="text-sm text-gray-400">Estudiantes</div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
