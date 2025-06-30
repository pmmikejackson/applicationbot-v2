'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { KanbanCard } from '@/components/kanban/KanbanCard'
import { CelebrationModal } from '@/components/kanban/CelebrationModal'

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

const COLUMNS = [
  { id: 'applied', title: 'Applied', color: 'bg-blue-500' },
  { id: 'phone_screen', title: 'Phone Screen', color: 'bg-yellow-500' },
  { id: 'interview', title: 'Interview', color: 'bg-purple-500' },
  { id: 'offer', title: 'Offer', color: 'bg-green-500' },
  { id: 'accepted', title: 'Accepted', color: 'bg-emerald-500' },
  { id: 'rejected', title: 'Rejected', color: 'bg-red-500' },
  { id: 'declined', title: 'Declined', color: 'bg-gray-500' },
  { id: 'position_closed', title: 'Position Closed', color: 'bg-gray-400' }
]

export default function KanbanBoard() {
  const { data: session } = useSession()
  const [applications, setApplications] = useState<Application[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const applicationId = active.id as string
    const newStatus = over.id as string

    // Find the application being moved
    const application = applications.find(app => app.id === applicationId)
    if (!application) return

    // Check if status actually changed
    if (application.status === newStatus) {
      setActiveId(null)
      return
    }

    // Show celebration if moving to accepted
    if (newStatus === 'accepted') {
      setShowCelebration(true)
    }

    // Update local state immediately for smooth UX
    setApplications(prev =>
      prev.map(app =>
        app.id === applicationId
          ? { ...app, status: newStatus }
          : app
      )
    )

    // Update on server
    try {
      await fetch('/api/applications/update-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId,
          status: newStatus
        })
      })
    } catch (error) {
      console.error('Error updating application status:', error)
      // Revert local state if server update failed
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? { ...app, status: application.status }
            : app
        )
      )
    }

    setActiveId(null)
  }

  const getApplicationsByStatus = (status: string) => {
    return applications.filter(app => app.status === status)
  }

  const activeApplication = applications.find(app => app.id === activeId)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Application Tracker</h1>
              <p className="mt-1 text-gray-500">Drag applications between columns to update status</p>
            </div>
            <div className="text-sm text-gray-500">
              {applications.length} applications being tracked
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                count={getApplicationsByStatus(column.id).length}
              >
                <SortableContext
                  items={getApplicationsByStatus(column.id).map(app => app.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {getApplicationsByStatus(column.id).map((application) => (
                    <KanbanCard
                      key={application.id}
                      application={application}
                    />
                  ))}
                </SortableContext>
              </KanbanColumn>
            ))}
          </div>

          <DragOverlay>
            {activeApplication ? (
              <KanbanCard application={activeApplication} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>

        {applications.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-500 mb-4">
              Start applying to jobs from your dashboard to see them here
            </p>
            <a
              href="/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </a>
          </div>
        )}
      </main>

      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  )
}