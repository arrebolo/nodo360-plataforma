'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ============================================
// TIPOS
// ============================================

export interface SortableItem {
  id: string
  [key: string]: any
}

interface SortableListProps<T extends SortableItem> {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, isDragging: boolean) => React.ReactNode
  renderOverlay?: (item: T) => React.ReactNode
  disabled?: boolean
  className?: string
}

// ============================================
// SORTABLE ITEM WRAPPER
// ============================================

interface SortableItemWrapperProps {
  id: string
  disabled?: boolean
  children: React.ReactNode
}

export function SortableItemWrapper({ id, disabled, children }: SortableItemWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto' as const,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

// ============================================
// DRAG HANDLE (para arrastrar desde un punto especifico)
// ============================================

interface DragHandleProps {
  className?: string
}

export function DragHandle({ className = '' }: DragHandleProps) {
  return (
    <div className={`cursor-grab active:cursor-grabbing ${className}`}>
      <svg
        className="w-5 h-5 text-white/40 hover:text-white/60 transition"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="9" cy="6" r="1.5" />
        <circle cx="15" cy="6" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="18" r="1.5" />
        <circle cx="15" cy="18" r="1.5" />
      </svg>
    </div>
  )
}

// ============================================
// SORTABLE LIST COMPONENT
// ============================================

export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  renderOverlay,
  disabled = false,
  className = ''
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere mover 8px antes de iniciar drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const activeItem = activeId ? items.find(item => item.id === activeId) : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      onReorder(newItems)
    }
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={items.map(i => i.id)}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <div className={className}>
          {items.map((item) => (
            <SortableItemWrapper key={item.id} id={item.id} disabled={disabled}>
              {renderItem(item, item.id === activeId)}
            </SortableItemWrapper>
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem && renderOverlay ? (
          renderOverlay(activeItem)
        ) : activeItem ? (
          <div className="opacity-80 shadow-2xl">
            {renderItem(activeItem, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
