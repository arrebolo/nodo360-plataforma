import type { CourseTabsProps, CourseTab } from '@/types/course-system'

const tabs: { value: CourseTab; label: string; icon: string }[] = [
  { value: 'resumen', label: 'Resumen', icon: '📋' },
  { value: 'modulos', label: 'Módulos', icon: '📚' },
  { value: 'material', label: 'Material', icon: '📄' },
  { value: 'preguntas', label: 'Preguntas', icon: '💬' },
]

export function CourseTabs({ active, onChange }: CourseTabsProps) {
  return (
    <div
      className="border-b border-nodo-icon mb-8"
      role="tablist"
      aria-label="Secciones del curso"
    >
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = active === tab.value

          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.value}`}
              onClick={() => onChange(tab.value)}
              className={`
                flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap
                ${
                  isActive
                    ? 'text-brand border-b-2 border-brand'
                    : 'text-white/60 hover:text-white border-b-2 border-transparent'
                }
              `}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}


