import { Sidebar } from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(900px_circle_at_20%_-10%,rgba(249,115,22,0.10),transparent_55%),radial-gradient(700px_circle_at_90%_0%,rgba(16,185,129,0.08),transparent_55%),linear-gradient(to_bottom,#fbfbfb,#f7f7f7)]">
      {/* Sidebar (desktop) y Bottom Nav (mobile) */}
      <Sidebar />

      {/* Main Content */}
      <main className="lg:pl-16 pb-16 lg:pb-0">
        {children}
      </main>
    </div>
  )
}


