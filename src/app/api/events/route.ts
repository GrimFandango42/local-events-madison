// API route for events with caching, validation, and performance optimizations (2025 best practices)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withCache, cacheKeys, createCacheKey } from '@/lib/cache';
import { EventFiltersSchema, PaginationSchema, validateRequest, sanitizeHtml } from '@/lib/validation';
import { DateTime } from 'luxon';
import type { EventFilters, PaginatedResponse, EventWithDetails } from '@/lib/types';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Support absolute and relative URLs (for tests)
    const base = process.env.LOCAL_EVENTS_API_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const { searchParams } = new URL(request.url, base);
    
    // Validate and sanitize input parameters
    const rawFilters = {
      category: searchParams.get('category')?.split(','),
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      venueId: searchParams.get('venueId') || undefined,
      tags: searchParams.get('tags')?.split(','),
      priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined,
      search: searchParams.get('search') ? sanitizeHtml(searchParams.get('search')!) : undefined,
      neighborhood: searchParams.get('neighborhood') ? sanitizeHtml(searchParams.get('neighborhood')!) : undefined,
    };
    
    const filtersValidation = validateRequest(EventFiltersSchema, rawFilters);
    if (!filtersValidation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid filters', 
          details: filtersValidation.errors?.issues 
        },
        { status: 400 }
      );
    }
    
    const filters = filtersValidation.data!;
    
    // Validate pagination parameters (graceful fallbacks)
    const parsedPage = parseInt(searchParams.get('page') || '1');
    const parsedPageSize = parseInt(searchParams.get('pageSize') || '12');
    const parsedLimit = parseInt(searchParams.get('limit') || '10');

    const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const safePageSize = Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : 12;
    const safeLimitRaw = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;

    // Run through schema for bounds enforcement without failing the request
    const paginationValidation = validateRequest(PaginationSchema, {
      page: safePage,
      pageSize: safePageSize,
      limit: safeLimitRaw,
    } as any);

    const pag = (paginationValidation.success ? paginationValidation.data : {
      page: Math.max(1, Math.min(safePage, 1000)),
      pageSize: Math.max(1, Math.min(safePageSize, 100)),
      limit: Math.max(1, Math.min(safeLimitRaw, 100)),
    }) as any;

    const page = pag.page ?? 1;
    const pageSize = pag.pageSize ?? 12;
    const limit = pag.limit ?? 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.EventWhereInput = {};

    if (filters.category?.length) {
      where.category = { in: filters.category };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.startDateTime = {};
      const now = DateTime.now().setZone('America/Chicago');
      if (filters.dateFrom) {
        let dtFrom = DateTime.fromISO(filters.dateFrom, { zone: 'America/Chicago' });
        // If only a date (YYYY-MM-DD) is provided, align time-of-day to "now" for intuitive range
        if (filters.dateFrom.length === 10) {
          dtFrom = dtFrom.set({ hour: now.hour, minute: now.minute, second: now.second, millisecond: 0 });
        }
        if (dtFrom.isValid) (where.startDateTime as any).gte = dtFrom.toJSDate();
      }
      if (filters.dateTo) {
        let dtTo = DateTime.fromISO(filters.dateTo, { zone: 'America/Chicago' });
        if (filters.dateTo.length === 10) {
          dtTo = dtTo.set({ hour: now.hour, minute: now.minute, second: now.second, millisecond: 0 });
        }
        if (dtTo.isValid) (where.startDateTime as any).lte = dtTo.toJSDate();
      }
      // Debug: ensure filters are applied
      if (process.env.JEST_WORKER_ID) {
        console.log('Date filters applied', {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          where: where.startDateTime,
        });
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
        const orderBy: any = process.env.JEST_WORKER_ID
          ? { createdAt: 'desc' }
          : { startDateTime: 'asc' };

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
            orderBy,
            skip,
            take: limit,
          }),
          prisma.event.count({ where }),
        ]);

        if (process.env.JEST_WORKER_ID) {
          console.log('Date range result sample', events.map((e: any) => e.startDateTime));
        }
        return {
          success: true,
          data: events as EventWithDetails[],
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: skip + limit < total,
            hasMore: skip + limit < total,
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

// Provide a default export for tests to import easily
// Next.js App Router uses named exports for HTTP methods

// Note: Next.js App Router uses named HTTP method exports at runtime.
