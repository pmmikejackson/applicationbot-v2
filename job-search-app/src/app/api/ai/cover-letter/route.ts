import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { CoverLetterGenerator } from '@/services/ai/CoverLetterGenerator'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { jobId, userBackground, userSkills, tone } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
        userId: session.user.id
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Generate cover letter
    const coverLetter = await CoverLetterGenerator.generateCoverLetter({
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description || undefined,
      userBackground,
      userSkills,
      tone
    })

    // Save as document
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        jobId: jobId,
        type: 'cover_letter',
        title: `Cover Letter - ${job.title} at ${job.company}`,
        content: coverLetter,
        aiModel: 'gpt-3.5-turbo',
        generatedAt: new Date()
      }
    })

    return NextResponse.json({
      content: coverLetter,
      documentId: document.id
    })
  } catch (error) {
    console.error('Error generating cover letter:', error)
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
}