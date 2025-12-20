import { PublicHeader } from '@/components/navigation/PublicHeader'
import { SlimSidebar } from '@/components/navigation/SlimSidebar'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#070a10]">
      <PublicHeader />
      <SlimSidebar />
      <main className="pt-16 lg:pl-16">
        {children}
      </main>
    </div>
  )
}
