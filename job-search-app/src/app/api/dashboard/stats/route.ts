import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get job counts
    const [totalJobs, appliedJobs, applications] = await Promise.all([
      prisma.job.count({
        where: { userId: session.user.id }
      }),
      prisma.job.count({
        where: { 
          userId: session.user.id,
          status: 'applied'
        }
      }),
      prisma.application.findMany({
        where: { userId: session.user.id },
        include: {
          job: true
        },
        orderBy: {
          appliedAt: 'asc'
        }
      })
    ])

    // Count applications by status
    const interviewsScheduled = applications.filter(app => 
      app.status === 'interview' || app.status === 'phone_screen'
    ).length

    const offersReceived = applications.filter(app => 
      app.status === 'offer' || app.status === 'accepted'
    ).length

    // Find oldest application without response
    const oldestApplication = applications.find(app => 
      app.status === 'applied'
    )

    const stats = {
      totalJobs,
      appliedJobs,
      interviewsScheduled,
      offersReceived,
      oldestApplication: oldestApplication ? {
        title: oldestApplication.job.title,
        company: oldestApplication.job.company,
        appliedAt: oldestApplication.appliedAt.toISOString(),
        daysAgo: Math.floor((Date.now() - oldestApplication.appliedAt.getTime()) / (1000 * 60 * 60 * 24))
      } : null
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}