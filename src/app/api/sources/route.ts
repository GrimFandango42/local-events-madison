// API route for event sources
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { SourceFilters, PaginatedResponse, EventSourceWithStats } from '@/lib/types';
import type { Prisma } from '@prisma/client';

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

    // Pagination (use same defaults as events)
    const parseIntSafe = (value: string | null, def: number) => {
      const n = parseInt(String(value ?? ''));
      return Number.isFinite(n) && n > 0 ? n : def;
    };
    const page = parseIntSafe(searchParams.get('page'), 1);
    const limit = Math.min(parseIntSafe(searchParams.get('limit'), 10), 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.EventSourceWhereInput = {};

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
        { name: { contains: filters.search } },
        { url: { contains: filters.search } },
      ];
    }

    // Get sources with stats
    const [sources, total] = await Promise.all([
      prisma.eventSource.findMany({
        where,
        include: {
          venue: true,
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
              id: true,
              sourceId: true,
              status: true,
              eventsFound: true,
              error: true,
              metadata: true,
              startedAt: true,
              completedAt: true,
              createdAt: true,
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
        // @ts-ignore - parity field used in tests elsewhere
        hasMore: skip + limit < total,
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
