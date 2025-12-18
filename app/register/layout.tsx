import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crear cuenta | Nodo360',
  description: 'Regístrate en Nodo360 para acceder a cursos y certificados',
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
