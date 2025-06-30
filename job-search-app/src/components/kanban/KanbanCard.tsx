import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Application {
  id: string
  jobId: string
  title: string
  company: string
  location?: string
  platform: string
  status: string
  interviewCount: number
  appliedAt: string
  notes?: string
}

interface KanbanCardProps {
  application: Application
  isDragging?: boolean
}

export function KanbanCard({ application, isDragging = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: application.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      linkedin: 'bg-blue-100 text-blue-800',
      indeed: 'bg-green-100 text-green-800',
      builtin: 'bg-purple-100 text-purple-800',
      ziprecruiter: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[platform] || colors.other
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'rotate-3 shadow-lg' : ''
      }`}
    >
      <div className="space-y-2">
        <div>
          <h4 className="font-medium text-gray-900 text-sm leading-tight">
            {application.title}
          </h4>
          <p className="text-sm text-gray-600">{application.company}</p>
          {application.location && (
            <p className="text-xs text-gray-500">{application.location}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(
              application.platform
            )}`}
          >
            {application.platform}
          </span>
          
          {application.interviewCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {application.interviewCount} interview{application.interviewCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="text-xs text-gray-500">
          Applied {formatDate(application.appliedAt)}
        </div>

        {application.notes && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            {application.notes.length > 100
              ? `${application.notes.substring(0, 100)}...`
              : application.notes}
          </div>
        )}
      </div>
    </div>
  )
}