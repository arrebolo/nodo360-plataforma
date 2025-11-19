'use client'

import Link from 'next/link'
import { Trophy, BookOpen, Clock, CheckCircle2, Flame, Calendar, Star, Award, TrendingUp, Download, Share2, ArrowRight, Play } from 'lucide-react'

// Mock data for demonstration
const mockStats = {
  totalProgress: 65,
  activeCourses: 3,
  completedLessons: 24,
  totalLessons: 45,
  hoursStudied: 18.5,
  currentStreak: 7,
  certificatesEarned: 1
}

const mockEnrollments = [
  {
    id: '1',
    course: {
      id: '1',
      title: 'Fundamentos de Bitcoin',
      slug: 'fundamentos-bitcoin',
      thumbnail_url: null,
      level: 'beginner' as const
    },
    progress_percentage: 75,
    last_lesson: {
      id: '1',
      title: 'Introducción a la Criptografía',
      slug: 'intro-criptografia'
    },
    completed_lessons: 6,
    total_lessons: 8
  },
  {
    id: '2',
    course: {
      id: '2',
      title: 'Blockchain Avanzado',
      slug: 'blockchain-avanzado',
      thumbnail_url: null,
      level: 'advanced' as const
    },
    progress_percentage: 40,
    last_lesson: {
      id: '2',
      title: 'Consenso PoS vs PoW',
      slug: 'consenso-pos-pow'
    },
    completed_lessons: 8,
    total_lessons: 20
  },
  {
    id: '3',
    course: {
      id: '3',
      title: 'Introducción a DeFi',
      slug: 'intro-defi',
      thumbnail_url: null,
      level: 'intermediate' as const
    },
    progress_percentage: 100,
    last_lesson: null,
    completed_lessons: 12,
    total_lessons: 12,
    completed: true
  }
]

const mockActivities = [
  { type: 'lesson_completed', title: 'Completaste "¿Qué es Bitcoin?"', timeAgo: 'hace 2 días', icon: CheckCircle2 },
  { type: 'course_enrolled', title: 'Iniciaste "Fundamentos Blockchain"', timeAgo: 'hace 3 días', icon: BookOpen },
  { type: 'certificate_earned', title: 'Obtuviste certificado de "Bitcoin desde Cero"', timeAgo: 'hace 1 semana', icon: Award },
  { type: 'streak', title: 'Alcanzaste racha de 7 días 🔥', timeAgo: 'hace 1 semana', icon: Flame }
]

const mockAchievements = [
  { id: '1', type: 'first_lesson', name: 'Primera Lección', icon: '🎓', unlocked: true },
  { id: '2', type: 'streak_7', name: 'Racha de 7 Días', icon: '🔥', unlocked: true },
  { id: '3', type: 'course_completed_1', name: 'Primer Curso', icon: '🏆', unlocked: true },
  { id: '4', type: 'lessons_50', name: '50 Lecciones', icon: '⭐', unlocked: false, progress: 24, max: 50 },
  { id: '5', type: 'course_completed_5', name: '5 Cursos', icon: '💎', unlocked: false, progress: 1, max: 5 },
  { id: '6', type: 'bitcoin_expert', name: 'Experto en Bitcoin', icon: '₿', unlocked: false }
]

const mockCertificates = [
  {
    id: '1',
    course: { title: 'Bitcoin desde Cero', thumbnail_url: null },
    issued_at: '2024-01-15',
    certificate_number: 'NODO360-BTC-001-2024'
  }
]

