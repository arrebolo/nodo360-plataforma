import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Demo | Nodo360',
  description: 'Vista previa del dashboard del estudiante de Nodo360. Explora tus cursos, progreso y certificados.',
  robots: {
    index: false, // No indexar el dashboard demo
    follow: true,
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
