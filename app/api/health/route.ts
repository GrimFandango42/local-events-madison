// Health check and diagnostics endpoint
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_request: NextRequest) {
  const info: any = {
    ok: true,
    node: process.version,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      LOCAL_EVENTS_API_URL: process.env.LOCAL_EVENTS_API_URL || 'not set',
    },
    prisma: 'unknown',
    timestamps: { now: new Date().toISOString() },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    info.prisma = 'ok';
  } catch (e: any) {
    info.prisma = 'error';
    info.prismaError = e?.message || String(e);
  }

  return NextResponse.json(info);
}


