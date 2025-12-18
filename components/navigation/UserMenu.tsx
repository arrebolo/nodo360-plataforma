'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  Shield,
  BookOpenCheck,
  GraduationCap,
  Rocket
} from 'lucide-react'

type UserMenuProps = {
  fullName?: string | null
  email?: string | null
  highestRole?: string | null
  roles?: string[] | null
}

export function UserMenu({ fullName, email, highestRole, roles }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const safeRoles = roles ?? []

  const hasAdmin = safeRoles.includes('admin') || highestRole === 'admin'
  const hasInstructor = safeRoles.includes('instructor') || highestRole === 'instructor'
  const hasMentor = safeRoles.includes('mentor') || highestRole === 'mentor'
  const hasAnyAdminRole = hasAdmin || hasInstructor || hasMentor

  // Etiqueta que sale bajo el nombre
  const roleLabel = hasAdmin
    ? 'Admin Nodo360'
    : hasInstructor
    ? 'Instructor Nodo360'
    : hasMentor
    ? 'Mentor Nodo360'
    : 'Miembro'

  // Nombre visible
  const nameToShow =
    (fullName && fullName.trim()) ||
    (email ? email.split('@')[0] : '') ||
    'Usuario'

  const initial = nameToShow.charAt(0).toUpperCase()

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleClose = () => setIsOpen(false)

  return (
    <div className="relative z-[60]" ref={menuRef}>
      {/* Botón compacto Web3 */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-[#14151f] via-[#101322] to-[#101822] px-3 py-1.5 border border-white/10 shadow-lg shadow-black/40 hover:border-[#5cffc4]/60 transition-all"
      >
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#5cffc4] to-[#00b3ff] text-sm font-semibold text-black shadow-inner shadow-black/40">
          {initial}
        </div>

        <div className="flex flex-col items-start leading-tight mr-1">
          <span className="text-xs text-gray-400 max-w-[120px] truncate">
            {email}
          </span>
          <span className="text-[11px] font-semibold text-[#5cffc4] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {roleLabel}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Backdrop + panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-sm" />

          <div className="fixed right-4 top-16 z-[70] w-[320px] sm:right-8 sm:top-16">
            <div className="rounded-2xl border border-white/10 bg-[#05060b]/95 shadow-2xl shadow-black/60 overflow-hidden">
              {/* Cabecera usuario */}
              <div className="px-4 py-4 bg-gradient-to-r from-[#0b1020] via-[#080b16] to-[#05060b] border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#5cffc4] to-[#00b3ff] text-base font-semibold text-black shadow-inner shadow-black/40">
                    {initial}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">
                      {nameToShow}
                    </span>
                    <span className="text-[11px] text-gray-400 max-w-[180px] truncate">
                      {email}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#5cffc4]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ACCESO NODO360
                    </span>
                  </div>
                </div>
              </div>

              {/* MI CUENTA */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-[11px] font-semibold text-gray-400 mb-2">
                  MI CUENTA
                </p>

                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={handleClose}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-[#5cffc4]" />
                      Mi panel
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Progreso & XP
                    </span>
                  </Link>

                  <Link
                    href="/perfil"
                    onClick={handleClose}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#00b3ff]" />
                      Mi perfil
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Datos personales
                    </span>
                  </Link>

                  <Link
                    href="/dashboard/certificados"
                    onClick={handleClose}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#f7931a]" />
                      Certificados
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Ver y descargar
                    </span>
                  </Link>
                </div>
              </div>

              {/* APRENDIZAJE */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-[11px] font-semibold text-gray-400 mb-2">
                  APRENDIZAJE
                </p>

                <div className="space-y-1">
                  <Link
                    href="/cursos"
                    onClick={handleClose}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-gray-200 hover:bg:white/5 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpenCheck className="w-4 h-4 text-[#5cffc4]" />
                      Catálogo de cursos
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Todo Nodo360
                    </span>
                  </Link>

                  <Link
                    href="/gobernanza"
                    onClick={handleClose}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#00b3ff]" />
                      Gobernanza
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Vota y participa
                    </span>
                  </Link>

                  <Link
                    href="/proyectos"
                    onClick={handleClose}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-[#f97316]" />
                      Proyectos
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Construyendo Web3
                    </span>
                  </Link>
                </div>
              </div>

              {/* ADMINISTRACIÓN – secciones separadas */}
              {hasAnyAdminRole && (
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-[11px] font-semibold text-gray-400 mb-2">
                    ADMINISTRACIÓN
                  </p>

                  <div className="space-y-1">
                    {hasAdmin && (
                      <Link
                        href="/admin/configuracion"
                        onClick={handleClose}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-gray-200 hover:bg-[#5cffc4]/10 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4 text-[#5cffc4]" />
                          Panel administrador
                        </span>
                        <span className="text-[10px] text-gray-500">
                          Ajustes generales
                        </span>
                      </Link>
                    )}

                    {hasInstructor && (
                      <Link
                        href="/admin/cursos"
                        onClick={handleClose}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-gray-200 hover:bg-[#5cffc4]/10 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4 text-[#5cffc4]" />
                          Panel instructor
                        </span>
                        <span className="text-[10px] text-gray-500">
                          Gestión de cursos
                        </span>
                      </Link>
                    )}

                    {hasMentor && (
                      <Link
                        href="/admin/mentor"
                        onClick={handleClose}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-gray-200 hover:bg-[#5cffc4]/10 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4 text-[#5cffc4]" />
                          Panel mentor
                        </span>
                        <span className="text-[10px] text-gray-500">
                          Seguimiento alumnos
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Pie: marca + logout */}
              <div className="px-4 py-3 flex items-center justify-between text-[11px] text-gray-500">
                <span>Nodo360 · Educación Bitcoin & Web3</span>
                <Link
                  href="/logout"
                  onClick={handleClose}
                  className="inline-flex items-center gap-1 rounded-full border border-red-500/40 px-3 py-1 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  Cerrar sesión
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
