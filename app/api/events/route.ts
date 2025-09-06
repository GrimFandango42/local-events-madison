// API route for events
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { EventFilters, PaginatedResponse, EventWithDetails } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: EventFilters = {
      category: searchParams.get('category')?.split(',') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      venueId: searchParams.get('venueId') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined,
      search: searchParams.get('search') || undefined,
    };

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.category?.length) {
      where.category = { in: filters.category };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.startDateTime = {};
      if (filters.dateFrom) {
        where.startDateTime.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.startDateTime.lte = new Date(filters.dateTo);
      }
    } else {
      // By default, only show future events
      where.startDateTime = { gte: new Date() };
    }

    if (filters.venueId) {
      where.venueId = filters.venueId;
    }

    if (filters.tags?.length) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters.priceMax) {
      where.OR = [
        { priceMin: { lte: filters.priceMax * 100 } }, // Convert to cents
        { priceMin: null }, // Free events
      ];
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Get events with relations
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          venue: true,
          source: {
            select: {
              name: true,
              sourceType: true,
            },
          },
        },
        orderBy: { startDateTime: 'asc' },
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    const response: PaginatedResponse<EventWithDetails> = {
      success: true,
      data: events as EventWithDetails[],
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
    console.error('Events API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create new event
    const event = await prisma.event.create({
      data: {
        ...body,
        startDateTime: new Date(body.startDateTime),
        endDateTime: body.endDateTime ? new Date(body.endDateTime) : null,
        priceMin: body.priceMin ? Math.round(body.priceMin * 100) : null,
        priceMax: body.priceMax ? Math.round(body.priceMax * 100) : null,
      },
      include: {
        venue: true,
        source: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: event,
      message: 'Event created successfully',
    });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
}