// API route for user source submissions
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { NewSourceSubmission } from '@/lib/types';
import { z } from 'zod';

const submissionSchema = z.object({
  suggestedName: z.string().min(2),
  url: z.string().url(),
  sourceType: z.enum(['restaurant','venue','organization','festival','other','cultural','community']).default('venue'),
  venueName: z.string().optional(),
  expectedEventTypes: z.array(z.string()).optional(),
  submissionReason: z.string().max(1000).optional(),
  userEmail: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const body: NewSourceSubmission = submissionSchema.parse(raw);

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

    // For SQLite-minimal schema, persist a paused EventSource as the submission record
    const created = await prisma.eventSource.create({
      data: {
        name: body.suggestedName,
        url: body.url,
        sourceType: body.sourceType,
        isActive: false,
        status: 'paused',
        // Store minimal config as JSON string fields in current schema
        scrapingConfig: JSON.stringify({ method: 'playwright', waitTime: 3000 }),
        extractionRules: JSON.stringify({}),
      },
    });

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Submission received. Source created in paused state for review.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues.map(i => i.message).join('; ') }, { status: 400 });
    }
    console.error('Submit source error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit source' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'paused').toLowerCase();

    // In the minimal SQLite schema, we treat paused EventSources as pending submissions
    const submissions = await prisma.eventSource.findMany({
      where: {
        isActive: false,
        status: status as any, // 'paused' by default
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        url: true,
        sourceType: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: submissions,
      meta: { count: submissions.length },
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
