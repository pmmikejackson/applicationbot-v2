'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Job Search Consolidation</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/auth/signin"
                className="text-gray-600 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            Centralize Your
            <span className="text-blue-600"> Job Search</span>
          </h1>
          <p className="mt-6 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-8 md:text-xl md:max-w-3xl">
            Never lose track of job applications again. Consolidate opportunities from LinkedIn, Indeed, BuiltIn, and ZipRecruiter in one powerful dashboard.
          </p>
          <div className="mt-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-12">
            <div className="rounded-md shadow">
              <Link 
                href="/auth/signup"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Start Free Trial
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link 
                href="/auth/signin"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
                📧
              </div>
              <h3 className="text-lg font-medium text-gray-900">Email Integration</h3>
              <p className="mt-2 text-base text-gray-500">
                Connect your email to automatically track job notifications from all major platforms.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white mb-4">
                📊
              </div>
              <h3 className="text-lg font-medium text-gray-900">Kanban Tracking</h3>
              <p className="mt-2 text-base text-gray-500">
                Visualize your application progress from Applied to Accepted with drag-and-drop boards.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white mb-4">
                🤖
              </div>
              <h3 className="text-lg font-medium text-gray-900">AI Assistance</h3>
              <p className="mt-2 text-base text-gray-500">
                Generate tailored cover letters and optimize your CV for each job application.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Why Job Seekers Love Us</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <div className="text-4xl font-extrabold text-blue-600">60%</div>
              <div className="mt-2 text-base text-gray-500">Less time on admin tasks</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-green-600">2 weeks</div>
              <div className="mt-2 text-base text-gray-500">Free trial period</div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-purple-600">$9</div>
              <div className="mt-2 text-base text-gray-500">Per month after trial</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-20">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 Job Search Consolidation. US-only service.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}