import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
    const days = Math.min(parseInt(searchParams.get('days') || '30', 10), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const entries = await prisma.linkCheck.findMany({
      where: { checkedAt: { gte: since } },
      orderBy: { checkedAt: 'desc' },
      take: limit,
    });

    const summary = entries.reduce(
      (acc, e) => {
        try {
          const host = new URL(e.url).hostname;
          const key = e.ok ? 'ok' : 'bad';
          acc[key] = (acc[key] || 0) + 1;
          acc.byHost[host] = acc.byHost[host] || { ok: 0, bad: 0 };
          acc.byHost[host][key]++;
        } catch {}
        return acc;
      },
      { ok: 0, bad: 0, byHost: {} as Record<string,{ ok: number; bad: number }>} 
    );

    return NextResponse.json({ success: true, data: entries, summary });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to fetch link checks' }, { status: 500 });
  }
}

