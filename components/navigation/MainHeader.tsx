 // components/navigation/MainHeader.tsx
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from './UserMenu'
import { getUserRoles } from '@/lib/roles/getUserRoles'

export default async function MainHeader() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let fullName: string | null = null
  let highestRole: string | null = null
  let roles: string[] = []

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    fullName = profile?.full_name ?? null

    // Reutilizamos la misma lógica que en el dashboard
    try {
      const rolesData = await getUserRoles(user.id)
      highestRole = rolesData.highestRole
      roles = rolesData.roles
    } catch (error) {
      console.error('[MainHeader] Error obteniendo roles:', error)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* Logo + navegación izquierda */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/imagenes/logo-nodo360.png.png"
              alt="Nodo360"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="hidden text-sm font-semibold text-white sm:inline">
              Nodo360
            </span>
          </Link>

          <nav className="hidden items-center gap-4 text-sm text-gray-300 sm:flex">
            <Link href="/cursos" className="hover:text-white">
              Cursos
            </Link>
            <Link href="/gobernanza" className="hover:text-white">
              Gobernanza
            </Link>
            <Link href="/proyectos" className="hover:text-white">
              Proyectos
            </Link>
          </nav>
        </div>

        {/* Zona derecha */}
        <div className="flex items-center gap-3">
          {!user && (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-gray-100 hover:border-white/50"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-[#ff6b35] to-[#f7931a] px-3 py-1.5 text-xs font-semibold text-black"
              >
                Empezar gratis
              </Link>
            </>
          )}

          {user && (
            <UserMenu
              fullName={fullName}
              email={user.email}
              highestRole={highestRole}
              roles={roles}
            />
          )}
        </div>
      </div>
    </header>
  )
}
