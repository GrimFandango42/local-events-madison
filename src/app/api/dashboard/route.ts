// API route for dashboard statistics with caching and optimization
import { NextRequest, NextResponse } from 'next/server';
import type { DashboardStats } from '@/lib/types';

// Lazy load heavy dependencies to reduce initial compilation
const getDatabaseClient = async () => {
  const { prisma } = await import('@/lib/db');
  return prisma;
};

const getCache = async () => {
  const { withCache, cacheKeys } = await import('@/lib/cache');
  return { withCache, cacheKeys };
};

export async function GET(request: NextRequest) {
  try {
    // Lazy load dependencies
    const prisma = await getDatabaseClient();
    const { withCache, cacheKeys } = await getCache();
    
    // Cache dashboard data for 2 minutes
    const stats = await withCache(
      cacheKeys.dashboard,
      async (): Promise<DashboardStats> => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Optimized parallel queries with proper select statements
        const [
          totalSources,
          activeSources,
          failedSources,
          totalEvents,
          eventsLast7Days,
          avgSuccessRate,
          topSources,
          recentEvents,
        ] = await Promise.all([
          // Total sources - simple count
          prisma.eventSource.count(),

          // Active sources - optimized count with where clause
          prisma.eventSource.count({
            where: { status: 'active' },
          }),

          // Failed sources - optimized count with where clause
          prisma.eventSource.count({
            where: { status: 'failed' },
          }),

          // Total events - simple count
          prisma.event.count(),

          // Events in last 7 days - optimized count with date filter
          prisma.event.count({
            where: {
              createdAt: { gte: sevenDaysAgo },
            },
          }),

          // Average success rate - optimized aggregate
          prisma.eventSource.aggregate({
            _avg: { successRate: true },
            where: { status: 'active' }, // Only calculate for active sources
          }),

          // Top performing sources - optimized with select
          prisma.eventSource.findMany({
            select: {
              id: true,
              name: true,
              url: true,
              sourceType: true,
              successRate: true,
              totalAttempts: true,
              venue: {
                select: { 
                  id: true,
                  name: true, 
                  venueType: true 
                },
              },
              createdAt: true,
            },
            where: { 
              status: 'active',
              successRate: { gt: 0 } // Only sources with some success
            },
            orderBy: [
              { successRate: 'desc' },
              { totalAttempts: 'desc' },
              { createdAt: 'desc' },
            ],
            take: 5,
          }),

          // Recent events - optimized with selective fields
          prisma.event.findMany({
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              startDateTime: true,
              endDateTime: true,
              price: true,
              imageUrl: true,
              customLocation: true,
              sourceUrl: true,
              venue: {
                select: { 
                  id: true,
                  name: true, 
                  venueType: true,
                  address: true,
                },
              },
              source: {
                select: { 
                  id: true,
                  name: true, 
                  sourceType: true 
                },
              },
              createdAt: true,
            },
            where: {
              status: 'published', // Only show published events
              startDateTime: { gte: new Date() }, // Only future/current events
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }),
        ]);

        return {
          totalSources,
          activeSources,
          failedSources,
          totalEvents,
          eventsLast7Days,
          avgSuccessRate: (avgSuccessRate._avg.successRate as unknown as number) || 0,
          topPerformingSources: topSources as any,
          recentEvents: recentEvents as any,
        };
      },
      120 // Cache for 2 minutes
    );

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
