import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  icon?: LucideIcon
  title: string
  description?: string
}

export function PageHeader({ icon: Icon, title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-[#f7931a]/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-[#f7931a]" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {description && (
            <p className="text-white/60 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
