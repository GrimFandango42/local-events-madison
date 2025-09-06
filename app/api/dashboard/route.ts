// API route for dashboard statistics
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { DashboardStats } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get dashboard statistics
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
      // Total sources
      prisma.eventSource.count(),

      // Active sources
      prisma.eventSource.count({
        where: { status: 'active' },
      }),

      // Failed sources
      prisma.eventSource.count({
        where: { status: 'failed' },
      }),

      // Total events
      prisma.event.count(),

      // Events in last 7 days
      prisma.event.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
      }),

      // Average success rate
      prisma.eventSource.aggregate({
        _avg: { successRate: true },
      }),

      // Top performing sources
      prisma.eventSource.findMany({
        include: {
          venue: {
            select: { name: true, venueType: true },
          },
          _count: {
            select: { events: true },
          },
        },
        where: { status: 'active' },
        orderBy: [
          { successRate: 'desc' },
          { _count: { events: 'desc' } },
        ],
        take: 5,
      }),

      // Recent events
      prisma.event.findMany({
        include: {
          venue: {
            select: { name: true, venueType: true },
          },
          source: {
            select: { name: true, sourceType: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const stats: DashboardStats = {
      totalSources,
      activeSources,
      failedSources,
      totalEvents,
      eventsLast7Days,
      avgSuccessRate: avgSuccessRate._avg.successRate?.toNumber() || 0,
      topPerformingSources: topSources as any,
      recentEvents: recentEvents as any,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}