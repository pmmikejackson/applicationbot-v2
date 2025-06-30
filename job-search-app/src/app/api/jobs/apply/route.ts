import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Update job status to applied
    const updatedJob = await prisma.job.update({
      where: {
        id: jobId,
        userId: session.user.id
      },
      data: {
        status: 'applied'
      }
    })

    // Create application record
    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        jobId: jobId,
        status: 'applied'
      }
    })

    // Create status history
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        toStatus: 'applied'
      }
    })

    return NextResponse.json({ success: true, application })
  } catch (error) {
    console.error('Error applying to job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}