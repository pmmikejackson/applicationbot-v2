import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { applicationId, status } = await request.json()

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: 'Application ID and status are required' },
        { status: 400 }
      )
    }

    // Get current application to track status change
    const currentApp = await prisma.application.findUnique({
      where: { id: applicationId }
    })

    if (!currentApp || currentApp.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Update application status
    const updateData: any = { status }

    // Handle special status transitions
    if (status === 'interview' && currentApp.status !== 'interview') {
      updateData.interviewCount = currentApp.interviewCount + 1
      updateData.firstInterviewAt = currentApp.firstInterviewAt || new Date()
      updateData.lastInterviewAt = new Date()
    } else if (status === 'interview' && currentApp.status === 'interview') {
      updateData.interviewCount = currentApp.interviewCount + 1
      updateData.lastInterviewAt = new Date()
    } else if (status === 'phone_screen') {
      updateData.phoneScreenAt = new Date()
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date()
    } else if (status === 'offer') {
      updateData.offerReceivedAt = new Date()
    } else if (status === 'accepted') {
      updateData.acceptedAt = new Date()
    }

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: updateData
    })

    // Create status history record
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: currentApp.status,
        toStatus: status
      }
    })

    return NextResponse.json({ success: true, application: updatedApplication })
  } catch (error) {
    console.error('Error updating application status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}