// Link validation script: checks event URLs and records results.
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { normalizeUrl } from '@/lib/url';

const prisma = new PrismaClient();

const TIMEOUT_MS = 8000;
const BATCH_LIMIT = Number(process.env.LINKCHECK_LIMIT || 100);
const DAYS_WINDOW = Number(process.env.LINKCHECK_DAYS || 30);

async function headOrGet(url: string): Promise<{ ok: boolean; status?: number; error?: string }>{
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Try HEAD first
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal as any });
    if (!res.ok || !res.status) {
      // Some servers reject HEAD; fallback to GET
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal as any });
    }
    return { ok: res.ok, status: res.status };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  } finally {
    clearTimeout(id);
  }
}

async function main() {
  console.log('🔎 Link Check: start');
  const now = new Date();
  const past = new Date(now.getTime() - DAYS_WINDOW * 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      OR: [
        { createdAt: { gte: past } },
        { startDateTime: { gte: past } },
      ],
    },
    select: { id: true, sourceUrl: true, ticketUrl: true },
    orderBy: { createdAt: 'desc' },
    take: BATCH_LIMIT,
  });

  const urls: { url: string; eventId: string }[] = [];
  for (const e of events) {
    if (e.ticketUrl) urls.push({ url: e.ticketUrl, eventId: e.id });
    else if (e.sourceUrl) urls.push({ url: e.sourceUrl, eventId: e.id });
  }

  let okCount = 0, badCount = 0;
  for (const item of urls) {
    const { url, eventId } = item;
    const res = await headOrGet(normalizeUrl(url) || url);
    await prisma.linkCheck.create({
      data: {
        url,
        statusCode: res.status,
        ok: !!res.ok,
        error: res.error,
        eventId,
      },
    });
    if (res.ok) okCount++; else badCount++;
    await new Promise(r => setTimeout(r, 150)); // politeness
  }

  console.log(`✅ Link Check complete. OK: ${okCount}, Broken: ${badCount}`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => {
  console.error('❌ Link Check error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
