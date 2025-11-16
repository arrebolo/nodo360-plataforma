import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar (desktop) y Bottom Nav (mobile) */}
      <Sidebar />

      {/* TopBar solo en mobile */}
      <TopBar />

      {/* Main Content */}
      <main className="lg:pl-16 pb-16 lg:pb-0">
        {children}
      </main>
    </div>
  )
}
