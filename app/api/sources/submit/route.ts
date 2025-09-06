// API route for user source submissions
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { NewSourceSubmission } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: NewSourceSubmission = await request.json();

    // Validate required fields
    if (!body.suggestedName || !body.url || !body.sourceType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if URL already exists
    const existingSource = await prisma.eventSource.findUnique({
      where: { url: body.url },
    });

    if (existingSource) {
      return NextResponse.json(
        { success: false, error: 'This URL is already being monitored' },
        { status: 409 }
      );
    }

    // Check if there's already a pending submission for this URL
    const pendingSubmission = await prisma.userSourceSubmission.findFirst({
      where: {
        url: body.url,
        status: 'pending',
      },
    });

    if (pendingSubmission) {
      return NextResponse.json(
        { success: false, error: 'This URL is already pending review' },
        { status: 409 }
      );
    }

    // Get client IP for tracking
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';

    // Create user submission
    const submission = await prisma.userSourceSubmission.create({
      data: {
        suggestedName: body.suggestedName,
        url: body.url,
        sourceType: body.sourceType as any,
        venueName: body.venueName,
        userIpAddress: clientIP,
        userEmail: body.userEmail,
        submissionReason: body.submissionReason,
        expectedEventTypes: body.expectedEventTypes,
      },
    });

    return NextResponse.json({
      success: true,
      data: submission,
      message: 'Source submission received! We\'ll review it within 24 hours.',
    });
  } catch (error) {
    console.error('Submit source error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit source' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    
    // Get pending submissions for review
    const submissions = await prisma.userSourceSubmission.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}