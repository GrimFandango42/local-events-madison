// API route for events with caching and performance optimizations
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withCache, cacheKeys, createCacheKey } from '@/lib/cache';
import { DateTime } from 'luxon';
import type { EventFilters, PaginatedResponse, EventWithDetails } from '@/lib/types';
import type { Prisma } from '@prisma/client';

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
      neighborhood: searchParams.get('neighborhood') || undefined,
    };

    // Enhanced pagination with proper defaults
    const parseIntSafe = (value: string | null, def: number) => {
      const n = parseInt(String(value ?? ''));
      return Number.isFinite(n) && n > 0 ? n : def;
    };
    const page = parseIntSafe(searchParams.get('page'), 1);
    const pageSize = parseIntSafe(searchParams.get('pageSize'), 12); // Better default for UI
    const limit = Math.min(parseIntSafe(searchParams.get('limit'), pageSize), 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.EventWhereInput = {};

    if (filters.category?.length) {
      where.category = { in: filters.category };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.startDateTime = {};
      if (filters.dateFrom) {
        const dtFrom = DateTime.fromISO(filters.dateFrom, { zone: 'America/Chicago' });
        if (dtFrom.isValid) (where.startDateTime as any).gte = dtFrom.toJSDate();
      }
      if (filters.dateTo) {
        const dtTo = DateTime.fromISO(filters.dateTo, { zone: 'America/Chicago' });
        if (dtTo.isValid) (where.startDateTime as any).lte = dtTo.toJSDate();
      }
    } else {
      // By default, only show future events
      where.startDateTime = { gte: DateTime.now().setZone('America/Chicago').toJSDate() };
    }

    if (filters.venueId) {
      where.venueId = filters.venueId;
    }

    if (filters.tags?.length) {
      // SQLite schema stores tags as a comma-separated string; emulate array filter with contains
      where.OR = filters.tags.map((t) => ({ tags: { contains: t } }));
    }

    // Note: SQLite schema stores price as a string (e.g., "Free", "$10").
    // Numeric comparisons (priceMax) are not reliable here, so we skip priceMax filtering in DB.

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    // Filter by venue neighborhood if provided
    if (filters.neighborhood) {
      where.venue = {
        is: {
          neighborhood: {
            equals: filters.neighborhood,
          },
        },
      };
    }

    // Create cache key based on filters and pagination
    const cacheKey = createCacheKey(
      'events',
      page.toString(),
      limit.toString(),
      JSON.stringify(filters)
    );

    // Cache events data for better performance (1 minute for search results)
    const response = await withCache(
      cacheKey,
      async (): Promise<PaginatedResponse<EventWithDetails>> => {
        // Optimized parallel queries with selective fields
        const [events, total] = await Promise.all([
          prisma.event.findMany({
            where,
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              startDateTime: true,
              endDateTime: true,
              timezone: true,
              allDay: true,
              price: true,
              ticketUrl: true,
              imageUrl: true,
              tags: true,
              customLocation: true,
              sourceUrl: true,
              status: true,
              venue: {
                select: {
                  id: true,
                  name: true,
                  venueType: true,
                  address: true,
                  city: true,
                  state: true,
                  neighborhood: true,
                  website: true,
                },
              },
              source: {
                select: {
                  id: true,
                  name: true,
                  sourceType: true,
                },
              },
              createdAt: true,
            },
            orderBy: { startDateTime: 'asc' },
            skip,
            take: limit,
          }),
          prisma.event.count({ where }),
        ]);

        return {
          success: true,
          data: events as EventWithDetails[],
          pagination: {
            page,
            pageSize: limit,
            total,
            hasMore: skip + limit < total,
            // Legacy fields for compatibility
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: skip + limit < total,
            hasPrev: page > 1,
          },
        };
      },
      filters.search ? 30 : 60 // Cache search results for 30s, regular results for 1 minute
    );

    return NextResponse.json(
      response,
      {
        headers: {
          'Cache-Control': filters.search 
            ? 'public, s-maxage=30, stale-while-revalidate=60'
            : 'public, s-maxage=60, stale-while-revalidate=120',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Events API error:', error);
    const message = (error as Error)?.message || 'Failed to fetch events';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// Per tests, POST should be disallowed for this route
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed' },
    { status: 405 }
  );
}

// Provide a default export so Jest tests can import as a module
export default { GET, POST };
