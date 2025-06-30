import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  count: number
  children: ReactNode
}

export function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  return (
    <div className="flex flex-col">
      <div className={`${color} text-white px-4 py-2 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{title}</h3>
          <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
            {count}
          </span>
        </div>
      </div>
      
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] bg-gray-100 p-3 rounded-b-lg transition-colors ${
          isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''
        }`}
      >
        <div className="space-y-3">
          {children}
        </div>
      </div>
    </div>
  )
}