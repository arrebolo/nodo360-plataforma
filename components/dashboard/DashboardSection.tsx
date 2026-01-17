interface DashboardSectionProps {
  title: string
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5
}

export default function DashboardSection({
  title,
  children,
  columns = 4
}: DashboardSectionProps) {
  const gridCols = {
    2: 'grid-cols-2 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">
        {title}
      </h2>
      <div className={`grid gap-3 ${gridCols[columns]}`}>
        {children}
      </div>
    </div>
  )
}
