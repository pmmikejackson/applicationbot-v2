import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const applications = await prisma.application.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        job: true
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    // Transform for frontend
    const transformedApplications = applications.map(app => ({
      id: app.id,
      jobId: app.jobId,
      title: app.job.title,
      company: app.job.company,
      location: app.job.location,
      platform: app.job.platform,
      status: app.status,
      interviewCount: app.interviewCount,
      appliedAt: app.appliedAt.toISOString(),
      notes: app.notes
    }))

    return NextResponse.json(transformedApplications)
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}