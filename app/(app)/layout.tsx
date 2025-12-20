import Sidebar from '@/components/navigation/Sidebar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-app">
      <Sidebar />

      {/* Main content area */}
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  )
}
