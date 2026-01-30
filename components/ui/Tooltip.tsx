'use client'

import { useState, ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

interface TooltipProps {
  content: string
  children?: ReactNode
  className?: string
}

export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="cursor-help"
        tabIndex={0}
        role="button"
        aria-describedby="tooltip"
      >
        {children || <HelpCircle className="w-4 h-4 text-white/40 hover:text-white/60 transition-colors" />}
      </div>
      {isVisible && (
        <div
          id="tooltip"
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-dark-tertiary border border-white/20 rounded-lg shadow-xl max-w-xs whitespace-normal"
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-dark-tertiary" />
          </div>
        </div>
      )}
    </div>
  )
}

interface LabelWithTooltipProps {
  label: string
  tooltip: string
  required?: boolean
  htmlFor?: string
}

export function LabelWithTooltip({ label, tooltip, required, htmlFor }: LabelWithTooltipProps) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-white mb-2">
      {label} {required && '*'}
      <Tooltip content={tooltip} />
    </label>
  )
}
