// API route for event sources
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { SourceFilters, PaginatedResponse, EventSourceWithStats } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: SourceFilters = {
      sourceType: searchParams.get('sourceType')?.split(',') || undefined,
      status: searchParams.get('status')?.split(',') || undefined,
      venueId: searchParams.get('venueId') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.sourceType?.length) {
      where.sourceType = { in: filters.sourceType };
    }

    if (filters.status?.length) {
      where.status = { in: filters.status };
    }

    if (filters.venueId) {
      where.venueId = filters.venueId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { url: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Get sources with stats
    const [sources, total] = await Promise.all([
      prisma.eventSource.findMany({
        where,
        include: {
          venue: {
            select: {
              name: true,
              venueType: true,
            },
          },
          _count: {
            select: {
              events: true,
              scrapingLogs: true,
            },
          },
          scrapingLogs: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              status: true,
              eventsFound: true,
              durationMs: true,
              createdAt: true,
              errorMessage: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.eventSource.count({ where }),
    ]);

    const response: PaginatedResponse<EventSourceWithStats> = {
      success: true,
      data: sources.map(source => ({
        ...source,
        recentLogs: source.scrapingLogs,
      })) as EventSourceWithStats[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Sources API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create new event source
    const source = await prisma.eventSource.create({
      data: {
        ...body,
        nextScrapeDue: new Date(Date.now() + body.scrapeFrequencyHours * 60 * 60 * 1000),
      },
      include: {
        venue: true,
        _count: {
          select: {
            events: true,
            scrapingLogs: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: source,
      message: 'Event source created successfully',
    });
  } catch (error) {
    console.error('Create source error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event source' },
      { status: 500 }
    );
  }
}