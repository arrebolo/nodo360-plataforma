'use client'

import { useState } from 'react'
import type { ListBlock } from '@/types/lesson-content'

interface InteractiveListProps {
  block: ListBlock
}

export function InteractiveList({ block }: InteractiveListProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  const toggleCheck = (index: number) => {
    setChecked((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const ListTag = block.ordered ? 'ol' : 'ul'

  return (
    <div className="my-6">
      <ListTag className={`space-y-2 ${block.ordered ? 'list-decimal list-inside' : ''}`}>
        {block.items.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-gray-300 leading-relaxed group"
          >
            {!block.ordered && (
              <button
                onClick={() => toggleCheck(index)}
                className="flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 border-gray-600 hover:border-orange-500 transition-colors flex items-center justify-center"
              >
                {checked[index] && (
                  <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )}
            <span className={checked[index] ? 'line-through text-gray-500' : ''}>
              {item}
            </span>
          </li>
        ))}
      </ListTag>
    </div>
  )
}