export default function DashboardPage() {
  const userName = 'Estudiante Demo'

  return (
    <div className="min-h-screen bg-[#1a1f2e]">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-[#ff6b35] to-[#f7931a] text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm md:text-base font-semibold">
          <span>📊</span>
          <span>Vista Demo del Dashboard</span>
          <span className="hidden sm:inline">-</span>
          <Link href="/cursos" className="underline hover:text-white/90 transition">
            Explorar Cursos Gratuitos
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-b from-[#252b3d] to-[#1a1f2e] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                ¡Hola, {userName}! 👋
              </h1>
              <p className="text-white/60">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold text-white">{mockStats.currentStreak}</div>
                  <div className="text-xs text-white/60">días de racha</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon={Trophy}
            value={`${mockStats.totalProgress}%`}
            label="Progreso Total"
            color="from-[#ff6b35] to-[#FFD700]"
          />
          <StatCard
            icon={BookOpen}
            value={mockStats.activeCourses}
            label="Cursos Activos"
            color="from-blue-500 to-cyan-500"
          />
          <StatCard
            icon={CheckCircle2}
            value={`${mockStats.completedLessons}/${mockStats.totalLessons}`}
            label="Lecciones"
            sublabel={`${Math.round((mockStats.completedLessons / mockStats.totalLessons) * 100)}% completado`}
            color="from-green-500 to-emerald-500"
          />
          <StatCard
            icon={Clock}
            value={`${mockStats.hoursStudied}h`}
            label="Tiempo Total"
            sublabel="Esta semana: 3.2h"
            color="from-purple-500 to-pink-500"
          />
        </div>

        {/* Continue Learning */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Continúa donde lo dejaste</h2>
          <div className="bg-gradient-to-br from-[#ff6b35]/20 to-[#FFD700]/20 border-2 border-[#ff6b35]/30 rounded-2xl p-6 md:p-8 hover:scale-[1.02] transition-all duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#ff6b35] to-[#FFD700] rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-[#ff6b35] font-semibold mb-1">Fundamentos de Bitcoin</div>
                <h3 className="text-2xl font-bold text-white mb-2">Introducción a la Criptografía</h3>
                <div className="flex items-center gap-4 text-white/60 text-sm mb-4">
                  <span>Lección 6 de 8</span>
                  <span>•</span>
                  <span>75% completado</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#ff6b35] to-[#FFD700] rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
              <Link
                href="/cursos/fundamentos-bitcoin/intro-criptografia"
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff6b35] to-[#FFD700] text-white font-bold rounded-xl hover:scale-105 transition-all duration-300"
              >
                <Play className="w-5 h-5" />
                Continuar Lección
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Courses */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Mis Cursos</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {mockEnrollments.map((enrollment) => (
                  <CourseCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Logros y Badges</h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {mockAchievements.map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>

            {/* Certificates */}
            {mockCertificates.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Certificados</h2>
                <div className="space-y-4">
                  {mockCertificates.map((cert) => (
                    <CertificateCard key={cert.id} certificate={cert} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Activity Timeline */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Actividad Reciente</h2>
              <div className="space-y-3">
                {mockActivities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#ff6b35]/20 to-[#FFD700]/20 border border-[#ff6b35]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <activity.icon className="w-4 h-4 text-[#ff6b35]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">{activity.title}</p>
                      <p className="text-white/50 text-xs mt-1">{activity.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Estadísticas Rápidas</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Racha actual</span>
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-white font-bold">{mockStats.currentStreak} días</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Certificados</span>
                  <span className="text-white font-bold">{mockStats.certificatesEarned}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Nivel</span>
                  <span className="text-white font-bold">Intermedio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, value, label, sublabel, color }: any) {
  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-white/60 text-sm">{label}</div>
      {sublabel && <div className="text-white/40 text-xs mt-1">{sublabel}</div>}
    </div>
  )
}

function CourseCard({ enrollment }: any) {
  const { course, progress_percentage, completed_lessons, total_lessons, completed } = enrollment

  const levelColors = {
    beginner: 'from-green-500 to-emerald-500',
    intermediate: 'from-blue-500 to-cyan-500',
    advanced: 'from-purple-500 to-pink-500'
  }

  const levelLabels = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado'
  }

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#ff6b35]/50 transition-all duration-300">
      <div className="w-full h-32 bg-gradient-to-br from-[#ff6b35]/20 to-[#FFD700]/20 rounded-xl flex items-center justify-center mb-4">
        <BookOpen className="w-12 h-12 text-[#ff6b35]" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{course.title}</h3>
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${levelColors[course.level as keyof typeof levelColors]} text-white font-semibold`}>
          {levelLabels[course.level as keyof typeof levelLabels]}
        </span>
        {completed && (
          <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-semibold">
            ✓ Completado
          </span>
        )}
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-white/60 mb-2">
          <span>{completed_lessons} de {total_lessons} lecciones</span>
          <span className="font-bold text-white">{progress_percentage}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#ff6b35] to-[#FFD700] rounded-full transition-all duration-500"
            style={{ width: `${progress_percentage}%` }}
          />
        </div>
      </div>
      {completed ? (
        <button className="w-full py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-bold rounded-xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          Descargar Certificado
        </button>
      ) : (
        <Link
          href={`/cursos/${course.slug}`}
          className="block w-full py-3 bg-white/10 hover:bg-white/20 text-white text-center font-bold rounded-xl transition-all duration-300"
        >
          Continuar
        </Link>
      )}
    </div>
  )
}

function AchievementBadge({ achievement }: any) {
  return (
    <div className={`aspect-square rounded-2xl p-4 flex flex-col items-center justify-center ${
      achievement.unlocked
        ? 'bg-gradient-to-br from-[#ff6b35]/20 to-[#FFD700]/20 border-2 border-[#ff6b35]/50'
        : 'bg-white/5 border border-white/10 opacity-50'
    } hover:scale-110 transition-all duration-300 cursor-pointer`}>
      <div className="text-3xl mb-2">{achievement.icon}</div>
      <div className="text-xs text-white text-center font-semibold">{achievement.name}</div>
      {!achievement.unlocked && achievement.progress && (
        <div className="text-[10px] text-white/50 mt-1">{achievement.progress}/{achievement.max}</div>
      )}
    </div>
  )
}

function CertificateCard({ certificate }: any) {
  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#FFD700]/50 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-xl flex items-center justify-center flex-shrink-0">
          <Award className="w-10 h-10 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{certificate.course.title}</h3>
          <p className="text-white/60 text-sm mb-2">
            Emitido el {new Date(certificate.issued_at).toLocaleDateString('es-ES')}
          </p>
          <p className="text-white/50 text-xs font-mono">{certificate.certificate_number}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          Descargar PDF
        </button>
        <button className="flex-1 py-2 bg-[#0077b5]/20 hover:bg-[#0077b5]/30 border border-[#0077b5]/50 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2">
          <Share2 className="w-4 h-4" />
          LinkedIn
        </button>
      </div>
    </div>
  )
}
