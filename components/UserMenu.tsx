// components/UserMenu.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { LogOut, User, FileText, Notebook, Shield, GraduationCap, Calendar, Users, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUserRole } from "../hooks/useUserRole"

interface EducatorStatus {
  isEducator: boolean
  educatorType: 'instructor' | 'mentor' | null
  status: string | null
}

export function UserMenu() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [educatorStatus, setEducatorStatus] = useState<EducatorStatus>({
    isEducator: false,
    educatorType: null,
    status: null
  })
  const menuRef = useRef<HTMLDivElement | null>(null)

  const { role, isAdmin, isInstructor, isMentor, isLoading } = useUserRole()

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setEmail(user?.email ?? null)

      // Verificar si el usuario es educador (instructor/mentor)
      if (user) {
        const { data: educator } = await supabase
          .from('educators' as never)
          .select('type, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        const typedEducator = educator as { type: string; status: string } | null
        if (typedEducator) {
          setEducatorStatus({
            isEducator: true,
            educatorType: typedEducator.type as 'instructor' | 'mentor',
            status: typedEducator.status
          })
        }
      }
    }

    loadUser()
  }, [supabase])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón avatar Web3 style */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-white/5 border border-white/15 px-3 py-1.5 hover:bg-white/10 hover:border-[#f7931a]/60 transition-all shadow-lg shadow-black/30"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b35] via-[#f7931a] to-[#ffcc80] flex items-center justify-center text-xs font-bold text-black">
          {email ? email.charAt(0).toUpperCase() : 'N'}
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-xs text-white/60 leading-tight">
            {isLoading ? 'Cargando…' : role === 'admin' ? 'Admin' : role === 'instructor' ? 'Instructor' : role === 'mentor' ? 'Mentor' : 'Alumno'}
          </span>
          <span className="text-xs text-white/80 max-w-[120px] truncate">{email}</span>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#050816]/95 border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl z-[60] overflow-hidden">
          {/* Header usuario */}
          <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#ff6b35]/10 to-[#f7931a]/5">
            <p className="text-xs text-white/60">Conectado como</p>
            <p className="text-sm font-semibold text-white truncate">{email}</p>
            {!isLoading && role && (
              <p className="text-[11px] text-[#f7931a] mt-1 uppercase tracking-wide">
                Rol: {role}
              </p>
            )}
          </div>

          <div className="py-2">
            {/* Perfil */}
            <Link
              href="/perfil"
              className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-[#f7931a]" />
              </span>
              <div className="flex flex-col">
                <span>Mi perfil</span>
                <span className="text-[11px] text-white/40">Editar datos y redes</span>
              </div>
            </Link>

            {/* Dashboard */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                <Notebook className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <div className="flex flex-col">
                <span>Mi panel</span>
                <span className="text-[11px] text-white/40">Progreso, XP y cursos</span>
              </div>
            </Link>

            {/* Certificados */}
            <Link
              href="/dashboard/certificados"
              className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
              </span>
              <div className="flex flex-col">
                <span>Certificados</span>
                <span className="text-[11px] text-white/40">Descargar en PDF</span>
              </div>
            </Link>
          </div>

          {/* MENTORÍA */}
          <div className="py-2 border-t border-white/10">
            <p className="px-4 py-1 text-[11px] text-white/40 uppercase tracking-wide">Mentoría</p>

            {/* Mis Sesiones */}
            <Link
              href="/dashboard/mis-sesiones"
              className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
              </span>
              <div className="flex flex-col">
                <span>Mis sesiones</span>
                <span className="text-[11px] text-white/40">Ver sesiones agendadas</span>
              </div>
            </Link>

            {/* Solicitar Sesión */}
            <Link
              href="/formadores"
              className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-blue-400" />
              </span>
              <div className="flex flex-col">
                <span>Buscar formador</span>
                <span className="text-[11px] text-white/40">Agendar una sesión</span>
              </div>
            </Link>

            {/* Ser Instructor - Solo mostrar si NO es educador activo */}
            {!educatorStatus.isEducator && (
              <Link
                href="/dashboard/ser-formador"
                className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                </span>
                <div className="flex flex-col">
                  <span>Ser formador</span>
                  <span className="text-[11px] text-white/40">Aplica como instructor</span>
                </div>
              </Link>
            )}

            {/* Panel de Formador - Solo para educadores activos */}
            {educatorStatus.isEducator && (
              <Link
                href="/dashboard/formador"
                className="flex items-center gap-2 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/10"
                onClick={() => setOpen(false)}
              >
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                </span>
                <div className="flex flex-col">
                  <span>Panel de formador</span>
                  <span className="text-[11px] text-white/40">
                    {educatorStatus.educatorType === 'mentor' ? 'Mentor' : 'Instructor'}
                  </span>
                </div>
              </Link>
            )}
          </div>

          <div className="py-2 border-t border-white/10">
            {/* Mentor panel */}
            {isMentor && (
              <Link
                href="/mentor"
                className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5 text-violet-300" />
                </span>
                <div className="flex flex-col">
                  <span>Panel mentor</span>
                  <span className="text-[11px] text-white/40">Alumnos y sesiones</span>
                </div>
              </Link>
            )}

            {/* Instructor panel */}
            {isInstructor && (
              <Link
                href="/instructor/cursos"
                className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                  <Notebook className="w-3.5 h-3.5 text-teal-300" />
                </span>
                <div className="flex flex-col">
                  <span>Panel instructor</span>
                  <span className="text-[11px] text-white/40">Gestionar cursos</span>
                </div>
              </Link>
            )}

            {/* Admin panel */}
            {isAdmin && (
              <>
                <Link
                  href="/admin/cursos"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#ffcc80] hover:bg-white/5"
                  onClick={() => setOpen(false)}
                >
                  <span className="w-6 h-6 rounded-lg bg-[#f7931a]/10 flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-[#f7931a]" />
                  </span>
                  <div className="flex flex-col">
                    <span>Panel administrador</span>
                    <span className="text-[11px] text-white/40">Configurar Nodo360</span>
                  </div>
                </Link>

                {/* Gestionar Formadores - Solo Admin */}
                <Link
                  href="/admin/formadores"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#ffcc80] hover:bg-white/5"
                  onClick={() => setOpen(false)}
                >
                  <span className="w-6 h-6 rounded-lg bg-[#f7931a]/10 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-[#f7931a]" />
                  </span>
                  <div className="flex flex-col">
                    <span>Gestionar formadores</span>
                    <span className="text-[11px] text-white/40">Solicitudes y promociones</span>
                  </div>
                </Link>
              </>
            )}
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10 border-t border-white/10"
          >
            <span className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
              <LogOut className="w-3.5 h-3.5" />
            </span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  )
}
