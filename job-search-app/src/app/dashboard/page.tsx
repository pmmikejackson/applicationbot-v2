'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  company: string
  location?: string
  salaryRange?: string
  platform: string
  postedDate?: string
  status: string
  url?: string
}

interface DashboardStats {
  totalJobs: number
  appliedJobs: number
  interviewsScheduled: number
  offersReceived: number
  oldestApplication?: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    appliedJobs: 0,
    interviewsScheduled: 0,
    offersReceived: 0
  })
  const [availableJobs, setAvailableJobs] = useState<Job[]>([])
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, jobsResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/jobs')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json()
        setAvailableJobs(jobsData.available || [])
        setAppliedJobs(jobsData.applied || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyToJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId })
      })

      if (response.ok) {
        fetchDashboardData() // Refresh data
      }
    } catch (error) {
      console.error('Error applying to job:', error)
    }
  }

  if (status === 'loading' || isLoading) {
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
              <h1 className="text-3xl font-bold text-gray-900">Job Search Dashboard</h1>
              <p className="mt-1 text-gray-500">Welcome back, {session?.user?.firstName}</p>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/dashboard/kanban" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Kanban Board
              </Link>
              <Link 
                href="/dashboard/email-setup" 
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                Email Setup
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{stats.totalJobs}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{stats.appliedJobs}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Applied</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.appliedJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{stats.interviewsScheduled}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Interviews</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.interviewsScheduled}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{stats.offersReceived}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Offers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.offersReceived}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Jobs */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Available Jobs ({availableJobs.length})</h2>
            </div>
            <div className="p-6">
              {availableJobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No available jobs found.</p>
                  <Link 
                    href="/dashboard/email-setup" 
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Set up email integration to start tracking jobs
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.company}</p>
                          {job.location && (
                            <p className="text-sm text-gray-500">{job.location}</p>
                          )}
                          {job.salaryRange && (
                            <p className="text-sm text-green-600">{job.salaryRange}</p>
                          )}
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {job.platform}
                            </span>
                            {job.postedDate && (
                              <span className="text-xs text-gray-500">
                                {new Date(job.postedDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <button
                            onClick={() => handleApplyToJob(job.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {availableJobs.length > 5 && (
                    <div className="text-center">
                      <Link 
                        href="/dashboard/jobs" 
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View all {availableJobs.length} jobs
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Applied Jobs */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Applications ({appliedJobs.length})</h2>
            </div>
            <div className="p-6">
              {appliedJobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No applications yet.</p>
                  <p className="mt-2 text-sm text-gray-400">
                    Apply to jobs to start tracking your progress
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appliedJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.company}</p>
                          {job.location && (
                            <p className="text-sm text-gray-500">{job.location}</p>
                          )}
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Applied
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {job.platform}
                            </span>
                          </div>
                        </div>
                        <Link 
                          href="/dashboard/kanban"
                          className="ml-4 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Progress
                        </Link>
                      </div>
                    </div>
                  ))}
                  {appliedJobs.length > 5 && (
                    <div className="text-center">
                      <Link 
                        href="/dashboard/kanban" 
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View all applications
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}