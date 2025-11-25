import { UserRole, ROLE_INFO } from '@/types/roles'

interface RoleBadgeProps {
  role: UserRole
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function RoleBadge({ role, size = 'md', showIcon = true }: RoleBadgeProps) {
  const info = ROLE_INFO[role]

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full font-medium
      ${info.bgColor} ${info.color} ${sizeClasses[size]}
    `}>
      {showIcon && <span>{info.icon}</span>}
      {info.label}
    </span>
  )
}
