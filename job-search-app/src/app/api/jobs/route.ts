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

    const [availableJobs, appliedJobs] = await Promise.all([
      prisma.job.findMany({
        where: {
          userId: session.user.id,
          status: 'available'
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.job.findMany({
        where: {
          userId: session.user.id,
          status: 'applied'
        },
        include: {
          application: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    return NextResponse.json({
      available: availableJobs,
      applied: appliedJobs
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const jobData = await request.json()

    const job = await prisma.job.create({
      data: {
        ...jobData,
        userId: session.user.id,
        isManualEntry: true
      }
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}