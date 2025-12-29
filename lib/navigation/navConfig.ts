import {
  Home,
  Route,
  BookOpen,
  Users,
  Vote,
  Award,
  Settings,
  LayoutDashboard,
  MessageCircle,
  GraduationCap,
  User,
  Trophy,
  FileText,
  type LucideIcon,
} from 'lucide-react'

// =====================================================
// TIPOS
// =====================================================

export interface NavItem {
  key: string
  label: string
  href?: string
  icon: LucideIcon
  type: 'link' | 'smart-home' // smart-home usa getStartRoute()
  badge?: string
  requiresAuth?: boolean
  adminOnly?: boolean
}

// =====================================================
// NAVEGACION PUBLICA (sidebar publico, header)
// =====================================================

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  {
    key: 'home',
    label: 'Inicio',
    icon: Home,
    type: 'smart-home', // Usa navegacion inteligente
  },
  {
    key: 'routes',
    label: 'Rutas',
    href: '/dashboard/rutas',
    icon: Route,
    type: 'link',
    requiresAuth: true,
  },
  {
    key: 'courses',
    label: 'Cursos',
    href: '/cursos',
    icon: BookOpen,
    type: 'link',
  },
  {
    key: 'community',
    label: 'Comunidad',
    href: '/comunidad',
    icon: Users,
    type: 'link',
  },
  {
    key: 'governance',
    label: 'Gobernanza',
    href: '/gobernanza',
    icon: Vote,
    type: 'link',
  },
  {
    key: 'mentorship',
    label: 'Mentoria',
    href: '/mentoria',
    icon: GraduationCap,
    type: 'link',
  },
]

// =====================================================
// NAVEGACION HEADER (sin Inicio, sin Dashboard)
// =====================================================

export const HEADER_NAV_ITEMS: NavItem[] = [
  {
    key: 'routes',
    label: 'Rutas',
    href: '/dashboard/rutas',
    icon: Route,
    type: 'link',
    requiresAuth: true,
  },
  {
    key: 'courses',
    label: 'Cursos',
    href: '/cursos',
    icon: BookOpen,
    type: 'link',
  },
  {
    key: 'governance',
    label: 'Gobernanza',
    href: '/gobernanza', // CORRECTO
    icon: Vote,
    type: 'link',
  },
  {
    key: 'community',
    label: 'Comunidad',
    href: '/comunidad',
    icon: Users,
    type: 'link',
  },
  {
    key: 'mentorship',
    label: 'Mentoria',
    href: '/mentoria',
    icon: GraduationCap,
    type: 'link',
  },
]

// =====================================================
// NAVEGACION SIDEBAR COMPLETA (con Dashboard)
// =====================================================

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  {
    key: 'home',
    label: 'Inicio',
    icon: Home,
    type: 'smart-home',
  },
  {
    key: 'routes',
    label: 'Rutas',
    href: '/dashboard/rutas',
    icon: Route,
    type: 'link',
    requiresAuth: true,
  },
  {
    key: 'courses',
    label: 'Cursos',
    href: '/cursos',
    icon: BookOpen,
    type: 'link',
  },
  {
    key: 'community',
    label: 'Comunidad',
    href: '/comunidad',
    icon: Users,
    type: 'link',
  },
  {
    key: 'governance',
    label: 'Gobernanza',
    href: '/gobernanza', // CORRECTO
    icon: Vote,
    type: 'link',
  },
  {
    key: 'mentorship',
    label: 'Mentoria',
    href: '/mentoria',
    icon: GraduationCap,
    type: 'link',
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    type: 'link',
    requiresAuth: true,
  },
]

// =====================================================
// NAVEGACION DASHBOARD (usuario autenticado)
// =====================================================

export const DASHBOARD_NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    type: 'link',
    requiresAuth: true,
  },
  {
    key: 'my-route',
    label: 'Mi Ruta',
    href: '/mi-ruta',
    icon: Route,
    type: 'link',
    requiresAuth: true,
  },
  {
    key: 'my-courses',
    label: 'Mis Cursos',
    href: '/mis-cursos',
    icon: BookOpen,
    type: 'link',
    requiresAuth: true,
  },
  {
    key: 'certificates',
    label: 'Certificados',
    href: '/certificados',
    icon: Award,
    type: 'link',
    requiresAuth: true,
  },
  {
    key: 'governance',
    label: 'Gobernanza',
    href: '/gobernanza', // CORRECTO
    icon: Vote,
    type: 'link',
    requiresAuth: true,
  },
]

// =====================================================
// NAVEGACION ADMIN
// =====================================================

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    key: 'admin-dashboard',
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    type: 'link',
    adminOnly: true,
  },
  {
    key: 'admin-users',
    label: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users,
    type: 'link',
    adminOnly: true,
  },
  {
    key: 'admin-courses',
    label: 'Cursos',
    href: '/admin/cursos',
    icon: BookOpen,
    type: 'link',
    adminOnly: true,
  },
  {
    key: 'admin-governance',
    label: 'Gobernanza',
    href: '/admin/gobernanza', // Admin path
    icon: Vote,
    type: 'link',
    adminOnly: true,
  },
  {
    key: 'admin-gamification',
    label: 'Gamificacion',
    href: '/admin/gamificacion',
    icon: Trophy,
    type: 'link',
    adminOnly: true,
  },
  {
    key: 'admin-settings',
    label: 'Configuracion',
    href: '/admin/configuracion',
    icon: Settings,
    type: 'link',
    adminOnly: true,
  },
]

// =====================================================
// ITEMS SECUNDARIOS (footer del sidebar)
// =====================================================

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  {
    key: 'settings',
    label: 'Configuracion',
    href: '/configuracion',
    icon: Settings,
    type: 'link',
  },
  {
    key: 'profile',
    label: 'Perfil',
    href: '/perfil',
    icon: User,
    type: 'link',
  },
]

// =====================================================
// HELPERS
// =====================================================

export type NavContext = 'public' | 'header' | 'sidebar' | 'dashboard' | 'admin'

export function getNavItemsByContext(context: NavContext): NavItem[] {
  switch (context) {
    case 'public':
      return PUBLIC_NAV_ITEMS
    case 'header':
      return HEADER_NAV_ITEMS
    case 'sidebar':
      return SIDEBAR_NAV_ITEMS
    case 'dashboard':
      return DASHBOARD_NAV_ITEMS
    case 'admin':
      return ADMIN_NAV_ITEMS
    default:
      return PUBLIC_NAV_ITEMS
  }
}

/**
 * Verifica si una ruta esta activa
 * Para rutas como /cursos, /rutas, /gobernanza usa startsWith
 */
export function isNavItemActive(href: string | undefined, pathname: string): boolean {
  if (!href) return false

  // Rutas que deben matchear con startsWith
  const prefixRoutes = ['/cursos', '/dashboard/rutas', '/gobernanza', '/admin']

  if (prefixRoutes.some((prefix) => href.startsWith(prefix))) {
    return pathname.startsWith(href)
  }

  return pathname === href
}
